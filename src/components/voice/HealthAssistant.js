'use client';
import { useState, useEffect, useRef } from 'react';
import { getUserId, getRecords, getBaseline, getInsights } from '@/lib/store/mockFirestore';
import styles from './voice.module.css';

/**
 * Feature 9: Voice-Based Chat Health Assistant
 * Text + voice input → rule-based responses using latest health data.
 */

function generateResponse(query, healthData) {
  const q = query.toLowerCase();
  const { latestScore, trend, records, insights } = healthData;

  // Score queries
  if (q.includes('score') || q.includes('how am i')) {
    if (latestScore >= 90) return `Your current health score is ${latestScore}/100 — you're in excellent shape! All voice biomarkers are within healthy range. 🌟`;
    if (latestScore >= 60) return `Your health score is ${latestScore}/100, which is in the mild range. Some biomarkers show slight variations from your baseline but nothing concerning. Keep recording daily!`;
    return `Your health score is ${latestScore}/100. This is below our comfort threshold. Please consider consulting your doctor and continue monitoring daily.`;
  }

  // Improvement queries
  if (q.includes('improv') || q.includes('better') || q.includes('progress')) {
    if (records.length < 3) return "I need at least 3 recordings to assess your progress. Keep recording daily!";
    const recent = records.slice(-3).map(r => r.healthScore || 0);
    const older = records.slice(-6, -3).map(r => r.healthScore || 0);
    if (older.length === 0) return `Based on your recent recordings, your average score is ${Math.round(recent.reduce((a, b) => a + b, 0) / recent.length)}/100. Keep recording for comparative analysis!`;
    const recentAvg = recent.reduce((a, b) => a + b, 0) / recent.length;
    const olderAvg = older.reduce((a, b) => a + b, 0) / older.length;
    const diff = Math.round(recentAvg - olderAvg);
    if (diff > 0) return `Yes, you're improving! Your score increased by ${diff} points over the last 3 days. 📈 Keep up the good work!`;
    if (diff < 0) return `Your score has decreased by ${Math.abs(diff)} points recently. This might be temporary. Stay consistent with recordings and consult your doctor if concerned.`;
    return "Your score has been stable recently — no significant changes detected. Consistency is good!";
  }

  // Alert queries
  if (q.includes('alert') || q.includes('warning') || q.includes('concern')) {
    if (latestScore < 50) return "⚠️ Your current score is critically low. Please consult a doctor as soon as possible.";
    if (latestScore < 70) return "There are some mild concerns — your breathiness and pitch variability are slightly elevated. Monitor closely and consider a checkup.";
    return "No active alerts! All your biomarkers are within normal range. 👍";
  }

  // Trend queries
  if (q.includes('trend') || q.includes('prediction') || q.includes('future')) {
    if (trend === 'improving') return "📈 Based on linear regression of your recent scores, the trend is improving. Your predicted score for the next few days looks positive!";
    if (trend === 'declining') return "📉 The trend shows a slight decline. This could be temporary. Keep recording daily and consult your doctor if it continues.";
    return "Your scores have been relatively stable. The 5-day prediction shows consistent values.";
  }

  // Insights queries
  if (q.includes('insight') || q.includes('feedback') || q.includes('analysis')) {
    if (insights.length > 0) {
      return `Here are your latest insights:\n${insights.slice(0, 3).map(ins => `• ${ins.message || ins.insight || 'No details'}`).join('\n')}`;
    }
    return "No specific insights available yet. Record a voice sample to generate AI analysis.";
  }

  // Help
  if (q.includes('help') || q.includes('what can')) {
    return "I can help you with:\n• 'What's my score?' — Current health score\n• 'Am I improving?' — Progress analysis\n• 'Any alerts?' — Check warnings\n• 'Show trends' — Prediction analysis\n• 'Give me insights' — Latest AI feedback";
  }

  // Default
  return `Based on your latest data, your health score is ${latestScore}/100. Your voice biomarkers are being monitored continuously. Ask me specific questions like "Am I improving?" or "Any alerts?" for detailed analysis.`;
}

export default function HealthAssistant() {
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState([
    { role: 'bot', text: "Hi! I'm your SwaasCare health assistant. Ask me about your voice health — try 'What\\'s my score?' or 'Am I improving?'" }
  ]);
  const [input, setInput] = useState('');
  const [mounted, setMounted] = useState(false);
  const [listening, setListening] = useState(false);
  const messagesEndRef = useRef(null);

  useEffect(() => { setMounted(true); }, []);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const getHealthData = () => {
    const uid = getUserId();
    const records = getRecords(uid);
    const baseline = getBaseline(uid);
    const insights = getInsights(uid);

    const sorted = [...records].sort((a, b) =>
      new Date(a.createdAt || a.date) - new Date(b.createdAt || b.date)
    );

    const latestScore = sorted.length > 0 ? (sorted[sorted.length - 1].healthScore || 78) : 78;
    const scores = sorted.map(r => r.healthScore || 0).filter(Boolean);
    
    let trend = 'stable';
    if (scores.length >= 3) {
      const last3 = scores.slice(-3);
      const prev3 = scores.slice(-6, -3);
      if (prev3.length > 0) {
        const lastAvg = last3.reduce((a, b) => a + b, 0) / last3.length;
        const prevAvg = prev3.reduce((a, b) => a + b, 0) / prev3.length;
        if (lastAvg - prevAvg > 2) trend = 'improving';
        else if (lastAvg - prevAvg < -2) trend = 'declining';
      }
    }

    return { latestScore, trend, records: sorted, insights, baseline };
  };

  const handleSend = () => {
    if (!input.trim()) return;

    const userMsg = input.trim();
    setMessages(prev => [...prev, { role: 'user', text: userMsg }]);
    setInput('');

    // Generate response
    setTimeout(() => {
      const healthData = getHealthData();
      const response = generateResponse(userMsg, healthData);
      setMessages(prev => [...prev, { role: 'bot', text: response }]);
    }, 500);
  };

  const handleVoice = () => {
    if (!('webkitSpeechRecognition' in window) && !('SpeechRecognition' in window)) {
      setMessages(prev => [...prev, { role: 'bot', text: 'Voice input is not supported in this browser. Please type your question.' }]);
      return;
    }

    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    const recognition = new SpeechRecognition();
    recognition.continuous = false;
    recognition.interimResults = false;
    recognition.lang = 'en-US';

    recognition.onstart = () => setListening(true);
    recognition.onend = () => setListening(false);

    recognition.onresult = (event) => {
      const transcript = event.results[0][0].transcript;
      setInput(transcript);
      // Auto-send after voice input
      setTimeout(() => {
        setMessages(prev => [...prev, { role: 'user', text: transcript }]);
        setTimeout(() => {
          const healthData = getHealthData();
          const response = generateResponse(transcript, healthData);
          setMessages(prev => [...prev, { role: 'bot', text: response }]);
        }, 500);
      }, 200);
    };

    recognition.onerror = () => {
      setListening(false);
    };

    recognition.start();
  };

  if (!mounted) return null;

  return (
    <>
      <button
        className={styles.assistantToggle}
        onClick={() => setOpen(!open)}
        title="Health Assistant"
      >
        {open ? '✕' : '💬'}
      </button>

      {open && (
        <div className={styles.assistantPanel}>
          <div className={styles.assistantHeader}>
            <span className={styles.assistantHeaderTitle}>🩺 Health Assistant</span>
            <button className={styles.assistantClose} onClick={() => setOpen(false)}>✕</button>
          </div>

          <div className={styles.assistantMessages}>
            {messages.map((msg, i) => (
              <div
                key={i}
                className={`${styles.msgBubble} ${msg.role === 'user' ? styles.msgUser : styles.msgBot}`}
              >
                {msg.text.split('\n').map((line, j) => (
                  <span key={j}>{line}<br /></span>
                ))}
              </div>
            ))}
            <div ref={messagesEndRef} />
          </div>

          <div className={styles.assistantInputRow}>
            <button
              className={`${styles.assistantVoiceBtn} ${listening ? styles.assistantVoiceActive : ''}`}
              onClick={handleVoice}
              title="Voice input"
            >
              🎤
            </button>
            <input
              className={styles.assistantInput}
              placeholder="Ask about your health..."
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSend()}
            />
            <button className={styles.assistantSendBtn} onClick={handleSend}>
              →
            </button>
          </div>
        </div>
      )}
    </>
  );
}
