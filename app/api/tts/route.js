import { NextResponse } from 'next/server';

export async function POST(req) {
  try {
    const { text } = await req.json();

    // Voice ID: "Sarah" (Mature, Reassuring, Confident, Professional)
    const VOICE_ID = 'EXAVITQu4vr4xnSDxMaL';
    const url = `https://api.elevenlabs.io/v1/text-to-speech/${VOICE_ID}?output_format=mp3_44100_128`;

    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Accept': 'audio/mpeg',
        'xi-api-key': process.env.ELEVENLABS_API_KEY,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        text,
        model_id: 'eleven_multilingual_v2',
        voice_settings: {
          stability: 0.5,
          similarity_boost: 0.75,
        }
      })
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('ElevenLabs Error:', errorText);
      return NextResponse.json({ error: 'Falha na geração de áudio' }, { status: response.status });
    }

    const audioBuffer = await response.arrayBuffer();

    return new NextResponse(audioBuffer, {
      headers: {
        'Content-Type': 'audio/mpeg',
        'Cache-Control': 'no-store, max-age=0',
      },
    });
  } catch (error) {
    console.error('TTS Route Error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
