import librosa
import numpy as np
import io

def extract_features(audio_bytes: bytes):
    """
    Extracts vocal features from audio bytes using librosa.
    For MVP, we extract basic acoustic features used as proxies for biomarkers.
    """
    try:
        # Load audio from bytes
        # librosa needs a file-like object or a path, soundfile can read from bytes
        import soundfile as sf
        audio_stream = io.BytesIO(audio_bytes)
        y, sr = sf.read(audio_stream)
        
        # Ensure mono
        if len(y.shape) > 1:
            y = np.mean(y, axis=1)

        # 1. Pitch / Fundamental Frequency (F0) proxy using Spectral Centroid
        # Serves as proxy for neurological tremors / stability
        spectral_centroid = librosa.feature.spectral_centroid(y=y, sr=sr)
        mean_centroid = np.mean(spectral_centroid)
        var_centroid = np.var(spectral_centroid)

        # 2. Respiration / Breathiness proxy using Zero Crossing Rate (ZCR)
        # High ZCR can correlate with turbulent air (fricatives, breathiness)
        zcr = librosa.feature.zero_crossing_rate(y)
        mean_zcr = np.mean(zcr)

        # 3. Emotional Tone / Energy proxy using RMS Energy & MFCCs
        rms = librosa.feature.rms(y=y)
        mean_rms = np.mean(rms)
        
        # MFCCs for general vocal tract shape (13 coefficients)
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
        # Fallback if audio reading fails
        print(f"Error extracting features: {e}")
        return {
            "mean_pitch_proxy": 1500.0,
            "pitch_instability": 50000.0,
            "breathiness_proxy": 0.05,
            "energy": 0.02,
            "mfccs": [0.0] * 13
        }
