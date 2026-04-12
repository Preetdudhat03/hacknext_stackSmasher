import { NextResponse } from 'next/server';

export async function POST(request) {
  try {
    const formData = await request.formData();
    const audioFile = formData.get('audio_file');
    const audioUrl = formData.get('audio_url');
    
    console.log(`[PROXY] Redirecting request. File: ${audioFile ? 'YES' : 'NO'}, URL: ${audioUrl || 'NONE'}`);

    const backendFormData = new FormData();
    if (audioFile) backendFormData.append('audio_file', audioFile);
    if (audioUrl) backendFormData.append('audio_url', audioUrl);

    const response = await fetch('http://127.0.0.1:8000/api/analyze', {
      method: 'POST',
      body: backendFormData,
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error(`[PROXY] Backend error: ${response.status} - ${errorText}`);
      return NextResponse.json({ error: 'Backend analysis failed', details: errorText }, { status: response.status });
    }

    const data = await response.json();
    console.log(`[PROXY] Analysis successful`);
    
    return NextResponse.json(data);
  } catch (error) {
    console.error('[PROXY] Internal Proxy Error:', error);
    return NextResponse.json({ error: 'Internal server error in API bridge', details: error.message }, { status: 500 });
  }
}
