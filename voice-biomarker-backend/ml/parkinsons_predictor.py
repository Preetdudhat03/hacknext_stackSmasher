import os
import joblib
import numpy as np

# Path to models relative to this file
MODEL_DIR = os.path.join(os.path.dirname(os.path.abspath(__file__)), "models", "parkinsons")
MODEL_PATH = os.path.join(MODEL_DIR, "random_forest_model.pkl")
SCALER_PATH = os.path.join(MODEL_DIR, "scaler.pkl")

# Lazy load cache
_MODEL_CACHE = {"model": None, "scaler": None}

def predict_parkinsons(features):
    """
    Predicts Parkinson's risk based on 50 extracted voice features.
    Refined specifically to detect micro-tremors and vocal instability.
    """
    if not os.path.exists(MODEL_PATH) or not os.path.exists(SCALER_PATH):
        # --- ENHANCED HEURISTIC (Neurological Tremor Proxy) ---
        # Parkinsons often shows as increased Jitter (pitch instability) and Shimmer (intensity instability)
        pitch_std = features[49]   # Jitter-proxy
        rms_std = features[41]     # Shimmer-proxy
        
        # Calculate a weighted "Neurological Instability" score (0-100)
        # pitch_std usually ranges 2-40; rms_std usually ranges 0.001-0.015
        jitter_score = min(100, (pitch_std / 35.0) * 100)
        shimmer_score = min(100, (rms_std / 0.012) * 100)
        
        instability_index = (jitter_score * 0.7) + (shimmer_score * 0.3)
        
        is_risky = instability_index > 65.0
        
        return {
            "prediction": "Parkinsons" if is_risky else "Normal",
            "confidence": 0.85 + (instability_index / 1000.0),
            "severity": round(instability_index),
            "is_mock": True
        }

    try:
        # Lazy load on first request
        if _MODEL_CACHE["model"] is None:
            print("[DEBUG] Lazy loading Parkinsons models...")
            _MODEL_CACHE["model"] = joblib.load(MODEL_PATH)
            _MODEL_CACHE["scaler"] = joblib.load(SCALER_PATH)
            
        model = _MODEL_CACHE["model"]
        scaler = _MODEL_CACHE["scaler"]
        
        features_2d = features.reshape(1, -1)
        features_scaled = scaler.transform(features_2d)
        
        prediction = model.predict(features_scaled)
        probabilities = model.predict_proba(features_scaled)[0] if hasattr(model, "predict_proba") else [0.5, 0.5]
        
        confidence = float(max(probabilities))
        result = 'Parkinsons' if prediction[0] == 1 else 'Normal'
        
        # Severity based on probability of the positive class
        severity = float(probabilities[1]) * 100
        
        return {
            "prediction": result,
            "confidence": confidence,
            "severity": round(severity),
            "is_mock": False
        }
    except Exception as e:
        print(f"Error in parkinsons prediction: {e}")
        return {"prediction": "Unknown", "error": str(e)}

