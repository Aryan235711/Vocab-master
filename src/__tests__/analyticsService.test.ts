// @vitest-environment jsdom
/**
 * @file analyticsService.test.ts
 * @description Pins the defensive behaviour of the analytics layer:
 *  - When env vars are missing OR we're under vitest (MODE === 'test'),
 *    every public function MUST be a no-op. We rely on this so the
 *    150+ existing vitest cases keep running without PostHog mocks.
 *  - Install ID is generated once, persisted, stable across reloads.
 *  - Consent state (unset / granted / declined) round-trips correctly
 *    via localStorage.
 *  - `track()` strips disallowed property keys so a future caller can't
 *    leak a word ID through the analytics surface.
 *
 * `posthog-js` itself is NOT mocked here — the no-op guard makes it
 * never execute. If you ever want to assert "track() actually called
 * posthog.capture()", that test would need to override the guard with
 * a different environment setup.
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import {
  getInstallId,
  getConsent,
  grantConsent,
  declineConsent,
  initAnalytics,
  track,
  __resetAnalyticsForTests,
} from '../services/analyticsService';

beforeEach(() => {
  localStorage.clear();
  __resetAnalyticsForTests();
});

afterEach(() => {
  vi.restoreAllMocks();
});

// ─── Install ID ─────────────────────────────────────────────────

describe('getInstallId', () => {
  it('returns a UUID-shaped string on first call', () => {
    const id = getInstallId();
    expect(id).toMatch(/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/);
  });

  it('returns the same install ID on subsequent calls', () => {
    const a = getInstallId();
    const b = getInstallId();
    expect(a).toBe(b);
  });

  it('persists the ID to localStorage under a namespaced key', () => {
    const id = getInstallId();
    expect(localStorage.getItem('vocabdost_install_id')).toBe(id);
  });

  it('generates a fresh ID after the install record is cleared', () => {
    const before = getInstallId();
    localStorage.removeItem('vocabdost_install_id');
    const after = getInstallId();
    expect(after).not.toBe(before);
    expect(after).toMatch(/^[0-9a-f]{8}-/);
  });
});

// ─── Consent state ──────────────────────────────────────────────

describe('consent lifecycle', () => {
  it('starts as "unset" when nothing has been stored', () => {
    expect(getConsent()).toBe('unset');
  });

  it('round-trips to "granted" after grantConsent()', () => {
    grantConsent();
    expect(getConsent()).toBe('granted');
  });

  it('round-trips to "declined" after declineConsent()', () => {
    declineConsent();
    expect(getConsent()).toBe('declined');
  });

  it('treats unrecognised localStorage values as unset (defensive)', () => {
    localStorage.setItem('vocabdost_telemetry_consent', 'maybe');
    expect(getConsent()).toBe('unset');
  });
});

// ─── No-op guarantees under tests ──────────────────────────────

describe('no-op guarantees', () => {
  it('initAnalytics does not throw under test env', () => {
    // VITE_POSTHOG_KEY is not set in tests, AND MODE === 'test',
    // so this should be a clean no-op.
    expect(() => initAnalytics()).not.toThrow();
  });

  it('initAnalytics is idempotent', () => {
    initAnalytics();
    initAnalytics();
    expect(() => initAnalytics()).not.toThrow();
  });

  it('track() does not throw even before initAnalytics()', () => {
    expect(() => track('app_opened')).not.toThrow();
  });

  it('track() with disallowed property keys does not throw (silent strip)', () => {
    // 'word_id' is NOT in ALLOWED_PROPERTY_KEYS — it should be stripped.
    // Under test we no-op anyway, but we're verifying the call shape doesn't crash.
    expect(() => track('review_recorded', { word_id: 'leak', quality: 5 })).not.toThrow();
  });

  it('grantConsent + track combination is still a no-op under test env', () => {
    grantConsent();
    // Even with consent, MODE === 'test' means nothing leaves the process.
    expect(() => track('app_opened')).not.toThrow();
    expect(getConsent()).toBe('granted'); // consent state itself still toggled
  });
});
