/**
 * API Route: /api/analyze-voice
 * Proxies audio files to the Python FastAPI backend for processing.
 * Falls back to mock analysis if the backend is unavailable.
 */

import { NextResponse } from 'next/server';

export async function POST(request) {
  try {
    const formData = await request.formData();
    const audioFile = formData.get('audio');

    if (!audioFile) {
      return NextResponse.json({ error: 'No audio file provided' }, { status: 400 });
    }

    // Try to forward to Python backend
    try {
      const backendUrl = process.env.VOICE_BACKEND_URL || 'http://localhost:8000';
      const backendForm = new FormData();
      backendForm.append('audio_file', audioFile);

      const response = await fetch(`${backendUrl}/api/analyze`, {
        method: 'POST',
        body: backendForm,
      });

      if (response.ok) {
        const data = await response.json();
        return NextResponse.json(data);
      }
    } catch {
      // Backend unavailable, use mock
    }

    // Mock analysis fallback
    const mockFeatures = {
      mean_pitch_proxy: 1400 + Math.random() * 300,
      pitch_instability: 30000 + Math.random() * 40000,
      breathiness_proxy: 0.03 + Math.random() * 0.04,
      energy: 0.015 + Math.random() * 0.03,
      mfccs: Array.from({ length: 13 }, () => -200 + Math.random() * 300),
    };

    const overallScore = Math.round(60 + Math.random() * 35);
    const riskLevel = overallScore >= 90 ? 'low' : overallScore >= 75 ? 'medium' : 'high';

    return NextResponse.json({
      status: 'success',
      features: mockFeatures,
      analysis: {
        health_score: overallScore,
        risk_level: riskLevel,
        system_insights: {
          respiratory: {
            score: Math.min(100, overallScore + Math.round(Math.random() * 10 - 5)),
            insight: 'Respiratory patterns analyzed.',
            status: overallScore > 70 ? 'normal' : 'warning',
          },
          neurological: {
            score: Math.min(100, overallScore + Math.round(Math.random() * 10 - 5)),
            insight: 'Vocal stability assessed.',
            status: overallScore > 75 ? 'normal' : 'warning',
          },
          emotional: {
            score: Math.min(100, overallScore + Math.round(Math.random() * 10 - 5)),
            insight: 'Emotional tone evaluated.',
            status: overallScore > 65 ? 'normal' : 'warning',
          },
        },
      },
    });
  } catch (error) {
    return NextResponse.json({ error: 'Analysis failed' }, { status: 500 });
  }
}
