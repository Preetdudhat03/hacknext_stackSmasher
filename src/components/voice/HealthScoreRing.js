'use client';
import { useMemo } from 'react';
import { motion } from 'framer-motion';
import styles from './voice.module.css';

/**
 * Feature 1: AI Health Score Ring
 * Animated circular progress with color-coded classification.
 */
export default function HealthScoreRing({ score = 0, classification = 'Mild', color = '#fbbf24', breakdown = {} }) {
  const radius = 64;
  const circumference = 2 * Math.PI * radius;
  const dashOffset = circumference - (score / 100) * circumference;

  const bgColor = useMemo(() => {
    if (score >= 90) return 'rgba(34,197,94,0.12)';
    if (score >= 60) return 'rgba(251,191,36,0.12)';
    return 'rgba(239,68,68,0.12)';
  }, [score]);

  return (
    <motion.div
      className={styles.scoreRingWrapper}
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.6, ease: [0.25, 0.46, 0.45, 0.94] }}
    >
      <div className={styles.scoreRingContainer}>
        <svg viewBox="0 0 144 144" className={styles.scoreRingSvg}>
          <defs>
            <linearGradient id="healthScoreGrad" x1="0" y1="0" x2="1" y2="1">
              <stop offset="0%" stopColor={color} />
              <stop offset="100%" stopColor={score >= 90 ? '#2dd4bf' : score >= 60 ? '#f59e0b' : '#dc2626'} />
            </linearGradient>
          </defs>
          <circle
            cx="72" cy="72" r={radius}
            fill="none"
            stroke="rgba(148,163,184,0.1)"
            strokeWidth="10"
            className={styles.scoreArcBg}
          />
          <motion.circle
            cx="72" cy="72" r={radius}
            fill="none"
            stroke="url(#healthScoreGrad)"
            strokeWidth="10"
            strokeLinecap="round"
            initial={{ strokeDasharray: `0 ${circumference}` }}
            animate={{ strokeDasharray: `${circumference - dashOffset} ${circumference}` }}
            transition={{ duration: 1.5, ease: [0.25, 0.46, 0.45, 0.94], delay: 0.3 }}
            className={styles.scoreArc}
          />
        </svg>
        <div className={styles.scoreCenter}>
          <motion.span
            className={styles.scoreNumber}
            style={{ color }}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.5 }}
          >
            {score}
          </motion.span>
          <span className={styles.scoreMax}>/ 100</span>
        </div>
      </div>

      <motion.span
        className={styles.scoreClassification}
        style={{ background: bgColor, color }}
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.8 }}
      >
        ● {classification}
      </motion.span>

      {breakdown && Object.keys(breakdown).length > 0 && (
        <motion.div
          className={styles.scoreBreakdown}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1.0 }}
        >
          {Object.entries(breakdown).map(([key, val]) => (
            <div key={key} className={styles.breakdownItem}>
              <span className={styles.breakdownValue} style={{ color }}>{val}</span>
              <span className={styles.breakdownLabel}>
                {key.replace(/([A-Z])/g, ' $1').trim()}
              </span>
            </div>
          ))}
        </motion.div>
      )}
    </motion.div>
  );
}
