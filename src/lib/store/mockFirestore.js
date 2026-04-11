'use client';

/**
 * Mock Firestore — localStorage-backed data persistence
 * Mirrors Firestore collection paths for easy migration to real Firebase.
 *
 * Collections:
 *   users/{userId}/baseline/
 *   users/{userId}/records/
 *   users/{userId}/insights/
 *   users/{userId}/medications/
 *   users/{userId}/emergencyContact
 */

const STORAGE_KEY = 'swaascare_db';

function getDB() {
  if (typeof window === 'undefined') return {};
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : {};
  } catch {
    return {};
  }
}

function saveDB(db) {
  if (typeof window === 'undefined') return;
  localStorage.setItem(STORAGE_KEY, JSON.stringify(db));
}

export function getUserId() {
  if (typeof window === 'undefined') return 'anonymous';
  let uid = localStorage.getItem('swaascare_uid');
  if (!uid) {
    uid = 'user_' + Math.random().toString(36).slice(2, 10);
    localStorage.setItem('swaascare_uid', uid);
  }
  return uid;
}

/* ——— Generic CRUD ——— */

export function getCollection(path) {
  const db = getDB();
  const data = db[path];
  if (!data) return [];
  return Object.entries(data).map(([id, doc]) => ({ id, ...doc }));
}

export function getDocument(path) {
  const db = getDB();
  return db[path] || null;
}

export function setDocument(path, data) {
  const db = getDB();
  db[path] = { ...data, updatedAt: new Date().toISOString() };
  saveDB(db);
}

export function addToCollection(collectionPath, data) {
  const db = getDB();
  if (!db[collectionPath]) db[collectionPath] = {};
  const id = 'doc_' + Date.now() + '_' + Math.random().toString(36).slice(2, 6);
  db[collectionPath][id] = { ...data, createdAt: new Date().toISOString() };
  saveDB(db);
  return id;
}

export function deleteFromCollection(collectionPath, docId) {
  const db = getDB();
  if (db[collectionPath] && db[collectionPath][docId]) {
    delete db[collectionPath][docId];
    saveDB(db);
  }
}

/* ——— Typed helpers ——— */

export function getBaseline(userId) {
  return getDocument(`users/${userId}/baseline`);
}

export function setBaseline(userId, baseline) {
  setDocument(`users/${userId}/baseline`, baseline);
}

export function getRecords(userId) {
  return getCollection(`users/${userId}/records`);
}

export function addRecord(userId, record) {
  return addToCollection(`users/${userId}/records`, record);
}

export function getInsights(userId) {
  return getCollection(`users/${userId}/insights`);
}

export function addInsight(userId, insight) {
  return addToCollection(`users/${userId}/insights`, insight);
}

export function getMedications(userId) {
  return getCollection(`users/${userId}/medications`);
}

export function addMedication(userId, medication) {
  return addToCollection(`users/${userId}/medications`, medication);
}

export function deleteMedication(userId, medId) {
  deleteFromCollection(`users/${userId}/medications`, medId);
}

export function getEmergencyContact(userId) {
  return getDocument(`users/${userId}/emergencyContact`);
}

export function setEmergencyContact(userId, contact) {
  setDocument(`users/${userId}/emergencyContact`, contact);
}

export function getAlertSettings(userId) {
  return getDocument(`users/${userId}/alertSettings`);
}

export function setAlertSettings(userId, settings) {
  setDocument(`users/${userId}/alertSettings`, settings);
}

/* ——— Seed demo data if empty ——— */
export function seedDemoData(userId) {
  const records = getRecords(userId);
  if (records.length > 0) return; // already seeded

  const now = Date.now();
  const DAY = 86400000;

  const demoRecords = [
    { dayOffset: -6, score: 72, features: { mean_pitch_proxy: 1480, pitch_instability: 52000, breathiness_proxy: 0.048, energy: 0.025, mfccs: [-200, 80, -10, 30, -5, 15, -8, 20, -3, 12, -6, 18, -2] }, emotion: 'neutral' },
    { dayOffset: -5, score: 75, features: { mean_pitch_proxy: 1510, pitch_instability: 48000, breathiness_proxy: 0.045, energy: 0.028, mfccs: [-195, 82, -8, 32, -4, 16, -7, 21, -2, 13, -5, 19, -1] }, emotion: 'calm' },
    { dayOffset: -4, score: 74, features: { mean_pitch_proxy: 1495, pitch_instability: 49000, breathiness_proxy: 0.046, energy: 0.026, mfccs: [-198, 81, -9, 31, -4, 15, -7, 20, -3, 12, -5, 18, -2] }, emotion: 'neutral' },
    { dayOffset: -3, score: 76, features: { mean_pitch_proxy: 1520, pitch_instability: 46000, breathiness_proxy: 0.043, energy: 0.030, mfccs: [-190, 83, -7, 33, -3, 17, -6, 22, -1, 14, -4, 20, 0] }, emotion: 'calm' },
    { dayOffset: -2, score: 73, features: { mean_pitch_proxy: 1475, pitch_instability: 53000, breathiness_proxy: 0.050, energy: 0.023, mfccs: [-205, 78, -12, 28, -6, 13, -9, 18, -4, 10, -7, 16, -3] }, emotion: 'stress' },
    { dayOffset: -1, score: 78, features: { mean_pitch_proxy: 1535, pitch_instability: 44000, breathiness_proxy: 0.041, energy: 0.032, mfccs: [-185, 85, -6, 35, -2, 18, -5, 23, 0, 15, -3, 21, 1] }, emotion: 'calm' },
    { dayOffset: 0, score: 78, features: { mean_pitch_proxy: 1540, pitch_instability: 43000, breathiness_proxy: 0.040, energy: 0.033, mfccs: [-183, 86, -5, 36, -1, 19, -4, 24, 1, 16, -2, 22, 2] }, emotion: 'neutral' },
  ];

  demoRecords.forEach((rec) => {
    const date = new Date(now + rec.dayOffset * DAY);
    addRecord(userId, {
      date: date.toISOString(),
      healthScore: rec.score,
      features: rec.features,
      emotion: rec.emotion,
      analysis: {
        health_score: rec.score,
        risk_level: rec.score >= 90 ? 'low' : rec.score >= 75 ? 'medium' : 'high',
        system_insights: {
          respiratory: { score: Math.min(100, rec.score + 5), status: 'normal', insight: 'Stable respiratory patterns.' },
          neurological: { score: Math.min(100, rec.score + 3), status: 'normal', insight: 'Vocal stability within range.' },
          emotional: { score: Math.min(100, rec.score - 2), status: rec.score < 75 ? 'warning' : 'normal', insight: 'Emotional tone assessed.' },
        },
      },
    });
  });

  // Seed baseline from first 5 records
  setBaseline(userId, {
    calibrated: true,
    samplesUsed: 5,
    avgPitch: 1500,
    avgPitchInstability: 49000,
    avgBreathiness: 0.046,
    avgEnergy: 0.027,
    avgMfccs: [-196, 81, -9, 31, -4, 15, -7, 20, -3, 12, -5, 18, -2],
    calibratedAt: new Date(now - 5 * DAY).toISOString(),
  });
}
