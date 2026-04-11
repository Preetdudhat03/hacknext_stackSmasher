'use client';
import { motion } from 'framer-motion';
import styles from './voice.module.css';

/**
 * Feature 8: Emotion & Mental Health Detection
 * Displays classified emotions as tag badges.
 */
export default function EmotionDetector({ emotionResult }) {
  if (!emotionResult || !emotionResult.primary) return null;

  const { primary, secondary, confidence } = emotionResult;

  return (
    <div className={styles.emotionWrapper}>
      <motion.div
        className={`${styles.emotionBadge} ${styles.emotionBadgePrimary}`}
        style={{
          background: primary.bg,
          color: primary.color,
          borderColor: `${primary.color}30`,
        }}
        initial={{ opacity: 0, scale: 0.8 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.4, ease: [0.25, 0.46, 0.45, 0.94] }}
      >
        <span className={styles.emotionIcon}>{primary.icon}</span>
        {primary.label}
        <span className={styles.emotionConfidence}>{confidence}%</span>
      </motion.div>

      {secondary && (
        <motion.div
          className={styles.emotionBadge}
          style={{
            background: secondary.bg,
            color: secondary.color,
            borderColor: `${secondary.color}30`,
          }}
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.4, delay: 0.15 }}
        >
          <span className={styles.emotionIcon}>{secondary.icon}</span>
          {secondary.label}
        </motion.div>
      )}
    </div>
  );
}
