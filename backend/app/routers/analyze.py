from fastapi import APIRouter, File, UploadFile, HTTPException
from typing import Dict, Any
from ml.extractor import extract_features
from ml.predictor import generate_insights

router = APIRouter()

@router.post("/analyze", response_model=Dict[str, Any])
async def analyze_voice(audio_file: UploadFile = File(...)):
    if not audio_file.filename.endswith(('.wav', '.webm', '.ogg', '.mp3')):
         raise HTTPException(status_code=400, detail="Invalid audio file type")
    
    try:
        print(f"📥 Received analysis request for: {audio_file.filename}")
        # Read the audio bytes
        audio_bytes = await audio_file.read()
        print(f"📏 Audio size: {len(audio_bytes)} bytes")
        
        # 1. Feature Extraction
        features = extract_features(audio_bytes)
        print(f"🧪 Extracted features: {features}")
        
        # 2. Mock Inference & Insight Generation
        analysis_result = generate_insights(features)
        print(f"🧠 Analysis result: {analysis_result}")
        
        # Combine into response matching the frontend expectations
        return {
            "status": "success",
            "extracted_features": features,
            "system_insights": analysis_result.get("system_insights"),
            "health_score": analysis_result.get("health_score"),
            "risk_level": analysis_result.get("risk_level")
        }
        
    except Exception as e:
        print(f"🚨 Error in analyze_voice: {e}")
        raise HTTPException(status_code=500, detail=str(e))
