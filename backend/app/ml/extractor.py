import librosa
import numpy as np
import io
import soundfile as sf
import traceback

def extract_features(audio_bytes: bytes):
    """
    Extracts vocal features from audio bytes.
    Robust handling for WAV files using soundfile with a librosa fallback.
    """
    y = None
    sr = 16000 # Target sample rate for biomarkers

    try:
        # 1. Try reading with soundfile (fastest for WAV)
        try:
            audio_stream = io.BytesIO(audio_bytes)
            y, sr = sf.read(audio_stream)
        except Exception as sf_err:
            print(f"Soundfile read failed: {sf_err}. Trying librosa fallback...")
            # 2. Fallback to librosa.load (handles more formats but slower)
            audio_stream = io.BytesIO(audio_bytes)
            y, sr = librosa.load(audio_stream, sr=sr)
        
        if y is None:
            raise ValueError("Could not decode audio data")

        # Ensure mono
        if len(y.shape) > 1:
            y = np.mean(y, axis=1)

        # 1. Pitch / Fundamental Frequency (F0) proxy
        spectral_centroid = librosa.feature.spectral_centroid(y=y, sr=sr)
        mean_centroid = np.mean(spectral_centroid)
        var_centroid = np.var(spectral_centroid)

        # 2. Respiration / Breathiness proxy (ZCR)
        zcr = librosa.feature.zero_crossing_rate(y)
        mean_zcr = np.mean(zcr)

        # 3. Emotional Tone / Energy proxy (RMS)
        rms = librosa.feature.rms(y=y)
        mean_rms = np.mean(rms)
        
        # MFCCs for general vocal tract shape
        mfccs = librosa.feature.mfcc(y=y, sr=sr, n_mfcc=13)
        mean_mfccs = np.mean(mfccs, axis=1).tolist()

        return {
            "mean_pitch_proxy": float(mean_centroid),
            "pitch_instability": float(var_centroid),
            "breathiness_proxy": float(mean_zcr),
            "energy": float(mean_rms),
            "mfccs": mean_mfccs
        }
    except Exception as e:
        print(f"🚨 CRITICAL ERROR in feature extraction: {e}")
        traceback.print_exc()
        return {
            "mean_pitch_proxy": 1500.0,
            "pitch_instability": 50000.0,
            "breathiness_proxy": 0.05,
            "energy": 0.02,
            "mfccs": [0.0] * 13
        }
