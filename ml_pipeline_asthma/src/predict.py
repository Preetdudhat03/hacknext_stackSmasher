import sys, os
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

import joblib
import numpy as np
from src.feature_extractor import extract_features

def predict_voice(audio_path, model_path, scaler_path):
    """
    Predicts whether a voice sample indicates normal condition or potential asthma.
    """
    print(f"Processing audio: {os.path.basename(audio_path)}")
    
    # 1. Extract features
    features = extract_features(audio_path)
    if features is None:
        print("Failed to extract features.")
        return None
        
    # 2. Load model and scaler
    if not os.path.exists(model_path) or not os.path.exists(scaler_path):
        print("Error: Model or Scaler not found. Please train the model first.")
        return None
        
    model = joblib.load(model_path)
    scaler = joblib.load(scaler_path)
    
    # 3. Scale features
    features_2d = features.reshape(1, -1)
    features_scaled = scaler.transform(features_2d)
    
    # 4. Predict
    prediction = model.predict(features_scaled)
    if hasattr(model, "predict_proba"):
        probabilities = model.predict_proba(features_scaled)[0]
    else:
        probabilities = None
    
    label_map = {0: 'Normal', 1: 'Asthma'}
    result = label_map[prediction[0]]
    
    print("\n--- Prediction Results ---")
    print(f"Prediction: {result}")
    
    if probabilities is not None:
        print(f"Confidence - Normal: {probabilities[0]*100:.2f}%, Asthma: {probabilities[1]*100:.2f}%")
        
    return result

if __name__ == "__main__":
    SAMPLE_AUDIO = r"replace_this_with_audio_path.wav" 
    
    MODELS_DIR = os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), "output", "models")
    MODEL_PATH = os.path.join(MODELS_DIR, "random_forest_model.pkl")
    SCALER_PATH = os.path.join(MODELS_DIR, "scaler.pkl")
    
    if os.path.exists(SAMPLE_AUDIO):
        predict_voice(SAMPLE_AUDIO, MODEL_PATH, SCALER_PATH)
    else:
        print("Please edit the script to provide a valid SAMPLE_AUDIO path to run a test.")
