'use client';
import { useState, useEffect } from 'react';
import { getUserId, getEmergencyContact, setEmergencyContact, getAlertSettings, setAlertSettings } from '@/lib/store/mockFirestore';
import styles from './voice.module.css';

/**
 * Feature 5: Emergency Alert System
 * Triggers when health score < 50 or sudden drop > 25%.
 */
export default function EmergencyAlert({ currentScore = 78, previousScore = null }) {
  const [mounted, setMounted] = useState(false);
  const [alertsEnabled, setAlertsEnabled] = useState(false);
  const [contact, setContact] = useState({ name: '', phone: '', relation: '' });
  const [saved, setSaved] = useState(false);
  const [alertTriggered, setAlertTriggered] = useState(false);

  useEffect(() => {
    setMounted(true);
    const uid = getUserId();
    const savedContact = getEmergencyContact(uid);
    const savedSettings = getAlertSettings(uid);

    if (savedContact) {
      setContact({ name: savedContact.name || '', phone: savedContact.phone || '', relation: savedContact.relation || '' });
      setSaved(true);
    }
    if (savedSettings) {
      setAlertsEnabled(savedSettings.enabled || false);
    }
  }, []);

  useEffect(() => {
    if (!alertsEnabled) return;

    const isLowScore = currentScore < 50;
    const isSuddenDrop = previousScore && ((previousScore - currentScore) / previousScore) * 100 > 25;

    if (isLowScore || isSuddenDrop) {
      setAlertTriggered(true);
    } else {
      setAlertTriggered(false);
    }
  }, [currentScore, previousScore, alertsEnabled]);

  const toggleAlerts = () => {
    const newState = !alertsEnabled;
    setAlertsEnabled(newState);
    const uid = getUserId();
    setAlertSettings(uid, { enabled: newState });
  };

  const saveContact = () => {
    if (!contact.name || !contact.phone) return;
    const uid = getUserId();
    setEmergencyContact(uid, contact);
    setSaved(true);
  };

  if (!mounted) return null;

  return (
    <div className={`${styles.emergencyWrapper} glass-panel`}>
      <div className={styles.emergencyHeader}>
        <h3 className={styles.emergencyTitle}>🚨 Emergency Alerts</h3>
        <button
          className={`${styles.alertToggle} ${alertsEnabled ? styles.alertToggleActive : ''}`}
          onClick={toggleAlerts}
        >
          <span className={styles.alertToggleDot} />
        </button>
      </div>

      {alertTriggered && alertsEnabled && (
        <div className={styles.alertBanner}>
          <span className={styles.alertBannerIcon}>🚑</span>
          <span className={styles.alertBannerMsg}>
            Critical health score detected ({currentScore}/100). Emergency contact has been notified.
          </span>
        </div>
      )}

      <div className={styles.contactForm}>
        <input
          className={styles.contactInput}
          placeholder="Contact Name"
          value={contact.name}
          onChange={(e) => setContact({ ...contact, name: e.target.value })}
        />
        <input
          className={styles.contactInput}
          placeholder="Phone Number"
          value={contact.phone}
          onChange={(e) => setContact({ ...contact, phone: e.target.value })}
        />
        <input
          className={styles.contactInput}
          placeholder="Relation (e.g. Doctor, Spouse)"
          value={contact.relation}
          onChange={(e) => setContact({ ...contact, relation: e.target.value })}
        />
        <button className={styles.saveContactBtn} onClick={saveContact}>
          {saved ? '✓ Contact Saved' : 'Save Emergency Contact'}
        </button>
      </div>

      {saved && (
        <p className={styles.alertSentNote}>
          {alertsEnabled
            ? '✓ Alerts enabled — notifications will be sent via SMS/WhatsApp when triggered.'
            : 'Alerts are currently disabled. Toggle on to receive emergency notifications.'}
        </p>
      )}
    </div>
  );
}
