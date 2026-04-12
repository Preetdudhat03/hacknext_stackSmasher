import sys, os
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

import gradio as gr
import joblib
import numpy as np
from src.feature_extractor import extract_features

BASE_DIR = os.path.dirname(os.path.abspath(__file__))
MODELS_DIR = os.path.join(BASE_DIR, "output", "models")
MODEL_PATH  = os.path.join(MODELS_DIR, "random_forest_model.pkl")
SCALER_PATH = os.path.join(MODELS_DIR, "scaler.pkl")

# We will load dynamically in prediction function so no immediate failure if not trained

CUSTOM_CSS = """
.result-box   { border-radius: 12px; padding: 16px; margin-top: 8px; }
.normal-box   { background: #d1fae5; border: 2px solid #10b981; color: #065f46; }
.asthma-box   { background: #fee2e2; border: 2px solid #ef4444; color: #7f1d1d; }
footer { display: none !important; }
"""

READING_SCRIPT = """Please read the following passage naturally and clearly:

"When the sunlight strikes raindrops in the air, they act just like a prism and form a rainbow.
The rainbow is a division of white light into many beautiful colours. These take the shape of a long
round arch, with its path high above, and its two ends apparently beyond the horizon. There is,
according to legend, a boiling pot of gold at one end. People look, but no one ever finds it.
When a man looks for something beyond his reach, his friends say he is looking for the pot of gold
at the end of the rainbow."

Speak at your natural pace. Avoid long pauses before starting."""

def predict_from_mic(audio):
    if audio is None:
        return (
            "No audio detected. Please record your voice first.",
            "",
            gr.update(visible=False),
            gr.update(visible=False),
        )

    if not os.path.exists(MODEL_PATH) or not os.path.exists(SCALER_PATH):
       return ("ERROR: Trained model not found. Run train.py first.", "", gr.update(visible=False), gr.update(visible=False))

    model  = joblib.load(MODEL_PATH)
    scaler = joblib.load(SCALER_PATH)

    import soundfile as sf
    import tempfile

    sr, data = audio

    if data.dtype != np.float32:
        data = data.astype(np.float32) / np.iinfo(data.dtype).max

    if data.ndim > 1:
        data = np.mean(data, axis=1)

    with tempfile.NamedTemporaryFile(suffix=".wav", delete=False) as tmp:
        tmp_path = tmp.name
        sf.write(tmp_path, data, sr)

    try:
        features = extract_features(tmp_path)
    finally:
        if os.path.exists(tmp_path):
            os.remove(tmp_path)

    if features is None:
        return (
            "Feature extraction failed. Please try recording again.",
            "",
            gr.update(visible=False),
            gr.update(visible=False),
        )

    features_scaled = scaler.transform(features.reshape(1, -1))
    prediction      = model.predict(features_scaled)[0]
    probs           = model.predict_proba(features_scaled)[0]

    normal_conf     = round(probs[0] * 100, 1)
    asthma_conf     = round(probs[1] * 100, 1)

    if prediction == 0:
        label   = "Normal"
        summary = (
            f"**Result: No signs of Asthma detected.**\n\n"
            f"Normal confidence: **{normal_conf}%**\n"
            f"Asthma confidence: **{asthma_conf}%**"
        )
        visible_normal = gr.update(visible=True)
        visible_asthma = gr.update(visible=False)
    else:
        label   = "Potential Asthma Indicator"
        summary = (
            f"**Result: Vocal biomarkers suggest possible signs of Asthma.**\n\n"
            f"Normal confidence: **{normal_conf}%**\n"
            f"Asthma confidence: **{asthma_conf}%**"
        )
        visible_normal = gr.update(visible=False)
        visible_asthma = gr.update(visible=True)

    return label, summary, visible_normal, visible_asthma


with gr.Blocks(title="SwaasCare - Voice Biomarker Screening (Asthma)") as demo:
    gr.Markdown("# SwaasCare - Voice Biomarker Screening (Asthma)\n### AI-powered early detection of asthma through vocal analysis.\n---")

    with gr.Row():
        with gr.Column(scale=1):
            gr.Markdown("## Step 1 - Read This Script Aloud")
            gr.Textbox(
                value=READING_SCRIPT,
                lines=12,
                interactive=False,
                label="Reading Script",
            )

            gr.Markdown("## Step 2 - Record Your Voice")
            audio_input = gr.Audio(
                sources=["microphone"],
                type="numpy",
                label="Click the microphone to start recording",
            )

            submit_btn = gr.Button("Analyze Voice", variant="primary", size="lg")

        with gr.Column(scale=1):
            gr.Markdown("## Step 3 - Results")
            prediction_label = gr.Textbox(
                label="Prediction",
                interactive=False,
                placeholder="Your result will appear here after analysis...",
            )
            prediction_detail = gr.Markdown()

            normal_banner = gr.HTML(
                value='<div class="result-box normal-box"><strong>Voice is within the healthy range.</strong> No signs of asthma detected.</div>',
                visible=False,
            )
            asthma_banner = gr.HTML(
                value='<div class="result-box asthma-box"><strong>Possible asthma indicators detected.</strong> Please consult a medical professional.</div>',
                visible=False,
            )

            gr.Markdown("---\n> **Disclaimer:** This tool is a research prototype for a hackathon. It is **not** a medical diagnosis.")

    submit_btn.click(
        fn=predict_from_mic,
        inputs=[audio_input],
        outputs=[prediction_label, prediction_detail, normal_banner, asthma_banner],
    )

if __name__ == "__main__":
    print("SwaasCare Asthma Demo launching...")
    print("Opening at http://127.0.0.1:7860")
    demo.launch(
        server_name="0.0.0.0",
        server_port=7860,
        share=False,
        inbrowser=True,
        theme=gr.themes.Soft(primary_hue="violet", secondary_hue="purple", neutral_hue="slate"),
        css=CUSTOM_CSS,
    )
