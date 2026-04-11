from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from routers import analyze
import uvicorn

app = FastAPI(
    title="Voice Biomarker API",
    description="MVP Backend for Voice Health Monitoring System",
    version="1.0.0"
)

# Cross-Origin Resource Sharing (CORS) setup for MVP
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"], # Update for production
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(analyze.router, prefix="/api", tags=["Analysis"])

@app.get("/health")
def health_check():
    return {"status": "healthy"}

if __name__ == "__main__":
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)
