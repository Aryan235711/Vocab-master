/**
 * @file PrivacyPolicy.tsx
 * @description Plain-language privacy policy for VocabDost. DPDP Act
 * 2023-aware: names the data, the purpose, the retention period, and
 * the user's right to withdraw consent at any time.
 *
 * If you change what events the app captures, update this page too —
 * it's the contract with the user.
 */

import React from 'react';
import { Link } from 'react-router-dom';
import { grantConsent, declineConsent, getConsent } from '../services/analyticsService';

export default function PrivacyPolicy() {
  const consent = getConsent();

  return (
    <div className="max-w-3xl mx-auto p-6 lg:p-10 text-slate-700 leading-relaxed">
      <Link to="/home" className="text-indigo-600 font-bold text-sm">&larr; Back to app</Link>

      <h1 className="text-3xl font-black text-slate-900 mt-4 mb-2">Privacy Policy</h1>
      <p className="text-sm text-slate-500 mb-6">Last updated: 2026-06-07</p>

      <h2 className="text-xl font-bold text-slate-900 mt-6 mb-2">What stays on your device</h2>
      <p>
        Almost everything. Your reviews, streaks, daily goals, exam target, the
        words you've seen, and the LocII signals computed from them all live in
        your browser's <code>localStorage</code>. They never leave your device
        unless you explicitly export a backup yourself from the Profile tab.
      </p>

      <h2 className="text-xl font-bold text-slate-900 mt-6 mb-2">What we send to a server (only if you accept)</h2>
      <p>
        If you tap <em>Accept</em> on the consent banner, the app sends anonymous,
        aggregate event data to PostHog so we can understand which features
        actually help aspirants. Specifically:
      </p>
      <ul className="list-disc pl-6 space-y-1 mt-2">
        <li><strong>app_opened</strong> — the app started.</li>
        <li><strong>onboarding_completed</strong> — your chosen daily goal and exam target (e.g. "SSC CGL").</li>
        <li><strong>review_recorded</strong> — your rating (0–5), the word's category (e.g. "Idioms"), difficulty label, response time in milliseconds. <em>Never the word itself.</em></li>
        <li><strong>session_started / session_completed</strong> — session duration and number of cards reviewed.</li>
        <li><strong>ai_call_used</strong> — which AI endpoint you used (mnemonic / explain / chat). Never the prompt or the response.</li>
      </ul>

      <h2 className="text-xl font-bold text-slate-900 mt-6 mb-2">What we never collect</h2>
      <ul className="list-disc pl-6 space-y-1 mt-2">
        <li>Your name, email, phone number, or any other personally identifying information.</li>
        <li>The specific words you reviewed.</li>
        <li>The contents of any AI prompts or replies.</li>
        <li>Your IP address (PostHog records this on its end but we do not query or store it).</li>
        <li>Screen recordings or input replays.</li>
      </ul>

      <h2 className="text-xl font-bold text-slate-900 mt-6 mb-2">Your install ID</h2>
      <p>
        We generate a random UUID once per install and store it in your browser.
        It's used so we can tell two events came from the same device for things
        like measuring retention. It's not bound to anything outside this device.
        Clearing your browser storage resets it.
      </p>

      <h2 className="text-xl font-bold text-slate-900 mt-6 mb-2">Your rights under the DPDP Act, 2023</h2>
      <p>
        You can change your mind at any time. The current state of your consent
        is shown below — tap to flip it.
      </p>
      <div className="mt-3 p-4 bg-slate-50 rounded-2xl border border-slate-200 flex items-center justify-between flex-wrap gap-3">
        <p className="text-sm">
          Current consent: <strong className={consent === 'granted' ? 'text-emerald-600' : 'text-slate-600'}>{consent === 'granted' ? 'Granted' : consent === 'declined' ? 'Declined' : 'Not yet chosen'}</strong>
        </p>
        <div className="flex gap-2">
          <button
            onClick={() => { declineConsent(); window.location.reload(); }}
            className="px-4 py-2 rounded-xl border border-slate-300 text-slate-700 text-sm font-bold hover:bg-slate-100 transition-colors"
          >
            Decline / withdraw
          </button>
          <button
            onClick={() => { grantConsent(); window.location.reload(); }}
            className="px-4 py-2 rounded-xl bg-indigo-600 text-white text-sm font-bold hover:bg-indigo-500 transition-colors"
          >
            Grant
          </button>
        </div>
      </div>

      <h2 className="text-xl font-bold text-slate-900 mt-6 mb-2">Children's data</h2>
      <p>
        Some users preparing for these exams are under 18. If you are under 18,
        please decline the telemetry banner unless a parent or guardian has
        agreed. The app works identically either way.
      </p>

      <h2 className="text-xl font-bold text-slate-900 mt-6 mb-2">Questions or requests</h2>
      <p>
        Email the maintainer through the GitHub repository:{' '}
        <a href="https://github.com/Aryan235711/Vocab-master" className="text-indigo-600 underline">
          github.com/Aryan235711/Vocab-master
        </a>.
      </p>
    </div>
  );
}
