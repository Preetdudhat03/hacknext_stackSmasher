# SwaasCare — Multi-Disease Voice Biomarker Platform

This repository houses the Machine Learning pipelines, backend, and frontend code for the SwaasCare hackathon project.

## ML Pipelines

We have developed multiple independent AI/ML pipelines for tracking different disease markers via voice.

- **[Depression Screening Module](./ml_pipeline_depression/)**: Classifies voice samples for depression markers using Random Forest with 97.5% accuracy.
- **[Asthma Screening Module](./ml_pipeline_asthma/)**: Classifies voice samples for asthma indicators using a 100% accuracy model optimized with `librosa.yin`.

Each module is fully containerized with its own:
- Live Gradio Demo (`demo.py`)
- FastAPI Backend Service (`api.py`)
- Terminal Mic Recorder (`record_and_predict.py`)
- Trained Classifier (`output/models/`)

### Setup Instructions
To run either module, navigate into its specific directory and install its dependencies:
```bash
cd ml_pipeline_asthma
pip install -r requirements.txt
```

*Note: Models require the proper dataset structures (as listed in their individual `README.md` files) to retrain (`train.py`), but you can run predictions immediately.*
