/**
 * Trend Prediction Module
 * Uses simple linear regression on the last 5–7 scores to predict the next 5 days.
 */

/**
 * Simple linear regression: y = mx + b
 * @param {number[]} values - Array of numeric values (chronological)
 * @returns {{ slope: number, intercept: number }}
 */
function linearRegression(values) {
  const n = values.length;
  if (n < 2) return { slope: 0, intercept: values[0] || 0 };

  let sumX = 0, sumY = 0, sumXY = 0, sumX2 = 0;
  for (let i = 0; i < n; i++) {
    sumX += i;
    sumY += values[i];
    sumXY += i * values[i];
    sumX2 += i * i;
  }

  const slope = (n * sumXY - sumX * sumY) / (n * sumX2 - sumX * sumX);
  const intercept = (sumY - slope * sumX) / n;

  return { slope: isNaN(slope) ? 0 : slope, intercept: isNaN(intercept) ? 0 : intercept };
}

/**
 * Predict next N values based on linear regression of historical data.
 * @param {number[]} historicalScores - Last 5–7 health scores
 * @param {number} predictDays - Number of days to predict (default: 5)
 * @returns {{ predictions: number[], slope: number, trend: string, confidence: number }}
 */
export function predictTrend(historicalScores, predictDays = 5) {
  const scores = historicalScores.filter(s => s > 0);

  if (scores.length < 2) {
    return {
      predictions: [],
      slope: 0,
      trend: 'insufficient',
      confidence: 0,
    };
  }

  const { slope, intercept } = linearRegression(scores);

  // Generate predictions
  const n = scores.length;
  const predictions = [];
  for (let i = 0; i < predictDays; i++) {
    const predicted = slope * (n + i) + intercept;
    // Clamp between 0 and 100
    predictions.push(Math.max(0, Math.min(100, Math.round(predicted))));
  }

  // Calculate R² for confidence
  const mean = scores.reduce((a, b) => a + b, 0) / scores.length;
  let ssRes = 0, ssTot = 0;
  for (let i = 0; i < scores.length; i++) {
    const predicted = slope * i + intercept;
    ssRes += Math.pow(scores[i] - predicted, 2);
    ssTot += Math.pow(scores[i] - mean, 2);
  }
  const rSquared = ssTot === 0 ? 0 : Math.max(0, 1 - ssRes / ssTot);

  // Determine trend direction
  let trend = 'stable';
  if (slope > 0.3) trend = 'improving';
  else if (slope < -0.3) trend = 'declining';

  return {
    predictions,
    slope: Math.round(slope * 100) / 100,
    trend,
    confidence: Math.round(rSquared * 100),
  };
}
