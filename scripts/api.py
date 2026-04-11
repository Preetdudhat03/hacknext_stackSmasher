from fastapi import FastAPI, UploadFile, File
import shutil
import os
import sys

# Ensure src path is known
sys.path.append(os.path.dirname(os.path.abspath(__file__)))
from src.predict import predict_voice

app = FastAPI(title="SwaasCare Voice Biomarker API")

MODELS_DIR = os.path.join(os.path.dirname(os.path.abspath(__file__)), "output", "models")
MODEL_PATH = os.path.join(MODELS_DIR, "random_forest_model.pkl")
SCALER_PATH = os.path.join(MODELS_DIR, "scaler.pkl")

@app.post("/predict")
async def predict_audio(file: UploadFile = File(...)):
    """
    Endpoint to receive an audio file and predict depression biomarkers.
    """
    temp_file = f"temp_{file.filename}"
    try:
        # Save uploaded audio to a temporary file
        with open(temp_file, "wb") as buffer:
            shutil.copyfileobj(file.file, buffer)
            
        # Run prediction pipeline
        result = predict_voice(temp_file, MODEL_PATH, SCALER_PATH)
        
        # Cleanup
        if os.path.exists(temp_file):
            os.remove(temp_file)
        
        if result:
            return {"status": "success", "prediction": result}
        else:
            return {"status": "error", "message": "Failed to extract features or model not trained."}
            
    except Exception as e:
        if os.path.exists(temp_file):
            os.remove(temp_file)
        return {"status": "error", "message": str(e)}

if __name__ == "__main__":
    import uvicorn
    # Make sure to run this via standard python api.py
    print("Starting FastAPI Server...")
    uvicorn.run(app, host="0.0.0.0", port=8000)
