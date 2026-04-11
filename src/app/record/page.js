'use client';
import { useState, useEffect, useRef, useCallback } from 'react';
import Navbar from '@/components/Navbar';
import AnimatedBackground from '@/components/AnimatedBackground';
import { getUserId, addRecord, getRecords, getBaseline, setBaseline, seedDemoData } from '@/lib/store/mockFirestore';
import { calculateHealthScore } from '@/lib/ai/healthScore';
import { classifyEmotion } from '@/lib/ai/emotionClassifier';
import styles from './page.module.css';

const MOCK_RESULTS = {
  tremor: { value: 21, status: 'good', label: 'Voice Tremor', icon: '〰️' },
  breathlessness: { value: 38, status: 'warning', label: 'Breathlessness', icon: '💨' },
  pitch: { value: 68, status: 'good', label: 'Pitch Variation', icon: '🎵' },
  speechRate: { value: 145, status: 'good', label: 'Speech Rate', icon: '🗣️' },
  pausePattern: { value: 12, status: 'good', label: 'Pause Patterns', icon: '⏸️' },
  clarity: { value: 82, status: 'good', label: 'Voice Clarity', icon: '✨' },
};

const RECORD_DURATION = 15;

export default function RecordPage() {
  const [state, setState] = useState('idle'); // idle | recording | processing | results
  const [timeLeft, setTimeLeft] = useState(RECORD_DURATION);
  const [audioData, setAudioData] = useState([]);
  const [results, setResults] = useState(null);
  const [mounted, setMounted] = useState(false);

  const analyserRef = useRef(null);
  const mediaStreamRef = useRef(null);
  const animFrameRef = useRef(null);
  const timerRef = useRef(null);
  const canvasRef = useRef(null);

  useEffect(() => { 
    setMounted(true); 
    
    // Cleanup on unmount to prevent memory leaks and track locking
    return () => {
      cancelAnimationFrame(animFrameRef.current);
      clearInterval(timerRef.current);
      if (mediaStreamRef.current) {
        mediaStreamRef.current.getTracks().forEach((t) => t.stop());
      }
      if (window.audioContext && window.audioContext.state !== 'closed') {
        window.audioContext.close().catch(() => {});
      }
    };
  }, []);

  const drawWaveform = useCallback(() => {
    if (!analyserRef.current || !canvasRef.current) return;
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    const analyser = analyserRef.current;
    const bufferLength = analyser.frequencyBinCount;
    const dataArray = new Uint8Array(bufferLength);

    const draw = () => {
      animFrameRef.current = requestAnimationFrame(draw);
      analyser.getByteTimeDomainData(dataArray);

      ctx.clearRect(0, 0, canvas.width, canvas.height);

      // Gradient line
      const gradient = ctx.createLinearGradient(0, 0, canvas.width, 0);
      gradient.addColorStop(0, '#4A6CF7');
      gradient.addColorStop(0.5, '#8b5cf6');
      gradient.addColorStop(1, '#ec4899');

      ctx.lineWidth = 3;
      ctx.strokeStyle = gradient;
      ctx.beginPath();

      const sliceWidth = canvas.width / bufferLength;
      let x = 0;

      for (let i = 0; i < bufferLength; i++) {
        const v = dataArray[i] / 128.0;
        const y = (v * canvas.height) / 2;

        if (i === 0) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);

        x += sliceWidth;
      }

      ctx.lineTo(canvas.width, canvas.height / 2);
      ctx.stroke();

      // Glow effect
      ctx.shadowColor = '#4A6CF7';
      ctx.shadowBlur = 15;
    };

    draw();
  }, []);

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      mediaStreamRef.current = stream;

      const audioContext = new (window.AudioContext || window.webkitAudioContext)();
      const source = audioContext.createMediaStreamSource(stream);
      const analyser = audioContext.createAnalyser();
      analyser.fftSize = 2048;
      source.connect(analyser);
      analyserRef.current = analyser;

      setState('recording');
      setTimeLeft(RECORD_DURATION);

      drawWaveform();

      // Countdown
      timerRef.current = setInterval(() => {
        setTimeLeft((prev) => {
          if (prev <= 1) {
            stopRecording();
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    } catch (err) {
      console.error('Microphone access denied:', err);
      alert('Please allow microphone access to record your voice diary.');
    }
  };

  const stopRecording = () => {
    clearInterval(timerRef.current);
    cancelAnimationFrame(animFrameRef.current);

    if (mediaStreamRef.current) {
      mediaStreamRef.current.getTracks().forEach((t) => t.stop());
    }

    setState('processing');

    // AI processing → store to DB
    setTimeout(() => {
      const uid = getUserId();
      seedDemoData(uid);
      const baseline = getBaseline(uid);

      // Generate features (mock — in production this comes from Python backend)
      const features = {
        mean_pitch_proxy: 1400 + Math.random() * 300,
        pitch_instability: 30000 + Math.random() * 40000,
        breathiness_proxy: 0.03 + Math.random() * 0.04,
        energy: 0.015 + Math.random() * 0.03,
        mfccs: Array.from({ length: 13 }, () => -200 + Math.random() * 300),
      };

      const scoreResult = calculateHealthScore(features, baseline);
      const emotionResult = classifyEmotion(features, baseline);

      // Persist the record
      addRecord(uid, {
        date: new Date().toISOString(),
        healthScore: scoreResult.score,
        features,
        emotion: emotionResult.primary?.key || 'neutral',
        analysis: {
          health_score: scoreResult.score,
          risk_level: scoreResult.score >= 90 ? 'low' : scoreResult.score >= 75 ? 'medium' : 'high',
          system_insights: {
            respiratory: { score: Math.min(100, scoreResult.score + 5), status: 'normal', insight: 'Analyzed.' },
            neurological: { score: Math.min(100, scoreResult.score + 3), status: 'normal', insight: 'Assessed.' },
            emotional: { score: Math.min(100, scoreResult.score - 2), status: 'normal', insight: 'Detected.' },
          },
        },
      });

      // Update baseline if within calibration period
      const records = getRecords(uid);
      if (!baseline?.calibrated && records.length >= 5) {
        const recent5 = records.slice(-5);
        const avgPitch = recent5.reduce((a, r) => a + (r.features?.mean_pitch_proxy || 0), 0) / 5;
        const avgPitchInst = recent5.reduce((a, r) => a + (r.features?.pitch_instability || 0), 0) / 5;
        const avgBreath = recent5.reduce((a, r) => a + (r.features?.breathiness_proxy || 0), 0) / 5;
        const avgEnergy = recent5.reduce((a, r) => a + (r.features?.energy || 0), 0) / 5;
        setBaseline(uid, {
          calibrated: true,
          samplesUsed: 5,
          avgPitch, avgPitchInstability: avgPitchInst,
          avgBreathiness: avgBreath, avgEnergy,
          avgMfccs: recent5[0].features?.mfccs || [],
          calibratedAt: new Date().toISOString(),
        });
      }

      setResults(MOCK_RESULTS);
      setState('results');
    }, 2500);
  };

  const resetRecording = () => {
    setState('idle');
    setTimeLeft(RECORD_DURATION);
    setResults(null);
  };

  const progressPercent = ((RECORD_DURATION - timeLeft) / RECORD_DURATION) * 100;
  const circumference = 2 * Math.PI * 72;

  return (
    <>
      <AnimatedBackground />
      <Navbar />
      <div className={`${styles.page} ${mounted ? styles.mounted : ''}`}>
        <div className={styles.content}>
          <header className={styles.header}>
            <h1 className={styles.title}>Voice Diary</h1>
            <p className={styles.subtitle}>
              Record a 15-second voice sample for AI biomarker analysis
            </p>
          </header>

          {/* ===== IDLE STATE ===== */}
          {state === 'idle' && (
            <div className={styles.idleState}>
              <div className={styles.recordBtnWrapper}>
                <div className={styles.outerRing} />
                <div className={styles.middleRing} />
                <button className={styles.recordBtn} onClick={startRecording}>
                  <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2">
                    <path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z" />
                    <path d="M19 10v2a7 7 0 0 1-14 0v-2" />
                    <line x1="12" y1="19" x2="12" y2="23" />
                    <line x1="8" y1="23" x2="16" y2="23" />
                  </svg>
                </button>
              </div>
              <p className={styles.idleHint}>Tap to start recording</p>
              <div className={styles.idleTips}>
                <div className={styles.tipCard}>
                  <span className={styles.tipIcon}>🤫</span>
                  <span>Find a quiet space</span>
                </div>
                <div className={styles.tipCard}>
                  <span className={styles.tipIcon}>📱</span>
                  <span>Hold device near mouth</span>
                </div>
                <div className={styles.tipCard}>
                  <span className={styles.tipIcon}>💬</span>
                  <span>Speak naturally</span>
                </div>
              </div>
            </div>
          )}

          {/* ===== RECORDING STATE ===== */}
          {state === 'recording' && (
            <div className={styles.recordingState}>
              <div className={styles.timerWrapper}>
                <svg className={styles.timerSvg} viewBox="0 0 160 160">
                  <circle
                    cx="80" cy="80" r="72"
                    fill="none"
                    stroke="rgba(74,108,247,0.1)"
                    strokeWidth="6"
                  />
                  <circle
                    cx="80" cy="80" r="72"
                    fill="none"
                    stroke="url(#timerGrad)"
                    strokeWidth="6"
                    strokeLinecap="round"
                    strokeDasharray={circumference}
                    strokeDashoffset={circumference - (progressPercent / 100) * circumference}
                    transform="rotate(-90 80 80)"
                    className={styles.timerArc}
                  />
                  <defs>
                    <linearGradient id="timerGrad" x1="0" y1="0" x2="1" y2="1">
                      <stop offset="0%" stopColor="#4A6CF7" />
                      <stop offset="100%" stopColor="#ec4899" />
                    </linearGradient>
                  </defs>
                </svg>
                <div className={styles.timerInner}>
                  <span className={styles.timerNum}>{timeLeft}</span>
                  <span className={styles.timerLabel}>seconds</span>
                </div>
                <div className={styles.recordingIndicator}>
                  <span className={styles.recDot} />
                  REC
                </div>
              </div>

              {/* Waveform */}
              <div className={styles.waveformContainer}>
                <canvas
                  ref={canvasRef}
                  width={600}
                  height={120}
                  className={styles.waveformCanvas}
                />
              </div>

              <button className={styles.stopBtn} onClick={stopRecording}>
                Stop Recording
              </button>
            </div>
          )}

          {/* ===== PROCESSING STATE ===== */}
          {state === 'processing' && (
            <div className={styles.processingState}>
              <div className={styles.processingOrb}>
                <div className={styles.processingRing1} />
                <div className={styles.processingRing2} />
                <div className={styles.processingRing3} />
                <span className={styles.processingIcon}>🧠</span>
              </div>
              <h3 className={styles.processingTitle}>Analyzing Voice Biomarkers</h3>
              <p className={styles.processingDesc}>
                AI is extracting vocal biomarker patterns...
              </p>
              <div className={styles.processingSteps}>
                {['Noise reduction', 'Feature extraction', 'AI analysis', 'Generating report'].map(
                  (step, i) => (
                    <div key={step} className={styles.processingStep} style={{ animationDelay: `${i * 0.5}s` }}>
                      <span className={styles.processingStepDot} />
                      {step}
                    </div>
                  )
                )}
              </div>
            </div>
          )}

          {/* ===== RESULTS STATE ===== */}
          {state === 'results' && results && (
            <div className={styles.resultsState}>
              <div className={styles.resultsHeader}>
                <span className={styles.resultsCheck}>✅</span>
                <h3 className={styles.resultsTitle}>Analysis Complete</h3>
                <p className={styles.resultsDesc}>
                  Your voice biomarkers have been analyzed. Here are today's results:
                </p>
              </div>

              <div className={styles.resultsGrid}>
                {Object.entries(results).map(([key, bm], i) => (
                  <div
                    key={key}
                    className={`${styles.resultCard} glass-panel`}
                    style={{ animationDelay: `${i * 0.1}s` }}
                  >
                    <span className={styles.resultIcon}>{bm.icon}</span>
                    <div className={styles.resultInfo}>
                      <span className={styles.resultLabel}>{bm.label}</span>
                      <span className={styles.resultValue}>{bm.value}</span>
                    </div>
                    <span
                      className={`badge ${
                        bm.status === 'good'
                          ? 'badge-success'
                          : bm.status === 'warning'
                          ? 'badge-warning'
                          : 'badge-danger'
                      }`}
                    >
                      {bm.status === 'good' ? '● Normal' : bm.status === 'warning' ? '● Elevated' : '● Alert'}
                    </span>
                  </div>
                ))}
              </div>

              <div className={styles.resultsActions}>
                <button className="pill-button pill-button-primary" onClick={resetRecording}>
                  Record Again
                </button>
                <button className="pill-button pill-button-glass">
                  Save to Diary
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </>
  );
}
