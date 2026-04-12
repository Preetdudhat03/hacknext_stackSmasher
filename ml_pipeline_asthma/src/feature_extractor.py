import sys, os
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

import librosa
import numpy as np
import warnings

def extract_features(audio_path, sr=16000):
    """
    Extracts acoustic features from an audio file.
    
    Features extracted (mean and std):
    - MFCC (20 coefficients)
    - Pitch (fundamental frequency via YIN)
    - RMS Energy
    - Zero Crossing Rate
    - Spectral Centroid
    - Spectral Bandwidth
    
    Returns:
        np.array: A 1D array containing all extracted feature statistics
    """
    try:
        with warnings.catch_warnings():
            warnings.simplefilter("ignore")
            # Load audio (forces resampling to 16kHz if not already)
            y, sr = librosa.load(audio_path, sr=sr)
            
            # Normalize audio
            if np.max(np.abs(y)) > 0:
                y = y / np.max(np.abs(y))
                
            # Trim leading/trailing silence
            y, _ = librosa.effects.trim(y, top_db=30)
            
            # If the audio is too short, pad it
            if len(y) < sr / 2: # At least 0.5 seconds
                padding = int(sr / 2) - len(y)
                y = np.pad(y, (0, padding), 'constant')
            
            # 1. MFCCs
            mfccs = librosa.feature.mfcc(y=y, sr=sr, n_mfcc=20)
            mfccs_mean = np.mean(mfccs, axis=1)
            mfccs_std = np.std(mfccs, axis=1)
            
            # 2. RMS Energy
            rms = librosa.feature.rms(y=y)
            rms_mean = np.mean(rms)
            rms_std = np.std(rms)
            
            # 3. Zero Crossing Rate (ZCR)
            zcr = librosa.feature.zero_crossing_rate(y)
            zcr_mean = np.mean(zcr)
            zcr_std = np.std(zcr)
            
            # 4. Spectral Centroid
            cent = librosa.feature.spectral_centroid(y=y, sr=sr)
            cent_mean = np.mean(cent)
            cent_std = np.std(cent)
            
            # 5. Spectral Bandwidth
            band = librosa.feature.spectral_bandwidth(y=y, sr=sr)
            band_mean = np.mean(band)
            band_std = np.std(band)
            
            # 6. Pitch (Fundamental frequency) using yin for faster processing
            f0 = librosa.yin(y, fmin=librosa.note_to_hz('C2'), fmax=librosa.note_to_hz('C7'), sr=sr)
            f0_valid = f0[~np.isnan(f0)]
            if len(f0_valid) > 0:
                pitch_mean = np.mean(f0_valid)
                pitch_std = np.std(f0_valid)
            else:
                pitch_mean = 0.0
                pitch_std = 0.0
                
            # Combine all features into a single 1D array
            features = np.hstack([
                mfccs_mean, mfccs_std,
                rms_mean, rms_std,
                zcr_mean, zcr_std,
                cent_mean, cent_std,
                band_mean, band_std,
                pitch_mean, pitch_std
            ])
            
            return features
            
    except Exception as e:
        print(f"Error extracting features from {audio_path}: {e}")
        return None
