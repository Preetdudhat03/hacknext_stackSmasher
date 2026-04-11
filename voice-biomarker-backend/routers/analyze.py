from fastapi import APIRouter, File, UploadFile, HTTPException
from typing import Dict, Any
from ml.extractor import extract_features
from ml.predictor import generate_insights
# from core.config import settings
# import supabase

router = APIRouter()

@router.post("/analyze", response_model=Dict[str, Any])
async def analyze_voice(audio_file: UploadFile = File(...)):
    if not audio_file.filename.endswith(('.wav', '.webm', '.ogg', '.mp3')):
         raise HTTPException(status_code=400, detail="Invalid audio file type")
    
    try:
        # Read the audio bytes
        audio_bytes = await audio_file.read()
        
        # 1. Feature Extraction
        features = extract_features(audio_bytes)
        
        # 2. Mock Inference & Insight Generation
        analysis_result = generate_insights(features)
        
        # 3. Supposed Database Storing (Mocked for MVP if no creds)
        # if settings.SUPABASE_URL and settings.SUPABASE_KEY:
        #     client = supabase.create_client(settings.SUPABASE_URL, settings.SUPABASE_KEY)
        #     client.table("voice_logs").insert({...}).execute()

        # Combine into response
        return {
            "status": "success",
            "features": features,
            "analysis": analysis_result
        }
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
