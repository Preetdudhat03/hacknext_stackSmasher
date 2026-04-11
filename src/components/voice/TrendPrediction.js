'use client';
import { useMemo } from 'react';
import { predictTrend } from '@/lib/ai/trendPredictor';
import styles from './voice.module.css';

/**
 * Feature 7: Trend Prediction Graph
 * Shows actual data (solid) + predicted future (dotted).
 */
export default function TrendPrediction({ historicalScores = [], labels = [] }) {
  const { predictions, trend, confidence, slope } = useMemo(
    () => predictTrend(historicalScores, 5),
    [historicalScores]
  );

  const allData = [...historicalScores, ...predictions];
  const max = Math.max(...allData.filter(v => v > 0), 100);
  const min = Math.min(...allData.filter(v => v > 0), 0);

  const w = 480;
  const h = 140;
  const pad = 20;

  const toX = (i) => pad + (i / (allData.length - 1)) * (w - pad * 2);
  const toY = (v) => pad + (1 - (v - min) / (max - min || 1)) * (h - pad * 2);

  const actualPoints = historicalScores.map((v, i) => `${toX(i)},${toY(v)}`);
  const predPoints = predictions.map((v, i) => `${toX(historicalScores.length + i)},${toY(v)}`);

  // Connection point
  const lastActual = historicalScores.length > 0
    ? `${toX(historicalScores.length - 1)},${toY(historicalScores[historicalScores.length - 1])}`
    : null;

  const predictionLine = lastActual ? [lastActual, ...predPoints].join(' ') : predPoints.join(' ');

  // Generate future labels
  const futureLabels = Array.from({ length: predictions.length }, (_, i) => `+${i + 1}d`);
  const allLabels = [...(labels.length > 0 ? labels : historicalScores.map((_, i) => `Day ${i + 1}`)), ...futureLabels];

  const trendLabel = trend === 'improving' ? '📈 Improving' : trend === 'declining' ? '📉 Declining' : '→ Stable';
  const trendColor = trend === 'improving' ? '#22c55e' : trend === 'declining' ? '#ef4444' : '#64748b';

  return (
    <div className={`${styles.trendWrapper} glass-panel`}>
      <h3 className={styles.trendTitle}>🔮 Trend Prediction</h3>
      <p className={styles.trendSubtitle}>Linear regression on your last {historicalScores.length} scores → predicting next 5 days</p>

      <svg viewBox={`0 0 ${w} ${h + 30}`} className={styles.trendChartSvg}>
        {/* Grid */}
        {[0, 0.25, 0.5, 0.75, 1].map((pct) => (
          <line
            key={pct}
            x1={pad} y1={pad + pct * (h - pad * 2)}
            x2={w - pad} y2={pad + pct * (h - pad * 2)}
            stroke="rgba(148,163,184,0.12)"
            strokeWidth="1"
          />
        ))}

        {/* Divider between actual and predicted */}
        {historicalScores.length > 0 && (
          <line
            x1={toX(historicalScores.length - 0.5)}
            y1={pad - 5}
            x2={toX(historicalScores.length - 0.5)}
            y2={h - pad + 5}
            stroke="rgba(148,163,184,0.2)"
            strokeWidth="1"
            strokeDasharray="4,3"
          />
        )}

        {/* Actual line — solid */}
        {actualPoints.length > 1 && (
          <>
            <defs>
              <linearGradient id="actualGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#4A6CF7" stopOpacity="0.2" />
                <stop offset="100%" stopColor="#4A6CF7" stopOpacity="0" />
              </linearGradient>
            </defs>
            <polygon
              points={`${toX(0)},${h - pad} ${actualPoints.join(' ')} ${toX(historicalScores.length - 1)},${h - pad}`}
              fill="url(#actualGrad)"
            />
            <polyline
              points={actualPoints.join(' ')}
              fill="none"
              stroke="#4A6CF7"
              strokeWidth="2.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
            {historicalScores.map((v, i) => (
              <circle key={i} cx={toX(i)} cy={toY(v)} r="3.5" fill="#4A6CF7" stroke="white" strokeWidth="2" />
            ))}
          </>
        )}

        {/* Predicted line — dashed */}
        {predPoints.length > 0 && (
          <>
            <polyline
              points={predictionLine}
              fill="none"
              stroke={trendColor}
              strokeWidth="2.5"
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeDasharray="8,5"
              opacity="0.7"
            />
            {predictions.map((v, i) => (
              <circle
                key={i}
                cx={toX(historicalScores.length + i)}
                cy={toY(v)}
                r="3"
                fill="none"
                stroke={trendColor}
                strokeWidth="2"
                opacity="0.6"
              />
            ))}
          </>
        )}

        {/* X-axis labels */}
        {allLabels.map((label, i) => (
          <text
            key={i}
            x={toX(i)}
            y={h + 16}
            textAnchor="middle"
            fill={i >= historicalScores.length ? trendColor : '#94a3b8'}
            fontSize="9"
            fontFamily="Inter,sans-serif"
            fontWeight={i >= historicalScores.length ? '600' : '400'}
            opacity={i >= historicalScores.length ? 0.7 : 1}
          >
            {label}
          </text>
        ))}
      </svg>

      <div className={styles.trendLegend}>
        <span className={styles.trendLegendItem}>
          <span className={styles.trendLegendLine} style={{ background: '#4A6CF7' }} />
          Actual
        </span>
        <span className={styles.trendLegendItem}>
          <span className={`${styles.trendLegendLine} ${styles.trendLegendDashed}`} style={{ borderColor: trendColor }} />
          Predicted Trend
        </span>
      </div>

      <div className={styles.trendMeta}>
        <span className={styles.trendMetaItem} style={{ color: trendColor }}>
          {trendLabel}
        </span>
        <span className={styles.trendMetaItem}>
          Confidence: {confidence}%
        </span>
        <span className={styles.trendMetaItem}>
          Slope: {slope > 0 ? '+' : ''}{slope}/day
        </span>
      </div>
    </div>
  );
}
