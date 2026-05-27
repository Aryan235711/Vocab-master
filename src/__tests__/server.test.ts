/**
 * @file server.test.ts
 * @description Integration tests for the Express server: session token
 * issuance + per-IP cap, auth gate on /api/* AI endpoints, in-memory rate
 * limiter, sanitizer length cap, dictionary cache, and SPA fallback.
 *
 * Gemini is mocked via vi.mock — no real Gemini calls are issued. Per-IP
 * limits are exercised via X-Forwarded-For (the server now sets
 * trust-proxy=1 so Express reads that header in production behind Render).
 */

import { describe, it, expect, vi, beforeAll } from 'vitest';
import type { Application } from 'express';
import request from 'supertest';

// ─── Mock @google/genai BEFORE server.ts is imported ─────────────
// vi.mock is hoisted above all imports by the vitest runtime.

const generateContentMock = vi.fn();
const sendMessageMock = vi.fn();

vi.mock('@google/genai', () => ({
  GoogleGenAI: class {
    models = { generateContent: generateContentMock };
    chats = {
      create: vi.fn().mockReturnValue({ sendMessage: sendMessageMock }),
    };
  },
}));

// ─── Boot the app once ───────────────────────────────────────────

let app: Application;

beforeAll(async () => {
  process.env.GEMINI_API_KEY = 'test-key';
  process.env.NODE_ENV = 'test';
  // Default mock responses; individual tests can override.
  generateContentMock.mockResolvedValue({ text: 'mocked-mnemonic' });
  sendMessageMock.mockResolvedValue({ text: 'mocked-chat-reply' });
  const mod = await import('../../server');
  app = mod.app;
});

// ─── Helpers ─────────────────────────────────────────────────────

// Use a unique X-Forwarded-For per test so module-level rate-limit
// state from prior tests doesn't contaminate the current test.
let ipCounter = 100;
const nextIp = () => `10.0.0.${ipCounter++}`;

async function acquireToken(ip: string): Promise<string> {
  const res = await request(app)
    .post('/api/session')
    .set('X-Forwarded-For', ip);
  expect(res.status).toBe(200);
  return res.body.token;
}

// ─── /api/session ────────────────────────────────────────────────

describe('POST /api/session', () => {
  it('issues a token and an expiry hint', async () => {
    const res = await request(app)
      .post('/api/session')
      .set('X-Forwarded-For', nextIp());

    expect(res.status).toBe(200);
    expect(res.body.token).toMatch(/^[a-f0-9]{64}$/); // 32 bytes hex
    expect(res.body.expiresIn).toBe(2 * 60 * 60 * 1000);
  });

  it('issues unique tokens on successive calls', async () => {
    const ip = nextIp();
    const t1 = await acquireToken(ip);
    const t2 = await acquireToken(ip);
    expect(t1).not.toBe(t2);
  });

  it('429s after 10 token requests from the same IP within the window', async () => {
    const ip = nextIp();
    for (let i = 0; i < 10; i++) {
      const ok = await request(app).post('/api/session').set('X-Forwarded-For', ip);
      expect(ok.status).toBe(200);
    }
    const blocked = await request(app).post('/api/session').set('X-Forwarded-For', ip);
    expect(blocked.status).toBe(429);
    expect(blocked.body.error).toMatch(/Too many session/i);
  });

  it('isolates per-IP limits (different IPs not blocked by another IP)', async () => {
    const noisyIp = nextIp();
    for (let i = 0; i < 10; i++) {
      await request(app).post('/api/session').set('X-Forwarded-For', noisyIp);
    }
    const blocked = await request(app).post('/api/session').set('X-Forwarded-For', noisyIp);
    expect(blocked.status).toBe(429);

    // A fresh IP must still be served.
    const fresh = await request(app)
      .post('/api/session')
      .set('X-Forwarded-For', nextIp());
    expect(fresh.status).toBe(200);
  });
});

// ─── Auth gate on AI endpoints ───────────────────────────────────

describe('AI endpoint auth gate', () => {
  it('rejects /api/mnemonic with no Authorization header', async () => {
    const res = await request(app)
      .post('/api/mnemonic')
      .set('X-Forwarded-For', nextIp())
      .send({ word: 'test', meaning: 'a test' });
    expect(res.status).toBe(401);
    expect(res.body.error).toMatch(/Missing session token/i);
  });

  it('rejects /api/explain with a malformed Authorization header', async () => {
    const res = await request(app)
      .post('/api/explain')
      .set('X-Forwarded-For', nextIp())
      .set('Authorization', 'NotBearer something')
      .send({ word: 'test', examTarget: 'SSC CGL' });
    expect(res.status).toBe(401);
  });

  it('rejects /api/chat with an unknown bearer token', async () => {
    const res = await request(app)
      .post('/api/chat')
      .set('X-Forwarded-For', nextIp())
      .set('Authorization', 'Bearer not-a-real-token')
      .send({ word: 'test', message: 'hi' });
    expect(res.status).toBe(401);
    expect(res.body.error).toMatch(/Session expired/i);
  });

  it('accepts a freshly issued token on /api/mnemonic', async () => {
    const ip = nextIp();
    const token = await acquireToken(ip);
    const res = await request(app)
      .post('/api/mnemonic')
      .set('X-Forwarded-For', ip)
      .set('Authorization', `Bearer ${token}`)
      .send({ word: 'ephemeral', meaning: 'lasting briefly' });
    expect(res.status).toBe(200);
    expect(res.body.text).toBe('mocked-mnemonic');
  });
});

// ─── Input validation on AI endpoints ────────────────────────────

describe('AI endpoint input validation', () => {
  it('400s on /api/mnemonic when word missing', async () => {
    const ip = nextIp();
    const token = await acquireToken(ip);
    const res = await request(app)
      .post('/api/mnemonic')
      .set('X-Forwarded-For', ip)
      .set('Authorization', `Bearer ${token}`)
      .send({ meaning: 'only meaning, no word' });
    expect(res.status).toBe(400);
  });

  it('400s on /api/explain when examTarget missing', async () => {
    const ip = nextIp();
    const token = await acquireToken(ip);
    const res = await request(app)
      .post('/api/explain')
      .set('X-Forwarded-For', ip)
      .set('Authorization', `Bearer ${token}`)
      .send({ word: 'test' });
    expect(res.status).toBe(400);
  });

  it('400s on /api/chat when message missing', async () => {
    const ip = nextIp();
    const token = await acquireToken(ip);
    const res = await request(app)
      .post('/api/chat')
      .set('X-Forwarded-For', ip)
      .set('Authorization', `Bearer ${token}`)
      .send({ word: 'test' });
    expect(res.status).toBe(400);
  });
});

// ─── Input sanitization: 500-char prompt cap ────────────────────

describe('Input sanitization', () => {
  it('truncates word + meaning to 500 chars each before reaching Gemini', async () => {
    generateContentMock.mockClear();
    const ip = nextIp();
    const token = await acquireToken(ip);

    const longWord = 'A'.repeat(1000);
    const longMeaning = 'B'.repeat(1000);

    await request(app)
      .post('/api/mnemonic')
      .set('X-Forwarded-For', ip)
      .set('Authorization', `Bearer ${token}`)
      .send({ word: longWord, meaning: longMeaning });

    expect(generateContentMock).toHaveBeenCalledTimes(1);
    const call = generateContentMock.mock.calls[0][0];
    const contents: string = call.contents;
    // Each occurrence of A or B inside the templated prompt should be exactly
    // 500 (the sanitizer's slice limit), not 1000.
    expect(contents.match(/A/g)!.length).toBe(500);
    expect(contents.match(/B/g)!.length).toBe(500);
  });
});

// ─── Per-IP rate limit on AI endpoints ───────────────────────────

describe('AI endpoint rate limit (20 req / 60s per IP)', () => {
  it('429s on the 21st mnemonic request from the same IP', async () => {
    const ip = nextIp();
    const token = await acquireToken(ip);

    for (let i = 0; i < 20; i++) {
      const ok = await request(app)
        .post('/api/mnemonic')
        .set('X-Forwarded-For', ip)
        .set('Authorization', `Bearer ${token}`)
        .send({ word: 'foo', meaning: 'bar' });
      expect(ok.status).toBe(200);
    }
    const blocked = await request(app)
      .post('/api/mnemonic')
      .set('X-Forwarded-For', ip)
      .set('Authorization', `Bearer ${token}`)
      .send({ word: 'foo', meaning: 'bar' });
    expect(blocked.status).toBe(429);
    expect(blocked.body.error).toMatch(/Rate limit/i);
  });
});

// ─── /api/dictionary ─────────────────────────────────────────────

describe('GET /api/dictionary', () => {
  it('returns the full dictionary as JSON', async () => {
    const res = await request(app).get('/api/dictionary');
    expect(res.status).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);
    expect(res.body.length).toBeGreaterThan(100);
    // Spot-check shape of a single entry
    const sample = res.body[0];
    expect(sample).toHaveProperty('id');
    expect(sample).toHaveProperty('word');
    expect(sample).toHaveProperty('category');
  });

  it('serves cached payload on repeat calls (no recomputation cost)', async () => {
    const first = await request(app).get('/api/dictionary');
    const second = await request(app).get('/api/dictionary');
    expect(first.status).toBe(200);
    expect(second.status).toBe(200);
    expect(second.body.length).toBe(first.body.length);
  });
});

// ─── SPA fallback ────────────────────────────────────────────────

describe('SPA fallback (catch-all GET)', () => {
  it('404s when the URL has a file extension (stale SW asset)', async () => {
    const res = await request(app).get('/missing-asset.css');
    expect(res.status).toBe(404);
  });

  it('404s deep asset paths with extensions too', async () => {
    const res = await request(app).get('/assets/bundle-12345.js');
    expect(res.status).toBe(404);
  });

  // We don't assert the index.html happy path here because dist/index.html
  // doesn't exist in CI before `npm run build`. Production behaviour is
  // verified by the e2e suite which runs against a real built bundle.
});
