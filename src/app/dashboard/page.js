'use client';
import { useState, useEffect } from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import dynamic from 'next/dynamic';
import Navbar from '@/components/Navbar';
import AnimatedBackground from '@/components/AnimatedBackground';
import { getUserId, getRecords, getBaseline, seedDemoData } from '@/lib/store/mockFirestore';
import { calculateHealthScore } from '@/lib/ai/healthScore';
import { generateFeedback } from '@/lib/ai/feedbackEngine';
import { classifyEmotion } from '@/lib/ai/emotionClassifier';
import styles from './page.module.css';

import HealthScoreRing from '@/components/voice/HealthScoreRing';
import SmartFeedback from '@/components/voice/SmartFeedback';
import EmotionDetector from '@/components/voice/EmotionDetector';
import TrendPrediction from '@/components/voice/TrendPrediction';
import VoiceBaseline from '@/components/voice/VoiceBaseline';
import EmergencyAlert from '@/components/voice/EmergencyAlert';
import MedicationTracker from '@/components/voice/MedicationTracker';
import HealthAssistant from '@/components/voice/HealthAssistant';

const BIOMARKERS = [
  {
    id: 'tremor',
    label: 'Voice Tremor',
    value: 23,
    unit: '/100',
    trend: 'down',
    status: 'good',
    icon: '〰️',
    desc: 'Low tremor detected',
    history: [30, 28, 25, 27, 24, 23, 23],
  },
  {
    id: 'breath',
    label: 'Breathlessness',
    value: 41,
    unit: '/100',
    trend: 'up',
    status: 'warning',
    icon: '💨',
    desc: 'Slightly elevated',
    history: [35, 33, 36, 38, 39, 40, 41],
  },
  {
    id: 'pitch',
    label: 'Pitch Variation',
    value: 67,
    unit: 'Hz σ',
    trend: 'stable',
    status: 'good',
    icon: '🎵',
    desc: 'Normal range',
    history: [65, 68, 66, 67, 69, 66, 67],
  },
  {
    id: 'speech',
    label: 'Speech Rate',
    value: 142,
    unit: 'wpm',
    trend: 'stable',
    status: 'good',
    icon: '🗣️',
    desc: 'Consistent pace',
    history: [140, 143, 141, 142, 144, 141, 142],
  },
];

const CONDITIONS = [
  { id: 'asthma', label: 'Asthma', icon: '🫁', active: true },
  { id: 'depression', label: 'Depression', icon: '🌊', active: true },
  { id: 'parkinsons', label: "Parkinson's", icon: '🔬', active: false },
];

const TREND_LABELS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

function SparkLine({ data, color = '#4A6CF7', width = 120, height = 36 }) {
  const max = Math.max(...data);
  const min = Math.min(...data);
  const range = max - min || 1;
  const points = data
    .map((v, i) => {
      const x = (i / (data.length - 1)) * width;
      const y = height - ((v - min) / range) * (height - 4) - 2;
      return `${x},${y}`;
    })
    .join(' ');

  const areaPoints = `0,${height} ${points} ${width},${height}`;

  return (
    <svg width={width} height={height} className={styles.sparkline}>
      <defs>
        <linearGradient id={`grad-${color.replace('#', '')}`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={color} stopOpacity="0.3" />
          <stop offset="100%" stopColor={color} stopOpacity="0" />
        </linearGradient>
      </defs>
      <polygon
        points={areaPoints}
        fill={`url(#grad-${color.replace('#', '')})`}
      />
      <polyline
        points={points}
        fill="none"
        stroke={color}
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

export default function DashboardPage() {
  const [mounted, setMounted] = useState(false);
  const [healthData, setHealthData] = useState(null);
  const streak = 12;
  const today = new Date().toLocaleDateString('en-US', {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
  });

  useEffect(() => {
    setMounted(true);

    // Initialize data
    const uid = getUserId();
    seedDemoData(uid);

    const records = getRecords(uid);
    const baseline = getBaseline(uid);

    const sorted = [...records].sort((a, b) =>
      new Date(a.createdAt || a.date) - new Date(b.createdAt || b.date)
    );

    const latestRecord = sorted[sorted.length - 1];
    const previousRecord = sorted.length > 1 ? sorted[sorted.length - 2] : null;
    const latestFeatures = latestRecord?.features || null;

    // Calculate health score
    const scoreResult = calculateHealthScore(latestFeatures, baseline);

    // Generate feedback
    const insights = generateFeedback(latestFeatures, baseline, sorted);

    // Classify emotion
    const emotionResult = classifyEmotion(latestFeatures, baseline);

    // Historical scores for trend prediction
    const historicalScores = sorted.map(r => r.healthScore || 0);

    setHealthData({
      scoreResult,
      insights,
      emotionResult,
      historicalScores,
      baseline,
      recordCount: records.length,
      currentScore: scoreResult.score,
      previousScore: previousRecord?.healthScore || null,
    });
  }, []);

  const trendIcon = (trend) => {
    if (trend === 'up') return '↑';
    if (trend === 'down') return '↓';
    return '→';
  };

  const statusColor = (status) => {
    if (status === 'good') return '#22c55e';
    if (status === 'warning') return '#fbbf24';
    return '#ef4444';
  };

  return (
    <>
      <AnimatedBackground />
      <Navbar />
      <div className={`${styles.page} ${mounted ? styles.mounted : ''}`}>
        <div className={styles.content}>
          {/* Header */}
          <motion.header
            className={styles.header}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
          >
            <div className={styles.greeting}>
              <h1 className={styles.greetTitle}>Good Afternoon 👋</h1>
              <p className={styles.greetDate}>{today}</p>
            </div>
            <div className={styles.headerRight}>
              <div className={styles.streakBadge}>
                <span className={styles.streakFire}>🔥</span>
                <span className={styles.streakNum}>{streak}</span>
                <span className={styles.streakLabel}>Day Streak</span>
              </div>
            </div>
          </motion.header>

          {/* Top row: AI Health Score + Quick Record */}
          <div className={styles.topRow}>
            {/* AI Health Score Ring (Feature 1) */}
            <div className={`${styles.scoreCard} glass-panel`}>
              {healthData ? (
                <div style={{ display: 'flex', alignItems: 'center', gap: '24px', flexWrap: 'wrap' }}>
                  <HealthScoreRing
                    score={healthData.scoreResult.score}
                    classification={healthData.scoreResult.classification}
                    color={healthData.scoreResult.color}
                    breakdown={healthData.scoreResult.breakdown}
                  />
                  <div className={styles.scoreInfo}>
                    <h3 className={styles.scoreTitle}>AI Health Score</h3>
                    <p className={styles.scoreDesc}>Calculated from your voice biomarkers vs baseline</p>
                    {/* Emotion Detection (Feature 8) */}
                    {healthData.emotionResult && (
                      <div style={{ marginTop: '12px' }}>
                        <EmotionDetector emotionResult={healthData.emotionResult} />
                      </div>
                    )}
                  </div>
                </div>
              ) : (
                <div className={styles.scoreRing}>
                  <svg viewBox="0 0 120 120" className={styles.scoreRingSvg}>
                    <circle cx="60" cy="60" r="52" fill="none" stroke="rgba(74,108,247,0.1)" strokeWidth="8" />
                  </svg>
                  <div className={styles.scoreValue}>
                    <span className={styles.scoreNum}>—</span>
                  </div>
                </div>
              )}
            </div>

            {/* Quick Record */}
            <Link href="/record" className={`${styles.recordCard} glass-panel`}>
              <div className={styles.recordIcon}>
                <div className={styles.recordPulse} />
                <div className={styles.recordDot}>
                  <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2">
                    <path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z" />
                    <path d="M19 10v2a7 7 0 0 1-14 0v-2" />
                    <line x1="12" y1="19" x2="12" y2="23" />
                    <line x1="8" y1="23" x2="16" y2="23" />
                  </svg>
                </div>
              </div>
              <h3 className={styles.recordTitle}>Record Voice Diary</h3>
              <p className={styles.recordDesc}>15-second daily voice sample</p>
              <span className={styles.recordCta}>Start Recording →</span>
            </Link>
          </div>

          {/* Smart AI Feedback (Feature 3) */}
          {healthData?.insights?.length > 0 && (
            <section style={{ marginBottom: '24px' }}>
              <h2 className={styles.sectionTitle}>🧠 AI Insights</h2>
              <SmartFeedback insights={healthData.insights} />
            </section>
          )}

          {/* Biomarker Cards Grid */}
          <section className={styles.biomarkers}>
            <h2 className={styles.sectionTitle}>Voice Biomarkers</h2>
            <div className={styles.bioGrid}>
              {BIOMARKERS.map((bm, i) => (
                <div
                  key={bm.id}
                  className={`${styles.bioCard} glass-panel`}
                  style={{ animationDelay: `${i * 0.1}s` }}
                >
                  <div className={styles.bioHeader}>
                    <span className={styles.bioIcon}>{bm.icon}</span>
                    <span
                      className={styles.bioTrend}
                      style={{ color: statusColor(bm.status) }}
                    >
                      {trendIcon(bm.trend)}
                    </span>
                  </div>
                  <div className={styles.bioValue}>
                    {bm.value}
                    <span className={styles.bioUnit}>{bm.unit}</span>
                  </div>
                  <div className={styles.bioLabel}>{bm.label}</div>
                  <div className={styles.bioDesc}>{bm.desc}</div>
                  <div className={styles.bioChart}>
                    <SparkLine
                      data={bm.history}
                      color={statusColor(bm.status)}
                    />
                  </div>
                </div>
              ))}
            </div>
          </section>

          {/* Trend Prediction (Feature 7) */}
          {healthData?.historicalScores?.length > 2 && (
            <section style={{ marginBottom: '24px' }}>
              <TrendPrediction
                historicalScores={healthData.historicalScores}
                labels={healthData.historicalScores.map((_, i) => `Day ${i + 1}`)}
              />
            </section>
          )}

          {/* Bottom: Weekly Overview + Conditions */}
          <div className={styles.bottomRow}>
            {/* Weekly Overview */}
            <div className={`${styles.weeklyCard} glass-panel`}>
              <h3 className={styles.weeklyTitle}>7-Day Trend</h3>
              <div className={styles.weeklyChart}>
                {(healthData?.historicalScores || [72, 75, 74, 76, 73, 78, 78]).map((val, i) => (
                  <div key={i} className={styles.weeklyBar}>
                    <div
                      className={styles.weeklyBarFill}
                      style={{
                        height: `${val}%`,
                        background: `linear-gradient(to top, #4A6CF7, #6d8dff)`,
                        animationDelay: `${i * 0.08}s`,
                      }}
                    />
                    <span className={styles.weeklyBarLabel}>{TREND_LABELS[i]}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Active Conditions */}
            <div className={`${styles.conditionsCard} glass-panel`}>
              <h3 className={styles.conditionsTitle}>Tracked Conditions</h3>
              <div className={styles.conditionsList}>
                {CONDITIONS.map((c) => (
                  <div key={c.id} className={styles.conditionItem}>
                    <span className={styles.conditionIcon}>{c.icon}</span>
                    <span className={styles.conditionLabel}>{c.label}</span>
                    <span
                      className={`${styles.conditionStatus} ${
                        c.active ? styles.conditionActive : ''
                      }`}
                    >
                      {c.active ? 'Active' : 'Inactive'}
                    </span>
                  </div>
                ))}
              </div>
              <Link href="/conditions" className={styles.conditionsLink}>
                Manage Conditions →
              </Link>
            </div>
          </div>

          {/* Voice Baseline (Feature 2) */}
          {healthData && (
            <section style={{ marginBottom: '24px' }}>
              <VoiceBaseline
                baseline={healthData.baseline}
                recordCount={healthData.recordCount}
              />
            </section>
          )}

          {/* Emergency Alert System (Feature 5) */}
          {healthData && (
            <section style={{ marginBottom: '24px' }}>
              <EmergencyAlert
                currentScore={healthData.currentScore}
                previousScore={healthData.previousScore}
              />
            </section>
          )}

          {/* Medication Tracker (Feature 6) */}
          <section style={{ marginBottom: '24px' }}>
            <MedicationTracker />
          </section>

          {/* Alert Banner */}
          <div className={`${styles.alertBanner} glass-panel`}>
            <span className={styles.alertIcon}>⚠️</span>
            <div className={styles.alertText}>
              <strong>Breathlessness slightly elevated</strong>
              <p>Your breathlessness index has increased 17% over the past 3 days. Consider consulting your physician if symptoms persist.</p>
            </div>
            <button className={styles.alertDismiss}>Dismiss</button>
          </div>

          {/* Disclaimer */}
          <div style={{
            display: 'flex', alignItems: 'center', gap: '10px',
            padding: '12px 20px', marginTop: '24px',
            background: 'rgba(99,102,241,0.06)', border: '1px solid rgba(99,102,241,0.12)',
            borderRadius: 'var(--radius-lg)'
          }}>
            <span style={{ fontSize: '1.1rem', flexShrink: 0 }}>ℹ️</span>
            <span style={{ fontSize: '0.75rem', color: 'var(--text-tertiary)', lineHeight: 1.4, fontWeight: 500 }}>
              This is not a medical diagnosis. Consult a doctor for professional advice.
            </span>
          </div>
        </div>
      </div>

      {/* Health Assistant (Feature 9) — Floating widget */}
      <HealthAssistant />
    </>
  );
}
