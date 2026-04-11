import librosa
import numpy as np

def extract_features(file_path):
    audio, sr = librosa.load(file_path)
    audio = librosa.util.normalize(audio)

    energy = float(np.mean(librosa.feature.rms(y=audio)))
    zcr = float(np.mean(librosa.feature.zero_crossing_rate(audio)))

    pitch = librosa.yin(audio, fmin=50, fmax=300)
    pitch_mean = float(np.mean(pitch))
    pitch_std = float(np.std(pitch))

    return {
        "energy": energy,
        "zcr": zcr,
        "pitch_mean": pitch_mean,
        "pitch_std": pitch_std
    }