from fastapi import FastAPI, UploadFile, File, HTTPException
from fastapi.middleware.cors import CORSMiddleware
import numpy as np
import librosa
import joblib
import pandas as pd
import tempfile
import os
import csv
from datetime import datetime

app = FastAPI(title="Parkinson's Voice API", version="1.0.0")

# Configure CORS for frontend access
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Load the model at startup
MODEL_PATH = "model_parkinsons.pkl"
try:
    model = joblib.load(MODEL_PATH)
except Exception as e:
    print(f"Warning: Could not load model at {MODEL_PATH}: {e}")
    model = None

LABELS = {
    0: "Healthy",
    1: "Parkinson's Profile Detected"
}

@app.get("/")
def read_root():
    return {"status": "ok", "message": "Voice Biomarker API is running"}

@app.post("/api/predict")
async def predict_voice(audio_file: UploadFile = File(...)):
    """
    Accepts an audio file upload, extracts vocal features,
    predicts the health condition, and logs the result.
    """
    if model is None:
        raise HTTPException(status_code=500, detail="Model is not loaded")

    # Save uploaded file to a temporary location
    try:
        with tempfile.NamedTemporaryFile(delete=False, suffix=".wav") as temp_audio:
            content = await audio_file.read()
            temp_audio.write(content)
            temp_audio_path = temp_audio.name
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to save uploaded file: {e}")

    try:
        # Load and preprocess audio
        audio, sr = librosa.load(temp_audio_path, sr=None)
        audio = librosa.util.normalize(audio)

        # -----------------------------
        # FEATURE EXTRACTION
        # -----------------------------
        # Remove generic silence to isolate the actual voice
        non_mute_intervals = librosa.effects.split(audio, top_db=20)
        voiced_audio = []
        for start, end in non_mute_intervals:
            voiced_audio.extend(audio[start:end])
        voiced_audio = np.array(voiced_audio)

        # Pitch calculation on strictly voiced segments
        if len(voiced_audio) > 0:
            pitch = librosa.yin(voiced_audio, fmin=65, fmax=500)
            pitch_mean = float(np.mean(pitch))
            pitch_max = float(np.max(pitch))
            pitch_min = float(np.min(pitch))
        else:
            pitch_mean, pitch_max, pitch_min = 150.0, 150.0, 150.0

        features = {
            "MDVP:Fo(Hz)": pitch_mean,
            "MDVP:Fhi(Hz)": pitch_max,
            "MDVP:Flo(Hz)": pitch_min
        }

        # -----------------------------
        # PREDICTION
        # -----------------------------
        df = pd.DataFrame([features])
        df = df[["MDVP:Fo(Hz)", "MDVP:Fhi(Hz)", "MDVP:Flo(Hz)"]]

        prediction_val = int(model.predict(df)[0])
        probs = model.predict_proba(df)[0]

        risk_percentage = round(float(probs[1]) * 100, 2)

        if risk_percentage < 40:
            severity = "Low Risk"
            status_label = "Healthy Profile"
        elif risk_percentage < 70:
            severity = "Moderate Risk"
            status_label = "Early Signs / Mild Profile"
        else:
            severity = "High Risk"
            status_label = "Parkinson's Profile Detected"
            
        trend = "No previous logged data"
        csv_file = "parkinsons_log.csv"
        if os.path.isfile(csv_file):
            try:
                df_log = pd.read_csv(csv_file)
                if "Confidence" in df_log.columns and len(df_log) > 0:
                    last_risk = float(df_log.iloc[-1]["Confidence"])
                    diff = risk_percentage - last_risk
                    if diff > 0:
                        trend = f"INCREASING (+{diff:.2f}%)"
                    elif diff < 0:
                        trend = f"DECREASING (-{abs(diff):.2f}%)"
                    else:
                        trend = "STABLE"
            except Exception as e:
                pass
        
        # -----------------------------
        # MEDICAL INSIGHTS GENERATION
        # -----------------------------
        pitch_range = pitch_max - pitch_min
        insights = []

        if pitch_range < 80:
            insights.append("Monotone Speech Detected: Low vocal flexibility suggests potential muscle rigidity (Hypokinesia).")
        elif pitch_range > 200:
            insights.append("Healthy Vocal Range: High pitch elasticity indicates good vocal fold and neurological control.")
        else:
            insights.append("Normal Pitch Variation: Vocal cords demonstrate standard elasticity.")

        if risk_percentage >= 70:
            insights.append("Neurological Marker: Detected micro-tremors in fundamental frequency often associated with Parkinson's dysphonia.")
        elif risk_percentage < 40:
            insights.append("Clear Phonation: No significant vocal biomarkers correlated with neurological degradation detected.")

        # -----------------------------
        # CONTINUOUS MONITORING LOG
        # -----------------------------
        log_to_csv(features, prediction_val, risk_percentage, severity)

    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error processing audio: {e}")
    finally:
        # Clean up temporary file
        if os.path.exists(temp_audio_path):
            os.remove(temp_audio_path)

    return {
        "status": status_label,
        "severity": severity,
        "risk_percentage": risk_percentage,
        "risk_trend": trend,
        "prediction_code": prediction_val,
        "medical_insights": insights,
        "features": features
    }

def log_to_csv(features, prediction, confidence, severity):
    """
    Logs the extracted features and prediction to a daily log file.
    """
    csv_file = "parkinsons_log.csv"
    file_exists = os.path.isfile(csv_file)
    
    with open(csv_file, mode='a', newline='') as f:
        writer = csv.writer(f)
        if not file_exists:
            writer.writerow(["Timestamp", "Fo(Hz)", "Fhi(Hz)", "Flo(Hz)", "Prediction", "Confidence", "Severity"])
            
        timestamp = datetime.now().isoformat()
        
        row = [
            timestamp,
            features["MDVP:Fo(Hz)"],
            features["MDVP:Fhi(Hz)"],
            features["MDVP:Flo(Hz)"],
            int(prediction),
            confidence,
            severity
        ]
        writer.writerow(row)

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("app:app", host="0.0.0.0", port=8000, reload=True)
