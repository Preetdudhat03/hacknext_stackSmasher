/**
 * AI Health Score Module
 * Calculates a 0–100 health score by comparing current voice features against a stored baseline.
 */

/**
 * @param {Object} features - Current voice features from analysis
 * @param {Object} baseline - Stored baseline profile (averaged first 5 days)
 * @returns {{ score: number, classification: string, breakdown: Object }}
 */
export function calculateHealthScore(features, baseline) {
  if (!features || !baseline) {
    return { score: 78, classification: 'Mild', color: '#fbbf24', breakdown: {} };
  }

  const weights = {
    pitchStability: 0.25,
    breathiness: 0.20,
    energy: 0.20,
    mfccDistance: 0.20,
    pitchDeviation: 0.15,
  };

  // 1. Pitch stability: lower instability = better
  const pitchInstabilityRatio = baseline.avgPitchInstability > 0
    ? features.pitch_instability / baseline.avgPitchInstability
    : 1;
  const pitchStabilityScore = Math.max(0, Math.min(100, 100 - (pitchInstabilityRatio - 1) * 100));

  // 2. Breathiness: closer to baseline = better
  const breathDiff = Math.abs(features.breathiness_proxy - baseline.avgBreathiness);
  const breathinessScore = Math.max(0, Math.min(100, 100 - breathDiff * 1000));

  // 3. Energy: closer to or above baseline = better
  const energyRatio = baseline.avgEnergy > 0 ? features.energy / baseline.avgEnergy : 1;
  const energyScore = Math.max(0, Math.min(100, 50 + energyRatio * 50));

  // 4. MFCC distance (euclidean distance from baseline MFCCs)
  let mfccDist = 0;
  if (features.mfccs && baseline.avgMfccs) {
    const len = Math.min(features.mfccs.length, baseline.avgMfccs.length);
    for (let i = 0; i < len; i++) {
      mfccDist += Math.pow(features.mfccs[i] - baseline.avgMfccs[i], 2);
    }
    mfccDist = Math.sqrt(mfccDist);
  }
  const mfccScore = Math.max(0, Math.min(100, 100 - mfccDist * 0.5));

  // 5. Pitch deviation from baseline mean
  const pitchDev = baseline.avgPitch > 0
    ? Math.abs(features.mean_pitch_proxy - baseline.avgPitch) / baseline.avgPitch
    : 0;
  const pitchDeviationScore = Math.max(0, Math.min(100, 100 - pitchDev * 200));

  // Weighted total
  const score = Math.round(
    pitchStabilityScore * weights.pitchStability +
    breathinessScore * weights.breathiness +
    energyScore * weights.energy +
    mfccScore * weights.mfccDistance +
    pitchDeviationScore * weights.pitchDeviation
  );

  const clampedScore = Math.max(0, Math.min(100, score));

  return {
    score: clampedScore,
    classification: classifyScore(clampedScore),
    color: scoreColor(clampedScore),
    breakdown: {
      pitchStability: Math.round(pitchStabilityScore),
      breathiness: Math.round(breathinessScore),
      energy: Math.round(energyScore),
      mfccSimilarity: Math.round(mfccScore),
      pitchDeviation: Math.round(pitchDeviationScore),
    },
  };
}

export function classifyScore(score) {
  if (score >= 90) return 'Healthy';
  if (score >= 60) return 'Mild';
  return 'Critical';
}

export function scoreColor(score) {
  if (score >= 90) return '#22c55e';
  if (score >= 60) return '#fbbf24';
  return '#ef4444';
}
