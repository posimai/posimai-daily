// Vercel Serverless Function — TTS proxy
// ブラウザ→Vercel(同一ドメイン)→NAS の経路で
// Chrome Private Network Access ブロックを回避する

const NAS_TTS = 'https://posimai-lab.tail72e846.ts.net/brain/api/tts';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const authHeader = req.headers['authorization'];
  if (!authHeader) {
    return res.status(401).json({ error: 'Authorization header required' });
  }

  try {
    const nasRes = await fetch(NAS_TTS, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': authHeader,
      },
      body: JSON.stringify(req.body),
    });

    if (!nasRes.ok) {
      const text = await nasRes.text();
      return res.status(nasRes.status).json({ error: 'TTS_UNAVAILABLE', detail: text });
    }

    const audioBuffer = await nasRes.arrayBuffer();
    res.setHeader('Content-Type', 'audio/wav');
    res.setHeader('Cache-Control', 'no-store');
    res.send(Buffer.from(audioBuffer));
  } catch (e) {
    res.status(503).json({ error: 'TTS_UNAVAILABLE', detail: e.message });
  }
}
