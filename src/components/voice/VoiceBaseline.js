'use client';
import { useEffect, useState } from 'react';
import styles from './voice.module.css';

/**
 * Feature 2: Personalized Voice Baseline
 * Shows calibration status and averaged baseline features.
 */
export default function VoiceBaseline({ baseline, recordCount = 0, targetDays = 5 }) {
  const [mounted, setMounted] = useState(false);
  useEffect(() => { setMounted(true); }, []);

  const isCalibrated = baseline && baseline.calibrated;
  const progress = Math.min(recordCount, targetDays);

  if (!mounted) return null;

  return (
    <div className={`${styles.baselineCard} glass-panel`}>
      <div className={styles.baselineHeader}>
        <h3 className={styles.baselineTitle}>🎯 Voice Baseline</h3>
        <span className={`${styles.baselineBadge} ${isCalibrated ? styles.baselineCalibrated : styles.baselineCalibrating}`}>
          {isCalibrated ? '✓ Calibrated' : `Day ${progress}/${targetDays}`}
        </span>
      </div>

      <div className={styles.baselineProgress}>
        {Array.from({ length: targetDays }, (_, i) => (
          <div
            key={i}
            className={`${styles.baselineDot} ${i < progress ? styles.baselineDotFilled : ''}`}
          />
        ))}
      </div>

      {isCalibrated ? (
        <div className={styles.baselineMetrics}>
          <div className={styles.baselineMetric}>
            <span className={styles.baselineMetricLabel}>Avg Pitch</span>
            <span className={styles.baselineMetricValue}>{Math.round(baseline.avgPitch)} Hz</span>
          </div>
          <div className={styles.baselineMetric}>
            <span className={styles.baselineMetricLabel}>Pitch Stability</span>
            <span className={styles.baselineMetricValue}>{Math.round(baseline.avgPitchInstability / 1000)}k</span>
          </div>
          <div className={styles.baselineMetric}>
            <span className={styles.baselineMetricLabel}>Breathiness</span>
            <span className={styles.baselineMetricValue}>{baseline.avgBreathiness?.toFixed(3)}</span>
          </div>
          <div className={styles.baselineMetric}>
            <span className={styles.baselineMetricLabel}>Energy</span>
            <span className={styles.baselineMetricValue}>{baseline.avgEnergy?.toFixed(3)}</span>
          </div>
        </div>
      ) : (
        <p style={{ fontSize: '0.82rem', color: 'var(--text-tertiary)', lineHeight: 1.5 }}>
          Record your voice daily for {targetDays} days to build a personalized baseline. This allows the AI to detect meaningful changes specific to your voice.
        </p>
      )}
    </div>
  );
}
