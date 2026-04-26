/**
 * @file aiService.ts
 * @description Client-side AI service that calls the server proxy.
 * Acquires a session token on first use, sends it with every request.
 */

const API_BASE = '/api';

// ─── Session Token Management ────────────────────────────────────

let sessionToken: string | null = null;
let tokenPromise: Promise<string> | null = null;

async function getSessionToken(): Promise<string> {
  if (sessionToken) return sessionToken;

  // Deduplicate concurrent calls during token acquisition
  if (tokenPromise) return tokenPromise;

  tokenPromise = fetch(`${API_BASE}/session`, { method: 'POST' })
    .then(res => {
      if (!res.ok) throw new Error('Failed to acquire session token');
      return res.json();
    })
    .then(data => {
      sessionToken = data.token;
      // Auto-clear before expiry so a fresh one is fetched next time
      const refreshIn = Math.max((data.expiresIn || 7_200_000) - 60_000, 60_000);
      setTimeout(() => { sessionToken = null; tokenPromise = null; }, refreshIn);
      return data.token;
    })
    .catch(err => {
      tokenPromise = null;
      throw err;
    });

  return tokenPromise;
}

// ─── Core Transport ──────────────────────────────────────────────

const checkOffline = () => {
  if (typeof navigator !== 'undefined' && !navigator.onLine) {
    window.dispatchEvent(new CustomEvent('vocabdost:offline-ai'));
    throw new Error('OFFLINE');
  }
};

async function post(endpoint: string, body: Record<string, unknown>): Promise<string> {
  const token = await getSessionToken();

  const res = await fetch(`${API_BASE}${endpoint}`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`,
    },
    body: JSON.stringify(body),
  });

  if (res.status === 401) {
    // Token expired mid-session — clear and retry once
    sessionToken = null;
    tokenPromise = null;
    const freshToken = await getSessionToken();
    const retry = await fetch(`${API_BASE}${endpoint}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${freshToken}`,
      },
      body: JSON.stringify(body),
    });
    if (!retry.ok) throw new Error(`API error: ${retry.status}`);
    const data = await retry.json();
    return data.text || 'No response generated.';
  }

  if (res.status === 429) return 'Too many requests — please wait a moment and try again.';
  if (!res.ok) throw new Error(`API error: ${res.status}`);

  const data = await res.json();
  return data.text || 'No response generated.';
}

// ─── Public API ──────────────────────────────────────────────────

export const generateMnemonic = async (word: string, meaning: string): Promise<string> => {
  try {
    checkOffline();
    return await post('/mnemonic', { word, meaning });
  } catch (error) {
    if (error instanceof Error && error.message === 'OFFLINE') return 'Offline mode active.';
    console.error('AI Service Error:', error);
    return 'Could not generate mnemonic at this time.';
  }
};

export const explainInContext = async (word: string, examTarget: string): Promise<string> => {
  try {
    checkOffline();
    return await post('/explain', { word, examTarget });
  } catch (error) {
    if (error instanceof Error && error.message === 'OFFLINE') return 'Offline mode active.';
    console.error('AI Service Error:', error);
    return 'Could not generate explanation at this time.';
  }
};

export const createDoubtChat = (word: string) => {
  checkOffline();
  const history: { role: string; parts: { text: string }[] }[] = [];

  return {
    sendMessage: async ({ message }: { message: string }) => {
      history.push({ role: 'user', parts: [{ text: message }] });
      const text = await post('/chat', { word, message, history });
      history.push({ role: 'model', parts: [{ text }] });
      return { text };
    },
  };
};
