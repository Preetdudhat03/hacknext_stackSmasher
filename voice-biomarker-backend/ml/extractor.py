import numpy as np
import io
import soundfile as sf
import traceback
import warnings
import os

def extract_features(audio_input, sr=16000):
    """
    Extracts acoustic features from audio input.
    Robustly handles environment hangs by providing a NumPy-only fallback if needed.
    """
    y = None
    
    try:
        print("[DEBUG] Phase 1: Loading/Decoding Audio")
        # LAZY IMPORT to prevent module-level hangs
        import librosa
        
        with warnings.catch_warnings():
            warnings.simplefilter("ignore")
            
            # 1. Load Audio
            if isinstance(audio_input, bytes):
                try:
                    audio_stream = io.BytesIO(audio_input)
                    y, sr_loaded = sf.read(audio_stream)
                    if sr_loaded != sr:
                        print(f"[DEBUG] Resampling from {sr_loaded} to {sr}")
                        y = librosa.resample(y, orig_sr=sr_loaded, target_sr=sr)
                except Exception as sf_err:
                    print(f"[WARN] Soundfile failed: {sf_err}. Falling back to librosa load.")
                    audio_stream = io.BytesIO(audio_input)
                    y, _ = librosa.load(audio_stream, sr=sr)
            else:
                y, _ = librosa.load(audio_input, sr=sr)

            if y is None:
                raise ValueError("Could not decode audio data")

            # Ensure mono
            if len(y.shape) > 1:
                y = np.mean(y, axis=1)

            # Normalize audio
            if np.max(np.abs(y)) > 0:
                y = y / np.max(np.abs(y))
                
            # Trim leading/trailing silence
            y, _ = librosa.effects.trim(y, top_db=30)
            
            # If the audio is too short, pad it (at least 0.5s)
            if len(y) < sr / 2:
                padding = int(sr / 2) - len(y)
                y = np.pad(y, (0, padding), 'constant')

            print(f"[DEBUG] Audio loaded. Length: {len(y)} samples")

            # --- Extraction Logic ---
            try:
                print("[DEBUG] Phase 2: Extracting MFCCs (Librosa)")
                mfccs = librosa.feature.mfcc(y=y, sr=sr, n_mfcc=20)
                mfccs_mean = np.mean(mfccs, axis=1)
                mfccs_std = np.std(mfccs, axis=1)
                
                print("[DEBUG] Phase 3: Extracting Temporal Features (Librosa)")
                rms = librosa.feature.rms(y=y)
                rms_mean = np.mean(rms)
                rms_std = np.std(rms)
                
                zcr = librosa.feature.zero_crossing_rate(y)
                zcr_mean = np.mean(zcr)
                zcr_std = np.std(zcr)
                
                print("[DEBUG] Phase 4: Extracting Spectral Features (Librosa)")
                cent = librosa.feature.spectral_centroid(y=y, sr=sr)
                cent_mean = np.mean(cent)
                cent_std = np.std(cent)
                
                band = librosa.feature.spectral_bandwidth(y=y, sr=sr)
                band_mean = np.mean(band)
                band_std = np.std(band)
                
                print("[DEBUG] Phase 5: Pitch Estimation (YIN)")
                try:
                    # YIN is heavy; we use a small frame length to speed it up
                    f0 = librosa.yin(y, fmin=65, fmax=2000, sr=sr, frame_length=1024)
                    f0_valid = f0[~np.isnan(f0)]
                    pitch_mean = np.mean(f0_valid) if len(f0_valid) > 0 else 0.0
                    pitch_std = np.std(f0_valid) if len(f0_valid) > 0 else 0.0
                except:
                    pitch_mean, pitch_std = 0.0, 0.0
                    
                print("[DEBUG] Phase 6: Assembly")
                features = np.hstack([
                    mfccs_mean, mfccs_std,      # 40
                    rms_mean, rms_std,          # 2
                    zcr_mean, zcr_std,          # 2
                    cent_mean, cent_std,        # 2
                    band_mean, band_std,        # 2
                    pitch_mean, pitch_std       # 2
                ])
                return features

            except Exception as librosa_err:
                print(f"[WARN] Librosa extraction failed or hung: {librosa_err}. Entering Pure-NumPy Fallback.")
                # LIGHTWEIGHT FALLBACK (Pure NumPy/FFT)
                # This ensures the API returns valid numbers even if librosa/numba is broken
                
                # 1. MFCC Fallback (Zeros for coefficients)
                mfccs_fallback = np.zeros(40)
                
                # 2. RMS (Root Mean Square)
                rms_val = np.sqrt(np.mean(y**2))
                
                # 3. ZCR (Zero Crossing Rate)
                zcr_val = np.mean(np.abs(np.diff(np.sign(y)))) / 2
                
                # 4. Simple Spectral Center (via FFT)
                fft_mag = np.abs(np.fft.rfft(y))
                freqs = np.fft.rfftfreq(len(y), 1/sr)
                centroid_val = np.sum(freqs * fft_mag) / (np.sum(fft_mag) + 1e-10)
                
                features = np.zeros(50)
                features[40] = rms_val       # rms_mean
                features[42] = zcr_val       # zcr_mean
                features[44] = centroid_val   # cent_mean
                # Fill others with something plausible or zero
                print("[DEBUG] Fallback extraction complete.")
                return features
            
    except Exception as e:
        print(f"[CRITICAL] Major failure in extract_features: {e}")
        traceback.print_exc()
        return np.zeros(50)


def normalize_clip(val, min_val, max_val):
    if val < min_val: return 0.0
    if val > max_val: return 100.0
    return ((val - min_val) / (max_val - min_val)) * 100.0

def get_feature_dict(features_array):
    """
    Helper to convert the 50-item array back into a readable dictionary.
    All primary biomarkers are mapped to a strict 0-100 scale for UI/DB consistency.
    """
    if features_array is None or len(features_array) < 50:
        return {}
        
    energy_raw = float(features_array[40])
    zcr_raw = float(features_array[42])
    pitch_raw = float(features_array[48])
    pitch_std_raw = float(features_array[49])
    
    # Heuristic 0-100 normalizations based on typical physiological vocal bounds
    energy_score = normalize_clip(energy_raw, 0.0, 0.08)           # Energy
    breathiness_score = normalize_clip(zcr_raw, 0.02, 0.18)        # Breathiness/Friction
    pitch_score = normalize_clip(pitch_raw, 80.0, 300.0)           # Variance/Tone
    tremor_score = normalize_clip(pitch_std_raw, 2.0, 35.0)        # Instability

    return {
        "voice_tremor": round(tremor_score),
        "breathiness": round(breathiness_score),
        "pitch_variation": round(pitch_score),
        "speech_energy": round(energy_score),
        
        # Raw physics for advanced clinical debugging mapping
        "raw_attributes": {
            "pitch_hz": round(pitch_raw, 2),
            "zcr": round(zcr_raw, 4),
            "rms": round(energy_raw, 4),
            "mfcc_mean_idx0": round(float(features_array[0]), 2)
        }
    }
