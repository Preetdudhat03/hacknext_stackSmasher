# SwaasCare — Voice Biomarker ML Pipeline

This is the **AI/ML module** for the SwaasCare Voice Biomarker Disease Tracking system, built for the hackathon. It classifies voice recordings as **Normal** or **Depression** using vocal acoustic features.

## Features Extracted
- **MFCC** (20 coefficients) — captures timbre and vocal quality
- **Pitch (F0)** — fundamental frequency variation
- **RMS Energy** — loudness and vocal effort
- **Zero Crossing Rate** — breathiness/noise detection
- **Spectral Centroid & Bandwidth** — brightness and frequency spread

## Model
- **Algorithm:** Random Forest Classifier
- **Accuracy:** 97.5% on 400 samples (200 Normal, 200 Depression)
- **Train/Test Split:** 80/20

## Project Structure
```
ml_pipeline/
├── requirements.txt          # All dependencies
├── src/
│   ├── feature_extractor.py  # Librosa-based acoustic feature extraction
│   ├── data_loader.py        # Dataset traversal and preprocessing
│   ├── model.py              # Model factory (RandomForest / LogisticRegression)
│   ├── train.py              # Training + evaluation script
│   └── predict.py            # Single-file inference pipeline
├── api.py                    # FastAPI REST endpoint for backend integration
├── demo.py                   # Gradio live microphone UI demo
├── record_and_predict.py     # Terminal-based mic recorder + predictor
└── output/
    └── models/               # Saved model artifacts (generated after training)
```

## Quick Start

### 1. Install Dependencies
```bash
pip install -r requirements.txt
```

### 2. Train the Model
```bash
cd ml_pipeline
python -m src.train
```

### 3. Test With Your Voice (Terminal)
```bash
python record_and_predict.py
```

### 4. Launch Live Demo UI (Gradio)
```bash
python demo.py
# Opens at http://127.0.0.1:7860
```

### 5. Start the Backend REST API (FastAPI)
```bash
python api.py
# API available at http://localhost:8000/predict
```

## API Usage
Send a POST request with an audio file:
```bash
curl -X POST http://localhost:8000/predict \
  -F "file=@your_voice.wav"
```
Response:
```json
{"status": "success", "prediction": "Normal"}
```

## Dataset Structure Expected
```
Audio_Dataset/
├── Normal/       (label 0)
│   └── *.wav
└── Depression/   (label 1)
    ├── Stage1/*.wav
    └── Stage2/*.wav
```

## Tech Stack
- `librosa` — audio feature extraction
- `scikit-learn` — ML models
- `FastAPI` + `uvicorn` — REST API
- `Gradio` — live demo UI
- `sounddevice` — microphone recording
