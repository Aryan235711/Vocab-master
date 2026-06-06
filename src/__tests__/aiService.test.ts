// @vitest-environment jsdom
/**
 * @file aiService.test.ts
 * @description Focused integration tests for the client-side AI service.
 * Mocks fetch at the network boundary and exercises session-token caching,
 * 401-retry, 429 friendly-message, error fallback, and offline detection.
 *
 * This replaces the deleted autonomous-agent e2e suite. The autonomous
 * tester was too brittle (vision-based navigation kept missing buttons
 * inside its 12-step budget) for the cost it carried. We now cover:
 *   - server side: server.test.ts (auth, rate limit, sanitization, ...)
 *   - client side: this file
 * End-to-end Gemini integration is verified in production by real users.
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';

// Always import a fresh copy of the module so each test starts with a
// clean session-token cache. Top-level cache state would otherwise leak
// across tests (e.g. token from test 1 is reused by test 2).
async function freshAiService() {
  vi.resetModules();
  return await import('../services/aiService');
}

beforeEach(() => {
  vi.useRealTimers();
});

afterEach(() => {
  vi.restoreAllMocks();
});

// ─── Session token acquisition + caching ─────────────────────────

describe('session token acquisition', () => {
  it('POSTs /api/session once and reuses the token for subsequent calls', async () => {
    const fetchMock = vi.fn()
      .mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => ({ token: 'tok-xyz', expiresIn: 7_200_000 }),
      })
      .mockResolvedValue({
        ok: true,
        status: 200,
        json: async () => ({ text: 'mocked' }),
      });
    vi.stubGlobal('fetch', fetchMock);

    const { generateMnemonic } = await freshAiService();
    await generateMnemonic('aplomb', 'self-confidence');
    await generateMnemonic('zenith', 'high point');

    // 1 session fetch + 2 mnemonic fetches = 3 total
    expect(fetchMock).toHaveBeenCalledTimes(3);
    const sessionCalls = fetchMock.mock.calls.filter(([url]) => url === '/api/session');
    expect(sessionCalls.length).toBe(1);
  });

  it('deduplicates concurrent token requests', async () => {
    let resolveSession: (v: unknown) => void;
    const sessionPromise = new Promise(r => (resolveSession = r));

    const fetchMock = vi.fn().mockImplementation((url: string) => {
      if (url === '/api/session') return sessionPromise;
      return Promise.resolve({
        ok: true,
        status: 200,
        json: async () => ({ text: 'mocked' }),
      });
    });
    vi.stubGlobal('fetch', fetchMock);

    const { generateMnemonic } = await freshAiService();

    // Fire two concurrent calls before the session resolves.
    const p1 = generateMnemonic('a', 'b');
    const p2 = generateMnemonic('c', 'd');

    // Let the in-flight promise resolve.
    resolveSession!({
      ok: true,
      status: 200,
      json: async () => ({ token: 'shared-tok', expiresIn: 7_200_000 }),
    });

    await Promise.all([p1, p2]);

    // Exactly ONE /api/session call despite two concurrent requests.
    const sessionCalls = fetchMock.mock.calls.filter(([url]) => url === '/api/session');
    expect(sessionCalls.length).toBe(1);
  });
});

// ─── Bearer-token attachment ─────────────────────────────────────

describe('outbound requests', () => {
  it('sends Authorization: Bearer <token> on protected endpoints', async () => {
    const fetchMock = vi.fn()
      .mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => ({ token: 'tok-abc', expiresIn: 7_200_000 }),
      })
      .mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => ({ text: 'mnemonic' }),
      });
    vi.stubGlobal('fetch', fetchMock);

    const { generateMnemonic } = await freshAiService();
    await generateMnemonic('word', 'meaning');

    const mnemonicCall = fetchMock.mock.calls.find(([url]) => url === '/api/mnemonic')!;
    const headers = mnemonicCall[1].headers as Record<string, string>;
    expect(headers.Authorization).toBe('Bearer tok-abc');
    expect(headers['Content-Type']).toBe('application/json');
  });

  it('routes the right body to each endpoint', async () => {
    const fetchMock = vi.fn()
      .mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => ({ token: 'tok', expiresIn: 7_200_000 }),
      })
      .mockResolvedValue({
        ok: true,
        status: 200,
        json: async () => ({ text: 'response' }),
      });
    vi.stubGlobal('fetch', fetchMock);

    const { generateMnemonic, explainInContext } = await freshAiService();
    await generateMnemonic('ubiquitous', 'everywhere');
    await explainInContext('zenith', 'SSC CGL');

    const mnemonic = fetchMock.mock.calls.find(([url]) => url === '/api/mnemonic')!;
    expect(JSON.parse(mnemonic[1].body as string)).toEqual({
      word: 'ubiquitous',
      meaning: 'everywhere',
    });

    const explain = fetchMock.mock.calls.find(([url]) => url === '/api/explain')!;
    expect(JSON.parse(explain[1].body as string)).toEqual({
      word: 'zenith',
      examTarget: 'SSC CGL',
    });
  });
});

// ─── 401 retry flow ──────────────────────────────────────────────

describe('401 expired-token recovery', () => {
  it('refreshes the token and retries once when the first request 401s', async () => {
    let sessionCallCount = 0;
    let mnemonicCallCount = 0;

    const fetchMock = vi.fn().mockImplementation(async (url: string) => {
      if (url === '/api/session') {
        sessionCallCount++;
        return {
          ok: true,
          status: 200,
          json: async () => ({
            token: `tok-${sessionCallCount}`,
            expiresIn: 7_200_000,
          }),
        };
      }
      if (url === '/api/mnemonic') {
        mnemonicCallCount++;
        if (mnemonicCallCount === 1) {
          return { ok: false, status: 401, json: async () => ({ error: 'Session expired.' }) };
        }
        return { ok: true, status: 200, json: async () => ({ text: 'recovered' }) };
      }
      throw new Error('unexpected url');
    });
    vi.stubGlobal('fetch', fetchMock);

    const { generateMnemonic } = await freshAiService();
    const result = await generateMnemonic('word', 'meaning');

    expect(result).toBe('recovered');
    expect(sessionCallCount).toBe(2);   // initial + refresh
    expect(mnemonicCallCount).toBe(2);  // initial 401 + retry
  });
});

// ─── 429 + other errors ──────────────────────────────────────────

describe('error handling', () => {
  it('returns a friendly message (not throw) on 429 rate-limit', async () => {
    const fetchMock = vi.fn()
      .mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => ({ token: 'tok', expiresIn: 7_200_000 }),
      })
      .mockResolvedValueOnce({
        ok: false,
        status: 429,
        json: async () => ({ error: 'rate limited' }),
      });
    vi.stubGlobal('fetch', fetchMock);

    const { generateMnemonic } = await freshAiService();
    const result = await generateMnemonic('word', 'meaning');
    expect(result).toMatch(/Too many requests/i);
  });

  it('falls back to a user-facing string on 500-class errors', async () => {
    const fetchMock = vi.fn()
      .mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => ({ token: 'tok', expiresIn: 7_200_000 }),
      })
      .mockResolvedValueOnce({
        ok: false,
        status: 500,
        json: async () => ({ error: 'boom' }),
      });
    vi.stubGlobal('fetch', fetchMock);

    const { generateMnemonic } = await freshAiService();
    const result = await generateMnemonic('word', 'meaning');
    // The catch block returns this exact fallback for mnemonic.
    expect(result).toBe('Could not generate mnemonic at this time.');
  });
});

// ─── Offline detection ───────────────────────────────────────────

describe('offline detection', () => {
  it('emits a vocabdost:offline-ai event and skips the network when offline', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({
      ok: true,
      status: 200,
      json: async () => ({ text: 'should not be reached' }),
    }));
    Object.defineProperty(navigator, 'onLine', { value: false, configurable: true });

    const listener = vi.fn();
    window.addEventListener('vocabdost:offline-ai', listener);

    const { generateMnemonic } = await freshAiService();
    const result = await generateMnemonic('word', 'meaning');

    expect(listener).toHaveBeenCalled();
    expect(result).toBe('Offline mode active.');

    // Restore for downstream tests.
    Object.defineProperty(navigator, 'onLine', { value: true, configurable: true });
    window.removeEventListener('vocabdost:offline-ai', listener);
  });
});

// ─── createDoubtChat multi-turn ──────────────────────────────────

describe('createDoubtChat', () => {
  it('passes accumulating history to /api/chat across turns', async () => {
    const fetchMock = vi.fn()
      .mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => ({ token: 'tok', expiresIn: 7_200_000 }),
      })
      .mockResolvedValue({
        ok: true,
        status: 200,
        json: async () => ({ text: 'model reply' }),
      });
    vi.stubGlobal('fetch', fetchMock);

    const { createDoubtChat } = await freshAiService();
    const session = createDoubtChat('zenith');

    await session.sendMessage({ message: 'what is the etymology?' });
    await session.sendMessage({ message: 'and any synonyms?' });

    const chatCalls = fetchMock.mock.calls.filter(([url]) => url === '/api/chat');
    expect(chatCalls.length).toBe(2);

    // aiService pushes the user message into history BEFORE posting, so
    // the first chat call already carries it in `history`.
    const firstBody = JSON.parse(chatCalls[0][1].body as string);
    expect(firstBody.history).toEqual([
      { role: 'user', parts: [{ text: 'what is the etymology?' }] },
    ]);
    expect(firstBody.message).toBe('what is the etymology?');

    // After the first call resolves, the model reply is pushed too, so the
    // second call sees [user1, model1, user2] in history.
    const secondBody = JSON.parse(chatCalls[1][1].body as string);
    expect(secondBody.history).toEqual([
      { role: 'user', parts: [{ text: 'what is the etymology?' }] },
      { role: 'model', parts: [{ text: 'model reply' }] },
      { role: 'user', parts: [{ text: 'and any synonyms?' }] },
    ]);
  });
});
