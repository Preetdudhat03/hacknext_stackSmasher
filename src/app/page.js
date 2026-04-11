'use client';
import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import dynamic from 'next/dynamic';
import AnimatedBackground from '@/components/AnimatedBackground';
import styles from './page.module.css';

const HumanBody3D = dynamic(() => import('@/components/HumanBody3D'), {
  ssr: false,
  loading: () => (
    <div className={styles.modelLoader}>
      <div className={styles.loaderRing} />
    </div>
  ),
});

const CONDITIONS = {
  asthma:         { label: 'Asthma',                 icon: '🫁', desc: 'Respiratory monitoring via breath patterns and wheeze detection' },
  cardiovascular: { label: 'Cardiovascular',         icon: '❤️', desc: 'Heart health tracking through vocal tremor and fatigue analysis' },
  neurological:   { label: 'Neurological Disorders', icon: '🧠', desc: 'Neural assessment via speech clarity and articulation patterns' },
  'post-stroke':  { label: 'Post-Stroke',            icon: '⚡', desc: 'Recovery tracking through voice strength and fluency metrics' },
  parkinsons:     { label: "Parkinson's Disease",    icon: '🔬', desc: 'Tremor progression via micro-tremor and voice stability analysis' },
  depression:     { label: 'Depression',             icon: '🌊', desc: 'Mood tracking via tonal variation and speech pace patterns' },
};

const FEATURES = [
  { icon: '∴', label: 'Vocal Biomarkers' },
  { icon: '∴', label: 'Proprietary AI Engine' },
  { icon: '∴', label: 'Continuous Analysis' },
  { icon: '∴', label: 'Non-Invasive Tracking' },
];

/* ——— Motion variants ——— */
const textMask = {
  hidden: { y: '110%', opacity: 0 },
  visible: (i) => ({
    y: '0%',
    opacity: 1,
    transition: { duration: 0.8, ease: [0.25, 0.46, 0.45, 0.94], delay: i * 0.15 },
  }),
};

const fadeUp = {
  hidden: { opacity: 0, y: 30 },
  visible: (i) => ({
    opacity: 1,
    y: 0,
    transition: { duration: 0.6, ease: [0.25, 0.46, 0.45, 0.94], delay: i * 0.1 },
  }),
};

const scaleIn = {
  hidden: { opacity: 0, scale: 0.92 },
  visible: {
    opacity: 1,
    scale: 1,
    transition: { duration: 0.7, ease: [0.25, 0.46, 0.45, 0.94] },
  },
};

const slideRight = {
  hidden: { opacity: 0, x: 60 },
  visible: {
    opacity: 1,
    x: 0,
    transition: { duration: 0.6, ease: [0.25, 0.46, 0.45, 0.94], delay: 0.3 },
  },
};

const cardSlide = {
  hidden: { opacity: 0, x: 30, scale: 0.95 },
  visible: (i) => ({
    opacity: 1,
    x: 0,
    scale: 1,
    transition: { duration: 0.45, ease: [0.25, 0.46, 0.45, 0.94], delay: 0.15 + i * 0.07 },
  }),
};

export default function HomePage() {
  const router = useRouter();
  const [activeCondition, setActiveCondition] = useState(null);
  const [entered, setEntered] = useState(false);
  const [isIntro, setIsIntro] = useState(true);
  const [soundOn, setSoundOn] = useState(false);
  const [gender, setGender] = useState('female');

  // Audio refs
  const audioCtxRef = useRef(null);
  const gainNodeRef = useRef(null);

  // Initialize and handle soothing ambient generative audio
  useEffect(() => {
    if (soundOn) {
      if (!audioCtxRef.current) {
        const AudioContext = window.AudioContext || window.webkitAudioContext;
        const ctx = new AudioContext();
        audioCtxRef.current = ctx;

        // Master Gain (controls volume fading)
        const masterGain = ctx.createGain();
        masterGain.gain.value = 0; 
        masterGain.connect(ctx.destination);
        gainNodeRef.current = masterGain;

        // Osc 1: Deep Base (108 Hz - A2)
        const osc1 = ctx.createOscillator();
        osc1.type = 'sine';
        osc1.frequency.value = 108;
        const osc1Gain = ctx.createGain();
        osc1Gain.gain.value = 0.6;
        osc1.connect(osc1Gain);
        osc1Gain.connect(masterGain);
        osc1.start();
        
        // Osc 2: Mid Harmonic (216 Hz - A3)
        const osc2 = ctx.createOscillator();
        osc2.type = 'sine';
        osc2.frequency.value = 216;
        const osc2Gain = ctx.createGain();
        osc2Gain.gain.value = 0.4;
        osc2.connect(osc2Gain);
        osc2Gain.connect(masterGain);
        osc2.start();

        // Osc 3: Gentle shimmery overtone (432 Hz - A4)
        const osc3 = ctx.createOscillator();
        osc3.type = 'triangle';
        osc3.frequency.value = 432;
        const osc3Gain = ctx.createGain();
        osc3Gain.gain.value = 0.15;
        osc3.connect(osc3Gain);
        osc3Gain.connect(masterGain);
        osc3.start();

        // LFO for slow ambient pulsing volume (breathes every ~15 seconds)
        const lfo = ctx.createOscillator();
        lfo.type = 'sine';
        lfo.frequency.value = 0.06;
        const lfoGain = ctx.createGain();
        lfoGain.gain.value = 0.15;
        lfo.connect(lfoGain);
        lfoGain.connect(masterGain.gain);
        lfo.start();
      }

      const ctx = audioCtxRef.current;
      if (ctx.state === 'suspended') ctx.resume();
      
      // Smooth fade in
      gainNodeRef.current.gain.cancelScheduledValues(ctx.currentTime);
      gainNodeRef.current.gain.setTargetAtTime(0.3, ctx.currentTime, 2);
    } else {
      if (audioCtxRef.current && gainNodeRef.current) {
        const ctx = audioCtxRef.current;
        // Smooth fade out
        gainNodeRef.current.gain.cancelScheduledValues(ctx.currentTime);
        gainNodeRef.current.gain.setTargetAtTime(0, ctx.currentTime, 0.5);
      }
    }
  }, [soundOn]);

  // Cleanup audio on unmount
  useEffect(() => {
    return () => {
      if (audioCtxRef.current && audioCtxRef.current.state !== 'closed') {
        audioCtxRef.current.close().catch(() => {});
      }
    };
  }, []);

  useEffect(() => {
    // 2.5s intro sequence
    const timer = setTimeout(() => setIsIntro(false), 2500);
    return () => clearTimeout(timer);
  }, []);

  const conditionKeys = Object.keys(CONDITIONS);
  const activeIndex = activeCondition ? conditionKeys.indexOf(activeCondition) : -1;

  const handleNext = () => {
    if (activeIndex === -1) return setActiveCondition(conditionKeys[0]);
    setActiveCondition(conditionKeys[(activeIndex + 1) % conditionKeys.length]);
  };

  const handlePrev = () => {
    if (activeIndex === -1) return setActiveCondition(conditionKeys[conditionKeys.length - 1]);
    setActiveCondition(conditionKeys[(activeIndex - 1 + conditionKeys.length) % conditionKeys.length]);
  };

  const handleCategoryClick = (id) => {
    setActiveCondition(id === activeCondition ? null : id);
  };

  return (
    <main className={styles.page}>
      {/* Intro Sequence (0:00 - 0:02) */}
      <AnimatePresence>
        {isIntro && (
          <motion.div
            className={styles.introState}
            exit={{ opacity: 0, scale: 1.1 }}
            transition={{ duration: 0.8, ease: 'easeInOut' }}
          >
            <div className={styles.introPulseCore} />
            <div className={styles.introRing1} />
            <div className={styles.introRing2} />
          </motion.div>
        )}
      </AnimatePresence>

      {/* Dynamic mesh gradient background */}
      <AnimatedBackground activeCondition={entered ? activeCondition : null} />

      {/* Base gradient layer */}
      <div className={styles.baseGradient} />

      {/* GLOBAL 3D CANVAS — Never unmounts */}
      {!isIntro && (
        <motion.div
          className={styles.globalModel}
          initial={{ opacity: 0, filter: 'blur(10px)' }}
          animate={{ opacity: 1, filter: 'blur(0px)' }}
          transition={{ duration: 1.5 }}
        >
          <HumanBody3D 
            activeCondition={activeCondition} 
            onHotspotClick={handleCategoryClick} 
            gender={gender} 
            isExplore={entered}
          />
        </motion.div>
      )}

      {/* Persistent Top Nav / Gender Toggle */}
      {!isIntro && (
        <motion.div
          className={styles.persistentTop}
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.1 }}
        >
          <div className={styles.genderToggle}>
            <span className={gender === 'female' ? styles.genderActive : styles.genderInactive} onClick={() => setGender('female')}>FEMALE ♀</span>
            <span className={gender === 'male' ? styles.genderActive : styles.genderInactive} onClick={() => setGender('male')}>MALE ♂</span>
          </div>
        </motion.div>
      )}

      <AnimatePresence mode="wait">
        {/* ===== HERO STATE ===== */}
        {!entered && !isIntro && (
          <motion.div
            key="hero"
            className={styles.heroState}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0, scale: 1.04, filter: 'blur(8px)' }}
            transition={{ duration: 0.6 }}
          >
            {/* Logo */}
            <motion.div
              className={styles.topBar}
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.2 }}
            >
              <div className={styles.logo}>
                <svg width="32" height="32" viewBox="0 0 32 32" fill="none" className={styles.logoSvg}>
                  <circle cx="16" cy="16" r="14" stroke="currentColor" strokeWidth="1.5" />
                  <path d="M10 20 C12 12, 14 22, 16 16 C18 10, 20 20, 22 14" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" fill="none" />
                </svg>
                <span className={styles.logoName}>Swaas<strong>Care</strong></span>
              </div>
            </motion.div>

            {/* Headline — masked reveal */}
            <div className={styles.heroLeft}>
              <div className={styles.headlineWrapper}>
                <div className={styles.headlineLine}>
                  <motion.span
                    className={styles.headlineWord}
                    variants={textMask}
                    initial="hidden"
                    animate="visible"
                    custom={0}
                  >
                    Personalized
                  </motion.span>
                </div>
                <div className={styles.headlineLine}>
                  <motion.span
                    className={styles.headlineWord}
                    variants={textMask}
                    initial="hidden"
                    animate="visible"
                    custom={1}
                  >
                    Wellness
                  </motion.span>
                </div>
              </div>
              <motion.p
                className={styles.heroSubtitle}
                variants={fadeUp}
                initial="hidden"
                animate="visible"
                custom={3}
              >
              </motion.p>
            </div>

            {/* Feature pills — staggered */}
            <div className={styles.heroRight}>
              {FEATURES.map((f, i) => (
                <motion.div
                  key={f.label}
                  className={styles.featurePill}
                  variants={fadeUp}
                  initial="hidden"
                  animate="visible"
                  custom={i + 2}
                >
                  <span className={styles.featureIcon}>{f.icon}</span>
                  <span className={styles.featureLabel}>{f.label}</span>
                </motion.div>
              ))}
            </div>

            {/* Removed internal heroModel to prevent canvas remounting */}

            {/* Start button */}
            <motion.button
              className={styles.startBtn}
              variants={fadeUp}
              initial="hidden"
              animate="visible"
              custom={5}
              onClick={() => setEntered(true)}
              whileHover={{ scale: 1.04, y: -3 }}
              whileTap={{ scale: 0.97 }}
            >
              Start Experience
            </motion.button>

            {/* Sound toggle */}
            <motion.button
              className={styles.soundToggle}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 1.2 }}
              onClick={() => setSoundOn(!soundOn)}
            >
              <span className={styles.soundBars}>
                {[...Array(4)].map((_, i) => (
                  <span
                    key={i}
                    className={`${styles.soundBar} ${soundOn ? styles.soundBarActive : ''}`}
                    style={{ animationDelay: `${i * 0.12}s` }}
                  />
                ))}
              </span>
              <span className={styles.soundLabel}>SOUND {soundOn ? 'ON' : 'OFF'}</span>
            </motion.button>
          </motion.div>
        )}

        {/* ===== EXPLORE STATE ===== */}
        {entered && (
          <motion.div
            key="explore"
            className={styles.exploreState}
            initial={{ opacity: 0, scale: 0.97 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.6, ease: [0.25, 0.46, 0.45, 0.94] }}
          >
            {/* Top bar */}
            <motion.div
              className={styles.exploreTop}
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.2 }}
            >
              <motion.button
                className={styles.backBtn}
                onClick={() => setEntered(false)}
                whileHover={{ scale: 1.08 }}
                whileTap={{ scale: 0.95 }}
              >
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M19 12H5M12 19l-7-7 7-7" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </motion.button>

              <span className={styles.exploreLogo}>Swaas<strong>Care</strong></span>
            </motion.div>

            {/* Removed internal exploreModel to prevent canvas remounting */}

            {/* Category panel — glass sidebar */}
            <motion.div
              className={styles.categoryPanel}
              variants={slideRight}
              initial="hidden"
              animate="visible"
            >
              <p className={styles.categoryTitle}>EXPLORE CONDITIONS</p>

              {Object.entries(CONDITIONS).map(([id, cond], i) => (
                <motion.button
                  key={id}
                  className={`${styles.categoryCard} ${activeCondition === id ? styles.categoryActive : ''}`}
                  variants={cardSlide}
                  initial="hidden"
                  animate="visible"
                  custom={i}
                  onClick={() => handleCategoryClick(id)}
                  whileHover={{ x: -5, scale: 1.01 }}
                  whileTap={{ scale: 0.98 }}
                  layout
                >
                  <span className={styles.categoryIcon}>{cond.icon}</span>
                  <span className={styles.categoryLabel}>{cond.label}</span>
                  <svg className={styles.categoryChevron} width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M9 18l6-6-6-6" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>

                  {/* Animated active indicator — slides to active card */}
                  {activeCondition === id && (
                    <motion.div
                      className={styles.activeIndicator}
                      layoutId="activeIndicator"
                      transition={{ type: 'spring', stiffness: 350, damping: 30 }}
                    />
                  )}
                </motion.button>
              ))}

              <motion.button
                className={styles.exploreCta}
                whileHover={{ scale: 1.03, y: -2 }}
                whileTap={{ scale: 0.97 }}
                onClick={() => router.push('/dashboard')}
              >
                Go to Dashboard →
              </motion.button>
            </motion.div>

            {/* Condition detail overlay */}
            <AnimatePresence>
              {activeCondition && CONDITIONS[activeCondition] && (
                <motion.div
                  className={styles.conditionDetail}
                  initial={{ opacity: 0, y: 20, scale: 0.95 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: 10, scale: 0.97 }}
                  transition={{ duration: 0.35, ease: [0.25, 0.46, 0.45, 0.94] }}
                  key={activeCondition}
                >
                  <span className={styles.detailIcon}>{CONDITIONS[activeCondition].icon}</span>
                  <h3 className={styles.detailTitle}>{CONDITIONS[activeCondition].label}</h3>
                  <p className={styles.detailDesc}>{CONDITIONS[activeCondition].desc}</p>
                  
                  {/* Linear Tour Navigation */}
                  <div className={styles.tourNav}>
                    <button className={styles.tourBtn} onClick={handlePrev}>← Prev</button>
                    <div className={styles.tourIndicators}>
                      {conditionKeys.map((k, i) => (
                        <span key={k} className={`${styles.tourDot} ${i === activeIndex ? styles.tourDotActive : ''}`} />
                      ))}
                    </div>
                    <button className={styles.tourBtn} onClick={handleNext}>Next →</button>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Sound toggle */}
            <button
              className={styles.soundToggle}
              onClick={() => setSoundOn(!soundOn)}
              style={{ opacity: 1 }}
            >
              <span className={styles.soundBars}>
                {[...Array(4)].map((_, i) => (
                  <span
                    key={i}
                    className={`${styles.soundBar} ${soundOn ? styles.soundBarActive : ''}`}
                    style={{ animationDelay: `${i * 0.12}s` }}
                  />
                ))}
              </span>
              <span className={styles.soundLabel}>SOUND {soundOn ? 'ON' : 'OFF'}</span>
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </main>
  );
}
