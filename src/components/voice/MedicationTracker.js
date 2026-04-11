'use client';
import { useState, useEffect } from 'react';
import { getUserId, getMedications, addMedication, deleteMedication, getRecords } from '@/lib/store/mockFirestore';
import styles from './voice.module.css';

/**
 * Feature 6: Medication Effect Tracker
 * Track medications and correlate with health score changes.
 */
export default function MedicationTracker() {
  const [mounted, setMounted] = useState(false);
  const [medications, setMeds] = useState([]);
  const [records, setRecords] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [newMed, setNewMed] = useState({ name: '', startDate: '' });

  useEffect(() => {
    setMounted(true);
    const uid = getUserId();
    setMeds(getMedications(uid));
    setRecords(getRecords(uid));
  }, []);

  const handleAdd = () => {
    if (!newMed.name || !newMed.startDate) return;
    const uid = getUserId();
    addMedication(uid, newMed);
    setMeds(getMedications(uid));
    setNewMed({ name: '', startDate: '' });
    setShowForm(false);
  };

  const handleDelete = (medId) => {
    const uid = getUserId();
    deleteMedication(uid, medId);
    setMeds(getMedications(uid));
  };

  const generateInsight = (med) => {
    const medDate = new Date(med.startDate);
    const sortedRecords = [...records].sort((a, b) =>
      new Date(a.createdAt || a.date) - new Date(b.createdAt || b.date)
    );

    const preMed = sortedRecords.filter(r => new Date(r.createdAt || r.date) < medDate);
    const postMed = sortedRecords.filter(r => new Date(r.createdAt || r.date) >= medDate);

    if (preMed.length === 0 || postMed.length === 0) return null;

    const preAvg = preMed.reduce((a, r) => a + (r.healthScore || 0), 0) / preMed.length;
    const postAvg = postMed.reduce((a, r) => a + (r.healthScore || 0), 0) / postMed.length;
    const diff = Math.round(postAvg - preAvg);

    if (diff > 0) {
      return `Voice stability improved by ${diff} points after starting ${med.name}.`;
    } else if (diff < 0) {
      return `Health score decreased by ${Math.abs(diff)} points since starting ${med.name}. Consult your doctor.`;
    }
    return `No significant change detected since starting ${med.name}.`;
  };

  // Build timeline data
  const timelineData = records
    .sort((a, b) => new Date(a.createdAt || a.date) - new Date(b.createdAt || b.date))
    .map(r => ({ date: r.createdAt || r.date, score: r.healthScore || 0 }));

  if (!mounted) return null;

  return (
    <div className={`${styles.medWrapper} glass-panel`}>
      <div className={styles.medHeader}>
        <h3 className={styles.medTitle}>💊 Medication Tracker</h3>
        <button className={styles.addMedBtn} onClick={() => setShowForm(!showForm)}>
          {showForm ? '✕ Cancel' : '+ Add'}
        </button>
      </div>

      {showForm && (
        <div className={styles.medForm}>
          <input
            className={styles.medInput}
            placeholder="Medication Name"
            value={newMed.name}
            onChange={(e) => setNewMed({ ...newMed, name: e.target.value })}
          />
          <input
            className={styles.medDateInput}
            type="date"
            value={newMed.startDate}
            onChange={(e) => setNewMed({ ...newMed, startDate: e.target.value })}
          />
          <button className={styles.medSubmitBtn} onClick={handleAdd}>Add</button>
        </div>
      )}

      {medications.length > 0 ? (
        <>
          <div className={styles.medList}>
            {medications.map((med) => {
              const insight = generateInsight(med);
              return (
                <div key={med.id}>
                  <div className={styles.medItem}>
                    <div>
                      <span className={styles.medName}>💊 {med.name}</span>
                      <br />
                      <span className={styles.medDate}>
                        Started: {new Date(med.startDate).toLocaleDateString()}
                      </span>
                    </div>
                    <button className={styles.medDelete} onClick={() => handleDelete(med.id)}>✕</button>
                  </div>
                  {insight && <div className={styles.medInsight}>{insight}</div>}
                </div>
              );
            })}
          </div>

          {/* Timeline chart */}
          {timelineData.length > 1 && (
            <svg viewBox="0 0 400 100" className={styles.medChartSvg}>
              <defs>
                <linearGradient id="medGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#4A6CF7" stopOpacity="0.2" />
                  <stop offset="100%" stopColor="#4A6CF7" stopOpacity="0" />
                </linearGradient>
              </defs>
              {/* Score line */}
              {(() => {
                const max = 100;
                const points = timelineData.map((d, i) => {
                  const x = (i / (timelineData.length - 1)) * 380 + 10;
                  const y = 90 - (d.score / max) * 80;
                  return `${x},${y}`;
                }).join(' ');
                return (
                  <>
                    <polygon points={`10,90 ${points} 390,90`} fill="url(#medGrad)" />
                    <polyline points={points} fill="none" stroke="#4A6CF7" strokeWidth="2" strokeLinecap="round" />
                  </>
                );
              })()}
              {/* Medication markers */}
              {medications.map((med, idx) => {
                const medDate = new Date(med.startDate).getTime();
                const dates = timelineData.map(d => new Date(d.date).getTime());
                const minDate = Math.min(...dates);
                const maxDate = Math.max(...dates);
                const range = maxDate - minDate || 1;
                const x = ((medDate - minDate) / range) * 380 + 10;

                return (
                  <g key={idx}>
                    <line x1={x} y1="5" x2={x} y2="90" stroke="#ef4444" strokeWidth="1" strokeDasharray="4,3" />
                    <text x={x} y="98" fill="#ef4444" fontSize="8" textAnchor="middle" fontFamily="Inter,sans-serif">
                      {med.name}
                    </text>
                  </g>
                );
              })}
            </svg>
          )}
        </>
      ) : (
        <p style={{ fontSize: '0.82rem', color: 'var(--text-tertiary)' }}>
          No medications added yet. Add your medications to track their effects on your voice health.
        </p>
      )}
    </div>
  );
}
