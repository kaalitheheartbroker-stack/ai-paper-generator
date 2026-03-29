import admin from 'firebase-admin';

// Reusable app initialization
if (!admin.apps.length) {
  admin.initializeApp({
    projectId: 'preexamwale', // Default safe project ID for token verification
  });
}

export default async function handler(req: any, res: any) {
  // CORS handles preflight
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    // 1. Secure Authentication Verification
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ error: 'Unauthorized: Missing or invalid authorization token' });
    }
    
    const idToken = authHeader.split('Bearer ')[1];
    try {
      // Must enforce valid Firebase token
      await admin.auth().verifyIdToken(idToken);
    } catch (authErr) {
      console.error('Firebase Auth Verification Failed:', authErr);
      return res.status(403).json({ error: 'Forbidden: Invalid authentication token' });
    }

    // 2. Load API Keys (Supports multiple keys comma separated)
    const rawKeys = process.env.GEMINI_API_KEYS;
    const keyArray = rawKeys ? rawKeys.split(',').map(k => k.trim()).filter(k => k) : [];
    
    if (keyArray.length === 0) {
      console.error('CRITICAL: GEMINI_API_KEYS missing from environment variables.');
      return res.status(500).json({ error: 'Internal Server Configuration Error: Missing API Keys' });
    }

    const { action } = req.body;

    // 3. Process the proxy action
    if (action === 'listModels') {
      const listResponse = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models?key=${keyArray[0]}`
      );
      if (!listResponse.ok) {
        return res.status(listResponse.status).json(await listResponse.json());
      }
      return res.status(200).json(await listResponse.json());
    }

    if (action === 'generateContent') {
      const { prompt, modelName, apiVer } = req.body;
      if (!prompt) return res.status(400).json({ error: 'Prompt is required' });

      const m = modelName || 'gemini-1.5-flash';
      const v = apiVer || 'v1';
      
      let lastRawData: any = null;
      let lastStatus = 500;

      // Loop through all provided keys for Quota Failovers
      for (let i = 0; i < keyArray.length; i++) {
          const currentKey = keyArray[i];
          console.log(`[Backend Proxy] Attempting Generation using Key Index ${i + 1}/${keyArray.length}...`);
          
          try {
              const response = await fetch(
                `https://generativelanguage.googleapis.com/${v}/models/${m}:generateContent?key=${currentKey}`,
                {
                  method: 'POST',
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify({
                    contents: [{ role: 'user', parts: [{ text: prompt }] }]
                  })
                }
              );

              lastStatus = response.status;
              lastRawData = await response.json().catch(() => null);

              // 429 is Google Rate Limit/Quota Exceeded. 403 can also happen for quotas.
              if (response.status === 429 || response.status === 403) {
                  console.warn(`[Backend Proxy] Key ${i + 1} exhausted quota or rate limited. Status: ${response.status}. Retrying...`);
                  continue; // Try next key
              }

              // On a successful 200 (or hard failure like 400 Bad Request), break the loop and return it 
              console.log(`[Backend Proxy] Key ${i + 1} succeeded securely.`);
              return res.status(response.status).json(lastRawData || { error: { message: "Invalid JSON response from upstream" } });
              
          } catch (e: any) {
              console.error(`[Backend Proxy] Network error on Key ${i + 1}:`, e);
              lastStatus = 500;
              lastRawData = { error: { message: e.message } };
              // Network error, let loop retry current network glitch on the next key
          }
      }

      // If loop exhausted all keys
      console.error('[Backend Proxy] ALL API Keys exhausted or failed.');
      return res.status(lastStatus).json(lastRawData || { error: { message: "All fallback API keys failed or exhausted quota" } });
    }

    return res.status(400).json({ error: 'Invalid action provided' });

  } catch (error: any) {
    console.error('Vercel API route exception:', error);
    return res.status(500).json({ error: 'Internal Server Error', message: error.message });
  }
}
