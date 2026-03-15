// Vercel Serverless Function — TTS proxy
// ブラウザ→Vercel(同一ドメイン)→NAS の経路で
// Chrome Private Network Access ブロックを回避する
//
// NOTE: global fetch (undici) は TLS renegotiation 非対応で "fetch failed" になるため
//       Node.js 標準の https モジュール (OpenSSL) を使用する

const https = require('https');

module.exports = async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const authHeader = req.headers['authorization'];
  if (!authHeader) {
    return res.status(401).json({ error: 'Authorization header required' });
  }

  try {
    const body = JSON.stringify(req.body);

    const { statusCode, data } = await new Promise((resolve, reject) => {
      const request = https.request(
        {
          hostname: 'posimai-lab.tail72e846.ts.net',
          path: '/brain/api/tts',
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Content-Length': Buffer.byteLength(body),
            'Authorization': authHeader,
          },
        },
        (response) => {
          const chunks = [];
          response.on('data', (chunk) => chunks.push(chunk));
          response.on('end', () =>
            resolve({ statusCode: response.statusCode, data: Buffer.concat(chunks) })
          );
        }
      );
      request.on('error', reject);
      request.write(body);
      request.end();
    });

    if (statusCode !== 200) {
      return res
        .status(statusCode)
        .json({ error: 'TTS_UNAVAILABLE', detail: data.toString() });
    }

    res.setHeader('Content-Type', 'audio/wav');
    res.setHeader('Cache-Control', 'no-store');
    res.send(data);
  } catch (e) {
    res.status(503).json({ error: 'TTS_UNAVAILABLE', detail: e.message });
  }
};
