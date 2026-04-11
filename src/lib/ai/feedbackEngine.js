/**
 * Smart AI Feedback Engine
 * Rule-based + heuristic system that generates human-readable health insights
 * by comparing current features against baseline and recent trends.
 */

/**
 * @param {Object} currentFeatures - Latest voice features
 * @param {Object} baseline - Stored baseline profile
 * @param {Array} recentRecords - Last 7 records for trend analysis
 * @returns {Array<{ type: string, severity: string, message: string, icon: string }>}
 */
export function generateFeedback(currentFeatures, baseline, recentRecords = []) {
  const insights = [];

  if (!currentFeatures || !baseline) {
    insights.push({
      type: 'info',
      severity: 'low',
      message: 'Continue recording daily to build your voice baseline for personalized insights.',
      icon: '📊',
    });
    return insights;
  }

  // 1. Breath Stability
  const breathDelta = baseline.avgBreathiness > 0
    ? ((currentFeatures.breathiness_proxy - baseline.avgBreathiness) / baseline.avgBreathiness) * 100
    : 0;

  if (breathDelta > 10) {
    insights.push({
      type: 'respiratory',
      severity: 'medium',
      message: `Your breath stability decreased by ${Math.abs(Math.round(breathDelta))}% compared to your baseline.`,
      icon: '💨',
    });
  } else if (breathDelta < -10) {
    insights.push({
      type: 'respiratory',
      severity: 'low',
      message: `Your breath stability improved by ${Math.abs(Math.round(breathDelta))}% — great progress!`,
      icon: '🫁',
    });
  }

  // 2. Pitch Stability
  const pitchInstDelta = baseline.avgPitchInstability > 0
    ? ((currentFeatures.pitch_instability - baseline.avgPitchInstability) / baseline.avgPitchInstability) * 100
    : 0;

  if (pitchInstDelta > 15) {
    insights.push({
      type: 'neurological',
      severity: 'medium',
      message: `Vocal tremor markers are ${Math.round(pitchInstDelta)}% above your baseline — consider monitoring.`,
      icon: '〰️',
    });
  } else if (pitchInstDelta < -10) {
    insights.push({
      type: 'neurological',
      severity: 'low',
      message: `Voice stability has improved — tremor markers decreased by ${Math.abs(Math.round(pitchInstDelta))}%.`,
      icon: '✅',
    });
  }

  // 3. Energy / Vocal Fatigue
  const energyDelta = baseline.avgEnergy > 0
    ? ((currentFeatures.energy - baseline.avgEnergy) / baseline.avgEnergy) * 100
    : 0;

  if (energyDelta < -20) {
    insights.push({
      type: 'fatigue',
      severity: 'medium',
      message: `Vocal energy is ${Math.abs(Math.round(energyDelta))}% below baseline — possible fatigue or low mood.`,
      icon: '🔋',
    });
  } else if (energyDelta > 30) {
    insights.push({
      type: 'stress',
      severity: 'low',
      message: `Vocal energy is elevated by ${Math.round(energyDelta)}% — may indicate stress or excitement.`,
      icon: '⚡',
    });
  }

  // 4. Weekly trend analysis
  if (recentRecords.length >= 3) {
    const recentScores = recentRecords.slice(-7).map(r => r.healthScore || 0).filter(Boolean);
    if (recentScores.length >= 3) {
      const first3Avg = recentScores.slice(0, Math.ceil(recentScores.length / 2)).reduce((a, b) => a + b, 0) / Math.ceil(recentScores.length / 2);
      const last3Avg = recentScores.slice(Math.ceil(recentScores.length / 2)).reduce((a, b) => a + b, 0) / (recentScores.length - Math.ceil(recentScores.length / 2));

      const trendDelta = last3Avg - first3Avg;

      if (trendDelta > 3) {
        insights.push({
          type: 'trend',
          severity: 'low',
          message: `Your health score is trending upward — improved by ${Math.round(trendDelta)} points this week.`,
          icon: '📈',
        });
      } else if (trendDelta < -5) {
        insights.push({
          type: 'trend',
          severity: 'high',
          message: `Your health score has declined by ${Math.abs(Math.round(trendDelta))} points recently — please monitor closely.`,
          icon: '📉',
        });
      }
    }
  }

  // 5. Consistency reminder
  if (recentRecords.length < 3) {
    insights.push({
      type: 'reminder',
      severity: 'low',
      message: 'Record daily for at least 5 days to unlock personalized trend insights.',
      icon: '🎯',
    });
  }

  // If no specific insights, give a positive message
  if (insights.length === 0) {
    insights.push({
      type: 'positive',
      severity: 'low',
      message: 'All voice biomarkers are within normal range. Keep up the great work!',
      icon: '🌟',
    });
  }

  return insights;
}
