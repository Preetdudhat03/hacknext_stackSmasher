# SwaasCare — Asthma Voice Biomarker ML Pipeline

This is the **Asthma ML module** for the SwaasCare Voice Biomarker Disease Tracking system. It classifies voice recordings as **Normal** or **Asthma**.

## Project Structure
```
ml_pipeline_asthma/
├── requirements.txt          # All dependencies
├── src/
│   ├── feature_extractor.py  # Librosa features + YIN pitch
│   ├── data_loader.py        # Dataset traversal and processing
│   ├── model.py              # RandomForest implementation
│   ├── train.py              # Script to train and benchmark
│   └── predict.py            # Code interface to run inference
├── api.py                    # FastAPI server for React Integration
├── demo.py                   # Live Gradio Web UI
├── record_and_predict.py     # Terminal mic record/predict CLI
└── output/
    └── models/               # Saved model artifacts
```

## Quick Start Pipeline

### 1. Install Dependencies
```bash
pip install -r requirements.txt
```

### 2. Train the Model
```bash
python -m src.train
```

### 3. Start Live Demo UI (Web Browser)
```bash
python demo.py
```

### 4. Or, Try Terminal Recording
```bash
python record_and_predict.py
```

### 5. Backend REST API
```bash
python api.py
```
