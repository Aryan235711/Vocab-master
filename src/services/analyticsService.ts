/**
 * @file analyticsService.ts
 * @description Thin wrapper around posthog-js that adds the safety
 * properties VocabDost requires:
 *
 *   - Consent-gated. Nothing is sent before the user explicitly opts in.
 *     PostHog is initialised with `opt_out_capturing_by_default: true`
 *     and we only flip the switch from the consent banner.
 *   - Anonymous install ID. UUID generated on first run, stored in
 *     localStorage, never bound to email or any PII.
 *   - Graceful no-op when env vars are missing. Local dev + the vitest
 *     environment both run cleanly without a PostHog project.
 *   - Privacy floor. A small allow-list of property keys is enforced
 *     inside `track()` so a future caller can't accidentally leak a
 *     word ID or other sensitive field through this surface.
 *
 * Components should NEVER import posthog-js directly. Always go through
 * this module so the consent/privacy floor can't be bypassed.
 */

import posthog from 'posthog-js';
import { v4 as uuidv4 } from 'uuid';

const INSTALL_ID_KEY = 'vocabdost_install_id';
const CONSENT_KEY = 'vocabdost_telemetry_consent';

const POSTHOG_KEY = import.meta.env.VITE_POSTHOG_KEY as string | undefined;
const POSTHOG_HOST = (import.meta.env.VITE_POSTHOG_HOST as string | undefined) || 'https://app.posthog.com';

// ─── Event vocabulary ────────────────────────────────────────────
// Keep this list short and intentional. Adding events here is a
// design decision; we should be able to answer "what is this event
// for and what decision will it inform?" before adding one.

export type AnalyticsEvent =
  | 'app_opened'
  | 'onboarding_completed'
  | 'review_recorded'
  | 'session_started'
  | 'session_completed'
  | 'ai_call_used';

/** Property keys allowed on outbound events. Anything outside this
 *  set is stripped before sending. Defence-in-depth against a future
 *  caller leaking sensitive data (e.g. a specific word ID that could
 *  hint at the user's vocabulary level). */
const ALLOWED_PROPERTY_KEYS = new Set([
  // review_recorded
  'quality', 'category', 'difficulty', 'response_time_ms', 'is_new_word',
  // session_completed
  'duration_ms', 'cards_reviewed', 'fatigue_triggered', 'fatigue_dismissed',
  // onboarding_completed
  'daily_goal', 'exam_target',
  // ai_call_used
  'endpoint',
  // common
  'timestamp',
]);

// ─── State ───────────────────────────────────────────────────────

let initialised = false;

function isBrowser(): boolean {
  return typeof window !== 'undefined' && typeof localStorage !== 'undefined';
}

function isEnabled(): boolean {
  // Only run when:
  //  - we have a posthog key configured AND
  //  - we're in a browser environment AND
  //  - we're not under vitest (where MODE === 'test')
  return Boolean(POSTHOG_KEY) && isBrowser() && import.meta.env.MODE !== 'test';
}

// ─── Public API ──────────────────────────────────────────────────

/** Returns the stable anonymous install ID, creating one if needed.
 *  Persisted to localStorage so it survives reloads but never leaves
 *  the device unless the user opts in. */
export function getInstallId(): string {
  if (!isBrowser()) return 'anonymous';
  let id = localStorage.getItem(INSTALL_ID_KEY);
  if (!id) {
    id = uuidv4();
    localStorage.setItem(INSTALL_ID_KEY, id);
  }
  return id;
}

/** Consent state. 'unset' means we should show the banner. */
export type ConsentState = 'unset' | 'granted' | 'declined';

export function getConsent(): ConsentState {
  if (!isBrowser()) return 'declined';
  const raw = localStorage.getItem(CONSENT_KEY);
  if (raw === 'granted' || raw === 'declined') return raw;
  return 'unset';
}

function setConsent(value: ConsentState): void {
  if (!isBrowser()) return;
  if (value === 'unset') {
    localStorage.removeItem(CONSENT_KEY);
  } else {
    localStorage.setItem(CONSENT_KEY, value);
  }
}

/** Initialise PostHog. Safe to call multiple times — guards against
 *  re-init. Does nothing when env vars are missing or under test. */
export function initAnalytics(): void {
  if (initialised) return;
  if (!isEnabled()) return;

  posthog.init(POSTHOG_KEY as string, {
    api_host: POSTHOG_HOST,
    // Nothing flows until the user explicitly grants consent in the
    // banner. This is the DPDP-required default-off behaviour.
    opt_out_capturing_by_default: true,
    // Session recording defaults to OFF — too heavyweight + privacy-
    // concerning for an exam-prep app with a young demographic.
    disable_session_recording: true,
    // We provide our own install ID via identify(); skip PostHog's
    // anonymous tracking heuristics so the bound ID is deterministic.
    autocapture: false,
    capture_pageview: false,
  });

  posthog.identify(getInstallId());

  // If the user previously granted consent, re-enable capturing.
  if (getConsent() === 'granted') {
    posthog.opt_in_capturing();
  }

  initialised = true;
}

export function grantConsent(): void {
  setConsent('granted');
  if (isEnabled() && initialised) {
    posthog.opt_in_capturing();
  }
}

export function declineConsent(): void {
  setConsent('declined');
  if (isEnabled() && initialised) {
    posthog.opt_out_capturing();
  }
}

/** Forwards a structured event to PostHog. No-ops if consent is not
 *  granted or analytics is disabled. Properties outside ALLOWED_PROPERTY_KEYS
 *  are silently stripped so a caller can't accidentally leak sensitive data. */
export function track(event: AnalyticsEvent, properties?: Record<string, unknown>): void {
  if (!isEnabled() || !initialised) return;
  if (getConsent() !== 'granted') return;

  const safeProps: Record<string, unknown> = {};
  if (properties) {
    for (const [k, v] of Object.entries(properties)) {
      if (ALLOWED_PROPERTY_KEYS.has(k)) safeProps[k] = v;
    }
  }

  try {
    posthog.capture(event, safeProps);
  } catch {
    // Never let analytics break the app.
  }
}

/** Test-only helper. Resets the module-level initialised flag and
 *  clears the install-id + consent from localStorage. */
export function __resetAnalyticsForTests(): void {
  initialised = false;
  if (isBrowser()) {
    localStorage.removeItem(INSTALL_ID_KEY);
    localStorage.removeItem(CONSENT_KEY);
  }
}
