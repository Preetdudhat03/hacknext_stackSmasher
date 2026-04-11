'use client';
import { useState, useEffect } from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import Navbar from '@/components/Navbar';
import AnimatedBackground from '@/components/AnimatedBackground';
import { supabase, ensureDemoUser } from '@/lib/supabase';
import styles from './page.module.css';

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
  const [loading, setLoading] = useState(true);
  const [healthScore, setHealthScore] = useState(0);
  const [biomarkers, setBiomarkers] = useState(BIOMARKERS);
  const [weeklyTrend, setWeeklyTrend] = useState([0, 0, 0, 0, 0, 0, 0]);
  const [streak, setStreak] = useState(1);
  const [latestInsight, setLatestInsight] = useState('');

  const today = new Date().toLocaleDateString('en-US', {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
  });

  useEffect(() => {
    setMounted(true);
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      const userId = await ensureDemoUser();
      
      const { data: logs, error } = await supabase
        .from('voice_logs')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false })
        .limit(7);

      if (error) throw error;

      if (logs && logs.length > 0) {
        const latest = logs[0];
        setHealthScore(latest.health_score || 0);
        setLatestInsight(latest.system_insights?.neurological?.insight || 'Analysis complete.');
        
        // Map logs to biomarkers
        const updatedBio = BIOMARKERS.map(bm => {
          let val = bm.value;
          let hist = bm.history;

          if (bm.id === 'tremor') {
            val = Math.round(latest.system_insights?.neurological?.score || (latest.extracted_features?.pitch_instability / 1000) || val);
            hist = logs.map(l => Math.round(l.system_insights?.neurological?.score || (l.extracted_features?.pitch_instability / 1000) || 0)).reverse();
          } else if (bm.id === 'breath') {
            val = Math.round(latest.system_insights?.respiratory?.score || (latest.extracted_features?.breathiness_proxy * 1000) || val);
            hist = logs.map(l => Math.round(l.system_insights?.respiratory?.score || (l.extracted_features?.breathiness_proxy * 1000) || 0)).reverse();
          } else if (bm.id === 'pitch') {
            val = Math.round(latest.extracted_features?.mean_pitch_proxy || val);
            hist = logs.map(l => Math.round(l.extracted_features?.mean_pitch_proxy || 0)).reverse();
          } else if (bm.id === 'speech') {
            val = Math.round(latest.system_insights?.emotional?.score || val);
            hist = logs.map(l => Math.round(l.system_insights?.emotional?.score || 0)).reverse();
          }

          return { ...bm, value: val, history: hist };
        });

        setBiomarkers(updatedBio);
        setWeeklyTrend(logs.map(l => l.health_score).reverse());
        setStreak(logs.length);
      }
    } catch (err) {
      console.error('Dashboard fetch error:', err);
    } finally {
      setLoading(false);
    }
  };

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

          {/* Top row: Health Score + Quick Record */}
          <div className={styles.topRow}>
            {/* Health Score */}
            <div className={`${styles.scoreCard} glass-panel`}>
              <div className={styles.scoreRing}>
                <svg viewBox="0 0 120 120" className={styles.scoreRingSvg}>
                  <circle
                    cx="60"
                    cy="60"
                    r="52"
                    fill="none"
                    stroke="rgba(74,108,247,0.1)"
                    strokeWidth="8"
                  />
                  <circle
                    cx="60"
                    cy="60"
                    r="52"
                    fill="none"
                    stroke="url(#scoreGrad)"
                    strokeWidth="8"
                    strokeLinecap="round"
                    strokeDasharray={`${(healthScore / 100) * 327} 327`}
                    transform="rotate(-90 60 60)"
                    className={styles.scoreArc}
                  />
                  <defs>
                    <linearGradient id="scoreGrad" x1="0" y1="0" x2="1" y2="1">
                      <stop offset="0%" stopColor="#4A6CF7" />
                      <stop offset="100%" stopColor="#2dd4bf" />
                    </linearGradient>
                  </defs>
                </svg>
                <div className={styles.scoreValue}>
                  <span className={styles.scoreNum}>{healthScore}</span>
                  <span className={styles.scoreUnit}>/ 100</span>
                </div>
              </div>
              <div className={styles.scoreInfo}>
                <h3 className={styles.scoreTitle}>Overall Health Score</h3>
                <p className={styles.scoreDesc}>Based on your latest voice analysis</p>
                <span className="badge badge-success">● Normal Range</span>
              </div>
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

          {/* Biomarker Cards Grid */}
          <section className={styles.biomarkers}>
            <h2 className={styles.sectionTitle}>Voice Biomarkers</h2>
            <div className={styles.bioGrid}>
              {biomarkers.map((bm, i) => (
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
                      data={bm.history.length > 0 ? bm.history : [0, 0, 0, 0, 0, 0, 0]}
                      color={statusColor(bm.status)}
                    />
                  </div>
                </div>
              ))}
            </div>
          </section>

          {/* Bottom: Weekly Overview + Conditions */}
          <div className={styles.bottomRow}>
            {/* Weekly Overview */}
            <div className={`${styles.weeklyCard} glass-panel`}>
              <h3 className={styles.weeklyTitle}>Recent Progress</h3>
              <div className={styles.weeklyChart}>
                {weeklyTrend.map((val, i) => (
                  <div key={i} className={styles.weeklyBar}>
                    <div
                      className={styles.weeklyBarFill}
                      style={{
                        height: `${val || 5}%`,
                        background: `linear-gradient(to top, #4A6CF7, #6d8dff)`,
                        animationDelay: `${i * 0.08}s`,
                      }}
                    />
                    <span className={styles.weeklyBarLabel}>{TREND_LABELS[i] || '—'}</span>
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

          {/* Alert Banner */}
          {latestInsight && healthScore < 85 && (
            <div className={`${styles.alertBanner} glass-panel`}>
              <span className={styles.alertIcon}>⚠️</span>
              <div className={styles.alertText}>
                <strong>Health Insight Detected</strong>
                <p>{latestInsight}</p>
              </div>
              <button className={styles.alertDismiss} onClick={() => setLatestInsight('')}>Dismiss</button>
            </div>
          )}
        </div>
      </div>
    </>
  );
}
