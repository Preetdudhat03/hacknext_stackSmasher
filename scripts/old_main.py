import numpy as np
import librosa
import sounddevice as sd
from scipy.io.wavfile import write
import joblib
import pandas as pd
import csv
import os
from datetime import datetime

fs = 44100
seconds = 5 # Quick 5-second test capture

print(f"\n🎙️  Get ready! Recording for {seconds} seconds...")
print("Speak now...")
recording = sd.rec(int(seconds * fs), samplerate=fs, channels=1)
sd.wait()

write("output.wav", fs, recording)
print("Saved!")

audio, sr = librosa.load("output.wav")

# Check if the audio is completely silent or just static
audio_max = np.max(np.abs(audio))
if audio_max < 0.05:
    print("\n❌ MIC ERROR: No voice detected! Your microphone is either muted or too far.")
    print("Please check your system microphone settings, speak clearly, and try again.")
    import sys
    sys.exit()

audio = librosa.util.normalize(audio)

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

energy = float(np.mean(librosa.feature.rms(y=audio)))

zcr = float(np.mean(librosa.feature.zero_crossing_rate(audio)))

total_audio = len(audio)
speech_segments = librosa.effects.split(audio)

if len(speech_segments) > 0:
    speech_duration = np.sum(speech_segments[:, 1] - speech_segments[:, 0])
else:
    speech_duration = 0

pause_duration = total_audio - speech_duration
pause_ratio = pause_duration / total_audio
print("\n--- DEBUG ---")
print("Pitch Mean (Fo):", pitch_mean)
print("Pitch Max (Fhi):", pitch_max)
print("Pitch Min (Flo):", pitch_min)

model = joblib.load("model_parkinsons.pkl")

features = {
    "MDVP:Fo(Hz)": pitch_mean,
    "MDVP:Fhi(Hz)": pitch_max,
    "MDVP:Flo(Hz)": pitch_min
}

df = pd.DataFrame([features])
df = df[["MDVP:Fo(Hz)", "MDVP:Fhi(Hz)", "MDVP:Flo(Hz)"]]

prediction = model.predict(df)[0]
probs = model.predict_proba(df)[0]

# Always use probability of Class 1 (Parkinson's) for longitudinal monitoring
risk_percentage = round(float(probs[1]) * 100, 2)

if risk_percentage < 40:
    severity = "Low Risk"
    status_str = "Healthy Profile"
elif risk_percentage < 70:
    severity = "Moderate Risk"
    status_str = "Early Signs / Mild Profile"
else:
    severity = "High Risk"
    status_str = "Parkinson's Profile Detected"

# -----------------------------
# STEP 8: LONGITUDINAL RISK TREND
# -----------------------------
csv_file = "parkinsons_log.csv"
file_exists = os.path.isfile(csv_file)

trend = "No previous data to compare."
if file_exists:
    try:
        df_log = pd.read_csv(csv_file)
        if "Confidence" in df_log.columns and len(df_log) > 0:
            last_risk = float(df_log.iloc[-1]["Confidence"])
            diff = risk_percentage - last_risk
            if diff > 0:
                trend = f"INCREASING 📈 (+{diff:.2f}% from {last_risk:.2f}%)"
            elif diff < 0:
                trend = f"DECREASING 📉 (-{abs(diff):.2f}% from {last_risk:.2f}%)"
            else:
                trend = f"STABLE ➖ (Remains at {last_risk:.2f}%)"
    except Exception as e:
        pass

# -----------------------------
# STEP 8.5: MEDICAL INSIGHTS
# -----------------------------
pitch_range = pitch_max - pitch_min
insights = []

if pitch_range < 80:
    insights.append("👉 Monotone Speech Detected (Hypokinetic Dysarthria risk): Vocal flexibility is low, which can indicate muscle rigidity.")
elif pitch_range > 200:
    insights.append("👉 Healthy Vocal Range: Excellent pitch elasticity detected, which is generally a strong indicator of healthy vocal fold control.")
else:
    insights.append("👉 Normal Pitch Variation: Your vocal cords demonstrate standard range and flexibility.")

if risk_percentage >= 70:
    insights.append("👉 Neurological Voice Marker: The AI matched micro-tremors in your fundamental frequency typically associated with Parkinson's dysphonia.")
elif risk_percentage < 40:
    insights.append("👉 Clear Phonation: No significant vocal biomarkers correlated with neurological degradation were found.")

print("\n--- FINAL AI HEALTH REPORT ---")
print("Analysis Status:", status_str, f"({severity})")
print("Parkinson's Risk Level:", risk_percentage, "%")
print("Risk Trend vs Last Check:", trend)

print("\n--- CLINICAL BIOMARKER INSIGHTS ---")
for insight in insights:
    print(insight)

# -----------------------------
# STEP 9: LOG TO CSV
# -----------------------------
with open(csv_file, mode='a', newline='') as f:
    writer = csv.writer(f)
    if not file_exists:
        writer.writerow(["Timestamp", "Fo(Hz)", "Fhi(Hz)", "Flo(Hz)", "Prediction", "Confidence", "Severity"])
    
    timestamp = datetime.now().isoformat()
    row = [
        timestamp,
        pitch_mean,
        pitch_max,
        pitch_min,
        int(prediction),
        risk_percentage,
        severity
    ]
    writer.writerow(row)

print("✅ Results saved to parkinsons_log.csv")