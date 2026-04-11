"""
SwaasCare - Live Voice Depression Screening Demo
Uses Gradio for the UI and our trained RandomForest ML model for prediction.
Users read the provided script aloud, and the model classifies their voice.
"""
import os
import sys
import gradio as gr
import joblib
import numpy as np

# Resolve paths correctly regardless of where this script is run from
BASE_DIR = os.path.dirname(os.path.abspath(__file__))
sys.path.append(BASE_DIR)

from src.feature_extractor import extract_features

# ─── Load Model & Scaler ─────────────────────────────────────────────────────
MODELS_DIR = os.path.join(BASE_DIR, "output", "models")
MODEL_PATH  = os.path.join(MODELS_DIR, "random_forest_model.pkl")
SCALER_PATH = os.path.join(MODELS_DIR, "scaler.pkl")

model  = joblib.load(MODEL_PATH)
scaler = joblib.load(SCALER_PATH)

# ─── The Rainbow Passage (standard clinical speech analysis script) ───────────
READING_SCRIPT = """🎙 Please read the following passage naturally and clearly:

"When the sunlight strikes raindrops in the air, they act just like a prism and form a rainbow.
The rainbow is a division of white light into many beautiful colours. These take the shape of a long
round arch, with its path high above, and its two ends apparently beyond the horizon. There is,
according to legend, a boiling pot of gold at one end. People look, but no one ever finds it.
When a man looks for something beyond his reach, his friends say he is looking for the pot of gold
at the end of the rainbow."

Speak at your natural pace. Avoid long pauses before starting."""

# ─── Prediction Function ─────────────────────────────────────────────────────
def predict_from_mic(audio):
    """
    Called when the user submits a recording.
    audio: tuple of (sample_rate, numpy_array) from Gradio's Audio component
    """
    if audio is None:
        return (
            "⚠️ No audio detected. Please record your voice first.",
            "",
            gr.update(visible=False),
            gr.update(visible=False),
        )

    import soundfile as sf
    import tempfile

    sr, data = audio

    # Gradio returns int16 by default — convert to float32 for librosa
    if data.dtype != np.float32:
        data = data.astype(np.float32) / np.iinfo(data.dtype).max

    # If stereo, collapse to mono
    if data.ndim > 1:
        data = np.mean(data, axis=1)

    # Save to a temporary WAV so librosa can load it
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
            "❌ Feature extraction failed. Please try recording again.",
            "",
            gr.update(visible=False),
            gr.update(visible=False),
        )

    features_scaled = scaler.transform(features.reshape(1, -1))
    prediction      = model.predict(features_scaled)[0]
    probs           = model.predict_proba(features_scaled)[0]

    normal_conf     = round(probs[0] * 100, 1)
    depressed_conf  = round(probs[1] * 100, 1)

    if prediction == 0:
        label   = "✅ Normal"
        summary = (
            f"**Result: No signs of depression detected.**\n\n"
            f"Your vocal biomarkers appear healthy. Voice characteristics such as "
            f"pitch stability, energy levels, and speech rhythm fall within the normal range.\n\n"
            f"🟢 Normal confidence: **{normal_conf}%**\n"
            f"🔴 Depression confidence: **{depressed_conf}%**"
        )
        visible_normal     = gr.update(visible=True)
        visible_depression = gr.update(visible=False)
    else:
        label   = "⚠️ Potential Depression Indicator"
        summary = (
            f"**Result: Vocal biomarkers suggest possible signs of depression.**\n\n"
            f"Your voice shows patterns associated with depression, such as reduced pitch variation, "
            f"lower energy, and altered speech rhythm. This is a screening tool — please consult a "
            f"healthcare professional for a proper diagnosis.\n\n"
            f"🟢 Normal confidence: **{normal_conf}%**\n"
            f"🔴 Depression confidence: **{depressed_conf}%**"
        )
        visible_normal     = gr.update(visible=False)
        visible_depression = gr.update(visible=True)

    return label, summary, visible_normal, visible_depression


# ─── Gradio UI ────────────────────────────────────────────────────────────────
CUSTOM_CSS = """
.result-box   { border-radius: 12px; padding: 16px; margin-top: 8px; }
.normal-box   { background: #d1fae5; border: 2px solid #10b981; color: #065f46; }
.depressed-box{ background: #fee2e2; border: 2px solid #ef4444; color: #7f1d1d; }
footer { display: none !important; }
"""

with gr.Blocks(title="SwaasCare – Voice Biomarker Screening") as demo:

    # Header
    gr.Markdown(
        """
        # 🩺 SwaasCare – Voice Biomarker Depression Screening
        ### AI-powered early detection of depression through vocal analysis.
        ---
        """
    )

    with gr.Row():
        # Left column: Script + Recording
        with gr.Column(scale=1):
            gr.Markdown("## 📋 Step 1 – Read This Script Aloud")
            gr.Textbox(
                value=READING_SCRIPT,
                lines=12,
                interactive=False,
                label="Reading Script",
            )

            gr.Markdown("## 🎤 Step 2 – Record Your Voice")
            audio_input = gr.Audio(
                sources=["microphone"],
                type="numpy",
                label="Click the microphone to start recording, then click Stop when done",
            )

            submit_btn = gr.Button("🔍 Analyze Voice", variant="primary", size="lg")

        # Right column: Results
        with gr.Column(scale=1):
            gr.Markdown("## 📊 Step 3 – Results")
            prediction_label = gr.Textbox(
                label="Prediction",
                interactive=False,
                placeholder="Your result will appear here after analysis...",
            )
            prediction_detail = gr.Markdown()

            # Conditional result banners
            normal_banner = gr.HTML(
                value='<div class="result-box normal-box">✅ <strong>Voice is within the healthy range.</strong> No signs of depression detected.</div>',
                visible=False,
            )
            depressed_banner = gr.HTML(
                value='<div class="result-box depressed-box">⚠️ <strong>Possible depression indicators detected.</strong> Please consult a mental health professional.</div>',
                visible=False,
            )

            gr.Markdown(
                """
                ---
                > **Disclaimer:** This tool is a research prototype for a hackathon. 
                > It is **not** a medical diagnosis. Always consult a qualified medical professional.
                """
            )

    # Wire up the button
    submit_btn.click(
        fn=predict_from_mic,
        inputs=[audio_input],
        outputs=[prediction_label, prediction_detail, normal_banner, depressed_banner],
    )

if __name__ == "__main__":
    print("SwaasCare Demo launching...")
    print("Opening at http://127.0.0.1:7860")
    demo.launch(
        server_name="0.0.0.0",
        server_port=7860,
        share=False,
        inbrowser=True,
        theme=gr.themes.Soft(primary_hue="violet", secondary_hue="purple", neutral_hue="slate"),
        css=CUSTOM_CSS,
    )
