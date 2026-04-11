'use client';
import styles from './voice.module.css';

/**
 * Feature 3: Smart AI Feedback Panel
 * Displays AI-generated insights with severity indicators.
 */
export default function SmartFeedback({ insights = [] }) {
  if (!insights || insights.length === 0) return null;

  const severityClass = (severity) => {
    if (severity === 'high') return styles.severityHigh;
    if (severity === 'medium') return styles.severityMedium;
    return styles.severityLow;
  };

  return (
    <div className={styles.feedbackPanel}>
      {insights.map((insight, i) => (
        <div
          key={i}
          className={styles.feedbackCard}
          style={{ animationDelay: `${i * 0.1}s` }}
        >
          <span className={styles.feedbackIcon}>{insight.icon}</span>
          <div className={styles.feedbackContent}>
            <p className={styles.feedbackMessage}>
              <span className={`${styles.feedbackSeverity} ${severityClass(insight.severity)}`} />
              {insight.message}
            </p>
          </div>
        </div>
      ))}
    </div>
  );
}
