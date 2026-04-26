/**
 * @file server.ts
 * @description Express server: serves the built React frontend, proxies Gemini AI
 * calls with auth + rate limiting, and serves the dictionary API.
 */

import crypto from 'crypto';
import path from 'path';
import { fileURLToPath } from 'url';
import express from 'express';
import { GoogleGenAI } from '@google/genai';
import dotenv from 'dotenv';

dotenv.config();

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const app = express();
app.use(express.json());

// ─── Static Frontend (production) ────────────────────────────────
// Serve the Vite-built frontend from dist/. In dev, Vite handles this.
const distPath = path.join(__dirname, 'dist');
app.use(express.static(distPath));

const GEMINI_API_KEY = process.env.GEMINI_API_KEY;
if (!GEMINI_API_KEY) {
  console.error('GEMINI_API_KEY is not set. AI features will not work.');
}

const ai = GEMINI_API_KEY ? new GoogleGenAI({ apiKey: GEMINI_API_KEY }) : null;
const MODEL = 'gemini-3-flash-preview';

// ─── Session Token Auth ──────────────────────────────────────────
// The app requests a token on load. The server issues a short-lived token
// that must be sent with every AI request. This prevents external scripts
// from directly hitting /api/* to drain the Gemini quota.

const SESSION_TTL_MS = 2 * 60 * 60 * 1000; // 2 hours
const activeSessions = new Map<string, number>(); // token → expiresAt

// Clean expired sessions every 10 minutes
setInterval(() => {
  const now = Date.now();
  for (const [token, expiresAt] of activeSessions) {
    if (now > expiresAt) activeSessions.delete(token);
  }
}, 10 * 60 * 1000);

app.post('/api/session', (_req, res) => {
  const token = crypto.randomBytes(32).toString('hex');
  activeSessions.set(token, Date.now() + SESSION_TTL_MS);
  res.json({ token, expiresIn: SESSION_TTL_MS });
});

function requireAuth(req: express.Request, res: express.Response, next: express.NextFunction) {
  const authHeader = req.headers.authorization;
  if (!authHeader?.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Missing session token.' });
  }
  const token = authHeader.slice(7);
  const expiresAt = activeSessions.get(token);
  if (!expiresAt || Date.now() > expiresAt) {
    activeSessions.delete(token);
    return res.status(401).json({ error: 'Session expired. Refresh the page.' });
  }
  next();
}

// ─── Rate Limiter ────────────────────────────────────────────────

const rateLimitMap = new Map<string, { count: number; resetAt: number }>();
const RATE_LIMIT = 20;
const RATE_WINDOW_MS = 60_000;

function checkRateLimit(ip: string): boolean {
  const now = Date.now();
  const entry = rateLimitMap.get(ip);
  if (!entry || now > entry.resetAt) {
    rateLimitMap.set(ip, { count: 1, resetAt: now + RATE_WINDOW_MS });
    return true;
  }
  if (entry.count >= RATE_LIMIT) return false;
  entry.count++;
  return true;
}

setInterval(() => {
  const now = Date.now();
  for (const [ip, entry] of rateLimitMap) {
    if (now > entry.resetAt) rateLimitMap.delete(ip);
  }
}, RATE_WINDOW_MS);

// ─── Input Validation ────────────────────────────────────────────

const MAX_PROMPT_LENGTH = 500;

function sanitizeInput(text: string): string {
  return text.slice(0, MAX_PROMPT_LENGTH).trim();
}

// ─── AI Endpoints (auth + rate-limit protected) ──────────────────

app.post('/api/mnemonic', requireAuth, async (req, res) => {
  const clientIp = req.ip || 'unknown';
  if (!checkRateLimit(clientIp)) {
    return res.status(429).json({ error: 'Rate limit exceeded. Try again in a minute.' });
  }
  if (!ai) return res.status(503).json({ error: 'AI service unavailable.' });

  const { word, meaning } = req.body;
  if (!word || !meaning) return res.status(400).json({ error: 'word and meaning are required.' });

  try {
    const response = await ai.models.generateContent({
      model: MODEL,
      contents: `Generate a fun, memorable, and India-relatable mnemonic or memory hook for the English word "${sanitizeInput(word)}" meaning "${sanitizeInput(meaning)}". Keep it under 2 sentences. Use Hinglish if it helps.`,
    });
    res.json({ text: response.text?.trim() || 'No mnemonic generated.' });
  } catch (error) {
    console.error('Gemini API error (mnemonic):', error);
    res.status(500).json({ error: 'Could not generate mnemonic.' });
  }
});

app.post('/api/explain', requireAuth, async (req, res) => {
  const clientIp = req.ip || 'unknown';
  if (!checkRateLimit(clientIp)) {
    return res.status(429).json({ error: 'Rate limit exceeded. Try again in a minute.' });
  }
  if (!ai) return res.status(503).json({ error: 'AI service unavailable.' });

  const { word, examTarget } = req.body;
  if (!word || !examTarget) return res.status(400).json({ error: 'word and examTarget are required.' });

  try {
    const response = await ai.models.generateContent({
      model: MODEL,
      contents: `Explain why the word "${sanitizeInput(word)}" is important for the ${sanitizeInput(examTarget)} exam in India. Give a typical scenario or fill-in-the-blank question where it might appear. Keep it brief and encouraging.`,
    });
    res.json({ text: response.text?.trim() || 'Explanation not available.' });
  } catch (error) {
    console.error('Gemini API error (explain):', error);
    res.status(500).json({ error: 'Could not generate explanation.' });
  }
});

app.post('/api/chat', requireAuth, async (req, res) => {
  const clientIp = req.ip || 'unknown';
  if (!checkRateLimit(clientIp)) {
    return res.status(429).json({ error: 'Rate limit exceeded. Try again in a minute.' });
  }
  if (!ai) return res.status(503).json({ error: 'AI service unavailable.' });

  const { word, message, history } = req.body;
  if (!word || !message) return res.status(400).json({ error: 'word and message are required.' });

  try {
    const chat = ai.chats.create({
      model: MODEL,
      config: {
        systemInstruction: `You are a supportive AI tutor helping a student prepare for government exams in India. They are asking about the word "${sanitizeInput(word)}". Answer clearly, concisely, and supportively. You may use English and simple Hindi.`,
      },
      history: Array.isArray(history) ? history.slice(-10) : [],
    });

    const response = await chat.sendMessage({ message: sanitizeInput(message) });
    res.json({ text: response.text || 'Could not generate answer.' });
  } catch (error) {
    console.error('Gemini API error (chat):', error);
    res.status(500).json({ error: 'Could not generate answer.' });
  }
});

// ─── Dictionary Endpoint ─────────────────────────────────────────
// Serves the full dictionary as JSON. The client fetches this once on load
// instead of bundling 762KB of TypeScript data into the JS bundle.

let dictionaryCache: unknown[] | null = null;

app.get('/api/dictionary', async (_req, res) => {
  if (dictionaryCache) {
    return res.json(dictionaryCache);
  }

  try {
    const { DICTIONARY } = await import('./src/data/dictionary/index.js');
    dictionaryCache = DICTIONARY;
    res.json(DICTIONARY);
  } catch (error) {
    console.error('Failed to load dictionary:', error);
    res.status(500).json({ error: 'Dictionary unavailable.' });
  }
});

// ─── SPA Fallback ────────────────────────────────────────────────
// Any non-API GET that didn't match a static file → serve index.html
// so React Router handles client-side routes (/learn, /practice, etc.)
// Skip requests with file extensions — those are genuinely missing assets
// (e.g. stale SW requesting /index.css) and should 404, not get HTML.
app.get('/{*splat}', (req, res) => {
  if (/\.\w+$/.test(req.path)) {
    return res.status(404).end();
  }
  res.sendFile(path.join(distPath, 'index.html'));
});

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
  console.log(`VocabDost server running on port ${PORT}`);
});
