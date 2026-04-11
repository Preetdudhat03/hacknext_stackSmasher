/**
 * Emotion & Mental Health Detection Module
 * Heuristic classifier using pitch variance, speech energy, and breathiness patterns.
 */

const EMOTION_MAP = {
  stress: { label: 'High Stress', color: '#ef4444', icon: '😰', bg: 'rgba(239,68,68,0.12)' },
  anxiety: { label: 'Anxiety', color: '#f59e0b', icon: '😟', bg: 'rgba(245,158,11,0.12)' },
  depression: { label: 'Low Mood', color: '#6366f1', icon: '😔', bg: 'rgba(99,102,241,0.12)' },
  fatigue: { label: 'Fatigue', color: '#8b5cf6', icon: '😴', bg: 'rgba(139,92,246,0.12)' },
  calm: { label: 'Calm', color: '#22c55e', icon: '😌', bg: 'rgba(34,197,94,0.12)' },
  neutral: { label: 'Neutral', color: '#64748b', icon: '😐', bg: 'rgba(100,116,139,0.12)' },
  energetic: { label: 'Energetic', color: '#06b6d4', icon: '⚡', bg: 'rgba(6,182,212,0.12)' },
};

/**
 * Classify emotional state from voice features.
 * @param {Object} features - Voice features from analysis
 * @param {Object} baseline - Stored baseline (optional)
 * @returns {{ primary: Object, secondary: Object|null, confidence: number }}
 */
export function classifyEmotion(features, baseline = null) {
  if (!features) {
    return {
      primary: EMOTION_MAP.neutral,
      secondary: null,
      confidence: 0,
    };
  }

  const scores = {
    stress: 0,
    anxiety: 0,
    depression: 0,
    fatigue: 0,
    calm: 0,
    neutral: 30, // bias toward neutral
    energetic: 0,
  };

  const pitchVar = features.pitch_instability || 50000;
  const energy = features.energy || 0.025;
  const breathiness = features.breathiness_proxy || 0.045;

  // High pitch instability → stress or anxiety
  if (pitchVar > 70000) {
    scores.stress += 35;
    scores.anxiety += 25;
  } else if (pitchVar > 55000) {
    scores.anxiety += 20;
    scores.stress += 15;
  } else if (pitchVar < 35000) {
    scores.calm += 25;
  }

  // Low energy → depression or fatigue
  if (energy < 0.015) {
    scores.depression += 35;
    scores.fatigue += 30;
  } else if (energy < 0.022) {
    scores.fatigue += 20;
    scores.depression += 15;
  } else if (energy > 0.045) {
    scores.energetic += 30;
    scores.stress += 10;
  } else if (energy > 0.03) {
    scores.calm += 15;
    scores.neutral += 10;
  }

  // Breathiness patterns
  if (breathiness > 0.08) {
    scores.anxiety += 20;
    scores.stress += 10;
  } else if (breathiness < 0.03) {
    scores.calm += 15;
  }

  // Compare with baseline if available
  if (baseline) {
    const energyRatio = baseline.avgEnergy > 0 ? energy / baseline.avgEnergy : 1;
    const pitchRatio = baseline.avgPitchInstability > 0 ? pitchVar / baseline.avgPitchInstability : 1;

    if (energyRatio < 0.7) {
      scores.depression += 20;
      scores.fatigue += 15;
    }
    if (pitchRatio > 1.3) {
      scores.stress += 15;
      scores.anxiety += 10;
    }
    if (energyRatio > 0.85 && energyRatio < 1.15 && pitchRatio < 1.1) {
      scores.calm += 20;
    }
  }

  // Find top 2 emotions
  const sorted = Object.entries(scores).sort((a, b) => b[1] - a[1]);
  const primary = sorted[0];
  const secondary = sorted[1] && sorted[1][1] > 15 ? sorted[1] : null;

  const totalScore = sorted.reduce((acc, [, v]) => acc + v, 0);
  const confidence = totalScore > 0 ? Math.round((primary[1] / totalScore) * 100) : 0;

  return {
    primary: { ...EMOTION_MAP[primary[0]], key: primary[0] },
    secondary: secondary ? { ...EMOTION_MAP[secondary[0]], key: secondary[0] } : null,
    confidence: Math.min(95, confidence),
  };
}

export { EMOTION_MAP };
