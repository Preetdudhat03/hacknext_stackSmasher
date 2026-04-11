import random

def generate_insights(features: dict):
    """
    Mock ML Model to map extracted features to physiological / body system insights.
    For the MVP, we use rule-based thresholds on the extracted proxies to generate
    Explainable AI (XAI) insights and scores.
    """
    
    insights = {
        "respiratory": {"score": 100, "insight": "Lung capacity and airflow appear optimal.", "status": "normal"},
        "neurological": {"score": 100, "insight": "Vocal cords show stable neuromuscular control.", "status": "normal"},
        "emotional": {"score": 100, "insight": "Vocal energy suggests balanced emotional state.", "status": "normal"}
    }
    
    # 1. Evaluate Respiratory (Breathiness -> ZCR proxy mapping)
    zcr = features.get("breathiness_proxy", 0.05)
    if zcr > 0.15: # High turbulence
        insights["respiratory"] = {
            "score": random.randint(60, 80),
            "insight": "High vocal turbulence detected → Possible breath irregularity.",
            "status": "warning"
        }
    elif zcr < 0.02: # Low airflow
        insights["respiratory"] = {
            "score": random.randint(70, 85),
            "insight": "Lower vocal airflow detected → May indicate fatigue or shallow breathing.",
            "status": "warning"
        }

    # 2. Evaluate Neurological (Pitch instability -> Variance mapping)
    pitch_instability = features.get("pitch_instability", 50000.0)
    if pitch_instability > 100000:
        insights["neurological"] = {
            "score": random.randint(55, 75),
            "insight": "Micro-tremors detected in pitch variance → Possible neurological signal.",
            "status": "warning"
        }

    # 3. Evaluate Emotional (Energy -> RMS mapping)
    energy = features.get("energy", 0.02)
    if energy < 0.01:
        insights["emotional"] = {
            "score": random.randint(65, 80),
            "insight": "Low vocal energy detected → Potential fatigue or low mood.",
            "status": "warning"
        }
    elif energy > 0.1:
        insights["emotional"] = {
            "score": random.randint(70, 85),
            "insight": "High vocal intensity detected → Potential elevated stress or excitement.",
            "status": "warning"
        }

    # Calculate overall health score
    overall_score = int(sum(sys["score"] for sys in insights.values()) / 3)
    
    # Simple risk level logic
    if overall_score >= 90:
        risk_level = "low"
    elif overall_score >= 75:
        risk_level = "medium"
    else:
        risk_level = "high"
        
    return {
        "health_score": overall_score,
        "risk_level": risk_level,
        "system_insights": insights
    }
