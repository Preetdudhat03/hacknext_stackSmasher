'use client';
import { useMemo } from 'react';
import styles from './voice.module.css';

/**
 * Feature 4: Before vs Now Voice Comparison
 * Shows first recording vs latest with metric deltas.
 */
function MiniChart({ data, color, width = 200, height = 80 }) {
  if (!data || data.length < 2) return null;
  const max = Math.max(...data);
  const min = Math.min(...data);
  const range = max - min || 1;

  const points = data
    .map((v, i) => {
      const x = (i / (data.length - 1)) * width;
      const y = height - 6 - ((v - min) / range) * (height - 12);
      return `${x},${y}`;
    })
    .join(' ');

  return (
    <svg viewBox={`0 0 ${width} ${height}`} className={styles.comparisonChart}>
      <defs>
        <linearGradient id={`comp-${color.replace('#', '')}`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={color} stopOpacity="0.25" />
          <stop offset="100%" stopColor={color} stopOpacity="0" />
        </linearGradient>
      </defs>
      <polygon
        points={`0,${height} ${points} ${width},${height}`}
        fill={`url(#comp-${color.replace('#', '')})`}
      />
      <polyline
        points={points}
        fill="none"
        stroke={color}
        strokeWidth="2.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

export default function VoiceComparison({ records = [] }) {
  const { first, latest, delta } = useMemo(() => {
    if (records.length < 2) return { first: null, latest: null, delta: null };

    const sorted = [...records].sort((a, b) => 
      new Date(a.createdAt || a.date) - new Date(b.createdAt || b.date)
    );
    const f = sorted[0];
    const l = sorted[sorted.length - 1];

    const scoreDelta = (l.healthScore || 0) - (f.healthScore || 0);

    return {
      first: f,
      latest: l,
      delta: {
        score: scoreDelta,
        percent: f.healthScore > 0 ? Math.round((scoreDelta / f.healthScore) * 100) : 0,
      },
    };
  }, [records]);

  if (!first || !latest) {
    return (
      <div className={`${styles.comparisonWrapper} glass-panel`}>
        <h3 className={styles.comparisonTitle}>📊 Before vs Now</h3>
        <p style={{ fontSize: '0.82rem', color: 'var(--text-tertiary)' }}>
          Record at least 2 voice samples to see your progress comparison.
        </p>
      </div>
    );
  }

  const firstFeatures = first.features || {};
  const latestFeatures = latest.features || {};

  const metrics = [
    { name: 'Health Score', before: first.healthScore, now: latest.healthScore },
    { name: 'Pitch (Hz)', before: Math.round(firstFeatures.mean_pitch_proxy || 0), now: Math.round(latestFeatures.mean_pitch_proxy || 0) },
    { name: 'Energy', before: (firstFeatures.energy || 0).toFixed(3), now: (latestFeatures.energy || 0).toFixed(3) },
    { name: 'Breathiness', before: (firstFeatures.breathiness_proxy || 0).toFixed(3), now: (latestFeatures.breathiness_proxy || 0).toFixed(3) },
  ];

  const allScores = records.map(r => r.healthScore || 0);
  const half = Math.ceil(allScores.length / 2);

  return (
    <div className={`${styles.comparisonWrapper} glass-panel`}>
      <h3 className={styles.comparisonTitle}>📊 Before vs Now</h3>

      <div className={styles.comparisonGrid}>
        <div className={styles.comparisonColumn}>
          <span className={styles.comparisonLabel}>First Recording</span>
          <MiniChart data={allScores.slice(0, half)} color="#94a3b8" />
          <div className={styles.comparisonMetrics}>
            {metrics.map(m => (
              <div key={m.name} className={styles.compMetric}>
                <span className={styles.compMetricName}>{m.name}</span>
                <span className={styles.compMetricValue}>{m.before}</span>
              </div>
            ))}
          </div>
        </div>

        <div className={styles.comparisonColumn}>
          <span className={styles.comparisonLabel}>Latest Recording</span>
          <MiniChart data={allScores.slice(half)} color="#4A6CF7" />
          <div className={styles.comparisonMetrics}>
            {metrics.map(m => (
              <div key={m.name} className={styles.compMetric}>
                <span className={styles.compMetricName}>{m.name}</span>
                <span className={styles.compMetricValue}>{m.now}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className={styles.compDelta}>
        <span
          className={styles.compDeltaValue}
          style={{ color: delta.score >= 0 ? '#22c55e' : '#ef4444' }}
        >
          {delta.score >= 0 ? '+' : ''}{delta.score} pts ({delta.percent}%)
        </span>
        <span className={styles.compDeltaLabel}>Overall Change</span>
      </div>
    </div>
  );
}
