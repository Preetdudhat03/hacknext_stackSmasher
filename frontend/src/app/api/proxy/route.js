import { NextResponse } from 'next/server';

export async function POST(request) {
  try {
    const { audio_url } = await request.json();
    
    if (!audio_url) {
      return NextResponse.json({ error: 'Missing audio_url' }, { status: 400 });
    }

    console.log(`[PROXY] Redirecting request to Python backend: ${audio_url}`);

    const formData = new FormData();
    formData.append('audio_url', audio_url);

    const response = await fetch('http://127.0.0.1:8080/api/analyze', {
      method: 'POST',
      body: formData,
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error(`[PROXY] Backend error: ${response.status} - ${errorText}`);
      return NextResponse.json({ error: 'Backend analysis failed', details: errorText }, { status: response.status });
    }

    const data = await response.json();
    console.log(`[PROXY] Analysis successful for: ${audio_url}`);
    
    return NextResponse.json(data);
  } catch (error) {
    console.error('[PROXY] Internal Proxy Error:', error);
    return NextResponse.json({ error: 'Internal server error in API bridge', details: error.message }, { status: 500 });
  }
}
