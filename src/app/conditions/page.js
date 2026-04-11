'use client';
import { useState, useEffect } from 'react';
import Navbar from '@/components/Navbar';
import AnimatedBackground from '@/components/AnimatedBackground';
import styles from './page.module.css';

const CONDITIONS = [
  {
    id: 'asthma',
    label: 'Asthma',
    icon: '🫁',
    color: '#38bdf8',
    active: true,
    description: 'Monitor respiratory health through breath patterns, wheeze detection, and voice strain analysis.',
    biomarkers: ['Breathlessness index', 'Wheeze frequency', 'Voice strain'],
    lastChecked: '2 hours ago',
    severity: 'Mild',
  },
  {
    id: 'cardiovascular',
    label: 'Cardiovascular Diseases',
    icon: '❤️',
    color: '#ef4444',
    active: true,
    description: 'Track heart health indicators through subtle vocal tremor patterns and blood pressure proxies.',
    biomarkers: ['Heart rate variability', 'Vocal tremor', 'Fatigue markers'],
    lastChecked: '2 hours ago',
    severity: 'Moderate',
  },
  {
    id: 'neurological',
    label: 'Neurological Disorders',
    icon: '🧠',
    color: '#8b5cf6',
    active: false,
    description: 'Assess neural pathway function through speech clarity, articulation patterns, and cognitive markers.',
    biomarkers: ['Speech clarity', 'Word recall speed', 'Articulation precision'],
    lastChecked: 'Never',
    severity: 'N/A',
  },
  {
    id: 'post-stroke',
    label: 'Post-Stroke Complications',
    icon: '⚡',
    color: '#f59e0b',
    active: false,
    description: 'Track recovery progress through voice strength, speech fluency, and motor control indicators.',
    biomarkers: ['Voice strength', 'Speech fluency', 'Motor control'],
    lastChecked: 'Never',
    severity: 'N/A',
  },
  {
    id: 'parkinsons',
    label: "Parkinson's Disease",
    icon: '🔬',
    color: '#22c55e',
    active: false,
    description: 'Monitor tremor progression and motor function through micro-tremor analysis and voice stability.',
    biomarkers: ['Micro-tremor index', 'Voice stability', 'Speech monotonicity'],
    lastChecked: 'Never',
    severity: 'N/A',
  },
  {
    id: 'depression',
    label: 'Depression',
    icon: '🌊',
    color: '#6366f1',
    active: true,
    description: 'Track mental health indicators through tonal variation, energy levels, and speech pace patterns.',
    biomarkers: ['Tonal variation', 'Energy index', 'Speech pace', 'Pause patterns'],
    lastChecked: '2 hours ago',
    severity: 'Mild',
  },
];

export default function ConditionsPage() {
  const [mounted, setMounted] = useState(false);
  const [openCondition, setOpenCondition] = useState(null);
  const [conditions, setConditions] = useState(CONDITIONS);

  useEffect(() => { setMounted(true); }, []);

  const toggleCondition = (id) => {
    setConditions((prev) =>
      prev.map((c) => (c.id === id ? { ...c, active: !c.active } : c))
    );
  };

  const severityBadge = (severity) => {
    if (severity === 'N/A') return 'badge-glass';
    if (severity === 'Mild') return 'badge-success';
    if (severity === 'Moderate') return 'badge-warning';
    return 'badge-danger';
  };

  return (
    <>
      <AnimatedBackground />
      <Navbar />
      <div className={`${styles.page} ${mounted ? styles.mounted : ''}`}>
        <div className={styles.content}>
          <header className={styles.header}>
            <div>
              <h1 className={styles.title}>Condition Tracking</h1>
              <p className={styles.subtitle}>
                Manage the conditions you want to monitor through voice biomarkers
              </p>
            </div>
            <div className={styles.stats}>
              <div className={styles.statItem}>
                <span className={styles.statNum}>
                  {conditions.filter((c) => c.active).length}
                </span>
                <span className={styles.statLabel}>Active</span>
              </div>
              <div className={styles.statItem}>
                <span className={styles.statNum}>{conditions.length}</span>
                <span className={styles.statLabel}>Total</span>
              </div>
            </div>
          </header>

          <div className={styles.conditionsGrid}>
            {conditions.map((cond, i) => (
              <div
                key={cond.id}
                className={`${styles.condCard} glass-panel ${
                  openCondition === cond.id ? styles.condCardExpanded : ''
                }`}
                style={{ animationDelay: `${i * 0.08}s` }}
              >
                <div
                  className={styles.condHeader}
                  onClick={() =>
                    setOpenCondition(openCondition === cond.id ? null : cond.id)
                  }
                >
                  <div
                    className={styles.condIconWrapper}
                    style={{ background: `${cond.color}15`, borderColor: `${cond.color}30` }}
                  >
                    <span className={styles.condIcon}>{cond.icon}</span>
                  </div>
                  <div className={styles.condInfo}>
                    <h3 className={styles.condName}>{cond.label}</h3>
                    <span className={styles.condLastChecked}>
                      Last: {cond.lastChecked}
                    </span>
                  </div>
                  <div className={styles.condActions}>
                    <span className={`badge ${severityBadge(cond.severity)}`}>
                      {cond.severity}
                    </span>
                    <button
                      className={`${styles.toggleBtn} ${cond.active ? styles.toggleActive : ''}`}
                      onClick={(e) => {
                        e.stopPropagation();
                        toggleCondition(cond.id);
                      }}
                    >
                      <span className={styles.toggleDot} />
                    </button>
                  </div>
                  <svg
                    className={`${styles.condChevron} ${
                      openCondition === cond.id ? styles.condChevronOpen : ''
                    }`}
                    width="18"
                    height="18"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                  >
                    <path d="M6 9l6 6 6-6" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                </div>

                {/* Expanded detail */}
                <div
                  className={`${styles.condDetail} ${
                    openCondition === cond.id ? styles.condDetailVisible : ''
                  }`}
                >
                  <p className={styles.condDesc}>{cond.description}</p>
                  <div className={styles.condBiomarkers}>
                    <span className={styles.condBioTitle}>Tracked Biomarkers:</span>
                    <div className={styles.condBioList}>
                      {cond.biomarkers.map((bm) => (
                        <span key={bm} className={styles.condBioPill} style={{ borderColor: `${cond.color}40` }}>
                          {bm}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </>
  );
}
