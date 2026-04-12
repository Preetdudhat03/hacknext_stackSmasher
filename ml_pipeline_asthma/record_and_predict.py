import os
import sys
import time
import numpy as np
import sounddevice as sd
import soundfile as sf
import joblib

BASE_DIR = os.path.dirname(os.path.abspath(__file__))
sys.path.append(BASE_DIR)

from src.feature_extractor import extract_features

SAMPLE_RATE    = 16000
DURATION       = 15
OUTPUT_FILE    = os.path.join(BASE_DIR, "recorded_voice_asthma.wav")
MODELS_DIR     = os.path.join(BASE_DIR, "output", "models")
MODEL_PATH     = os.path.join(MODELS_DIR, "random_forest_model.pkl")
SCALER_PATH    = os.path.join(MODELS_DIR, "scaler.pkl")

SCRIPT = """
  "When the sunlight strikes raindrops in the air, they act just like a prism
   and form a rainbow. The rainbow is a division of white light into many
   beautiful colours. These take the shape of a long round arch, with its path
   high above, and its two ends apparently beyond the horizon. There is,
   according to legend, a boiling pot of gold at one end. People look, but no
   one ever finds it. When a man looks for something beyond his reach, his
   friends say he is looking for the pot of gold at the end of the rainbow."
"""

def record_audio(duration, sample_rate, output_path):
    print("\n" + "="*60)
    print("  SwaasCare - Voice Biomarker Asthma Screening")
    print("="*60)
    print("\nPLEASE READ THE FOLLOWING SCRIPT ALOUD:\n")
    print(SCRIPT)
    print("-"*60)
    
    print("\n  When you are ready, position yourself near your microphone.")
    print("  The recording will last 15 seconds.")
    input("\n  >>> Press ENTER to start recording when you are ready... <<<\n")
    
    for i in range(3, 0, -1):
        print(f"  Recording starts in {i}...", end="\r", flush=True)
        time.sleep(1)
    
    print(f"\n  [RECORDING] Speak now! ({duration} seconds)         ")
    print("  Press CTRL+C to stop early.\n")

    try:
        audio = sd.rec(
            int(duration * sample_rate),
            samplerate=sample_rate,
            channels=1,
            dtype="float32"
        )
        sd.wait()
    except KeyboardInterrupt:
        sd.stop()
        print("\n  Recording stopped early by user.")
        audio = sd.rec(0)

    print("  [DONE] Recording complete!")
    sf.write(output_path, audio, sample_rate)
    print(f"  Saved to: {output_path}\n")
    return output_path

def run_prediction(audio_path):
    print("  Analyzing vocal biomarkers for asthma...")
    
    if not os.path.exists(MODEL_PATH) or not os.path.exists(SCALER_PATH):
        print("  ERROR: Trained model not found. Please run src/train.py first.")
        return

    model  = joblib.load(MODEL_PATH)
    scaler = joblib.load(SCALER_PATH)

    features = extract_features(audio_path)
    if features is None:
        print("  ERROR: Could not extract features. Try recording again.")
        return

    features_scaled = scaler.transform(features.reshape(1, -1))
    prediction      = model.predict(features_scaled)[0]
    probs           = model.predict_proba(features_scaled)[0]

    normal_pct = round(probs[0] * 100, 1)
    asthma_pct = round(probs[1] * 100, 1)

    print("\n" + "="*60)
    print("  RESULTS")
    print("="*60)

    if prediction == 0:
        print(f"\n  Prediction : NORMAL")
        print(f"  Confidence : Normal {normal_pct}%  |  Asthma {asthma_pct}%")
        print("\n  Your vocal biomarkers appear healthy.")
    else:
        print(f"\n  Prediction : POSSIBLE ASTHMA INDICATOR")
        print(f"  Confidence : Normal {normal_pct}%  |  Asthma {asthma_pct}%")
        print("\n  Your voice shows patterns associated with asthma.")
        print("\n  NOTE: This is a research screening tool only.")
        print("  Please consult a healthcare professional.")

    print("\n" + "="*60)

if __name__ == "__main__":
    audio_path = record_audio(DURATION, SAMPLE_RATE, OUTPUT_FILE)
    run_prediction(audio_path)
