/**
 * @file ConsentBanner.tsx
 * @description DPDP Act 2023-compliant telemetry consent banner.
 * Shown only when the user has not yet made a choice. Persists the
 * decision via the analyticsService.
 */

import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Shield } from 'lucide-react';
import { getConsent, grantConsent, declineConsent } from '../services/analyticsService';

export default function ConsentBanner() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    // Show on first paint if the user has never chosen.
    setVisible(getConsent() === 'unset');
  }, []);

  if (!visible) return null;

  return (
    <div
      data-testid="consent-banner"
      className="fixed bottom-0 left-0 right-0 z-[200] bg-slate-900 text-white p-4 shadow-2xl"
    >
      <div className="max-w-4xl mx-auto flex flex-col sm:flex-row sm:items-center gap-3">
        <div className="flex items-start gap-3 flex-1">
          <Shield className="w-6 h-6 text-indigo-300 shrink-0 mt-0.5" />
          <div className="text-sm leading-relaxed">
            <p className="font-bold mb-1">Help us improve VocabDost</p>
            <p className="text-slate-300">
              May we collect anonymous, aggregate usage data (no personal info, no
              individual word reviews) to understand which features actually help
              aspirants?{' '}
              <Link to="/privacy" className="text-indigo-300 underline hover:text-indigo-200">
                Read our privacy policy
              </Link>
              .
            </p>
          </div>
        </div>
        <div className="flex gap-2 sm:flex-col lg:flex-row shrink-0">
          <button
            data-testid="consent-decline"
            onClick={() => {
              declineConsent();
              setVisible(false);
            }}
            className="px-4 py-2 rounded-xl border border-slate-600 text-slate-200 text-sm font-bold hover:bg-slate-800 transition-colors"
          >
            Decline
          </button>
          <button
            data-testid="consent-accept"
            onClick={() => {
              grantConsent();
              setVisible(false);
            }}
            className="px-4 py-2 rounded-xl bg-indigo-500 text-white text-sm font-bold hover:bg-indigo-400 transition-colors"
          >
            Accept
          </button>
        </div>
      </div>
    </div>
  );
}
