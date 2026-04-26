/**
 * @file PricingTab.tsx
 * @description Three-column pricing comparison page with Founding Member banner,
 * billing toggle (monthly/yearly), feature table, and waitlist collection.
 * Route: /pricing
 */

import React, { useState } from 'react';
import { Check, X as XIcon, Crown, Sparkles, Star, Mail, ArrowLeft } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { usePremium } from '../context/PremiumContext';
import { PRICING, FEATURE_COMPARISON } from '../config/featureGating';
import { submitWaitlistEmail } from '../services/firestoreService';

export default function PricingTab() {
  const { softLaunch, foundingSpotsRemaining, tier } = usePremium();
  const navigate = useNavigate();
  const [billing, setBilling] = useState<'monthly' | 'yearly'>('yearly');
  const [email, setEmail] = useState('');
  const [submitted, setSubmitted] = useState(
    () => !!localStorage.getItem('vocabdost_waitlist_email')
  );
  const [submitting, setSubmitting] = useState(false);

  const handleWaitlist = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim() || submitting) return;
    setSubmitting(true);
    const ok = await submitWaitlistEmail(email.trim());
    if (ok) {
      setSubmitted(true);
      localStorage.setItem('vocabdost_waitlist_email', email.trim());
    }
    setSubmitting(false);
  };

  const premiumPrice = billing === 'yearly'
    ? Math.round(PRICING.premium.yearly / 12)
    : PRICING.premium.monthly;
  const proPrice = billing === 'yearly'
    ? Math.round(PRICING.pro.yearly / 12)
    : PRICING.pro.monthly;

  return (
    <div className="p-4 lg:p-8 max-w-6xl w-full mx-auto flex flex-col gap-8 pb-24">
      {/* Back nav */}
      <button
        onClick={() => navigate(-1)}
        className="flex items-center gap-1 text-sm font-bold text-slate-500 hover:text-slate-700 w-max"
      >
        <ArrowLeft className="w-4 h-4" /> Back
      </button>

      {/* Header */}
      <div className="text-center">
        <h2 className="text-3xl lg:text-4xl font-black mb-3">Choose Your Plan</h2>
        <p className="text-slate-500 max-w-lg mx-auto">
          Unlock the full power of VocabDost to accelerate your exam prep.
        </p>
      </div>

      {/* ── Founding Member Banner ─────────────────────────────────── */}
      {foundingSpotsRemaining > 0 && (
        <div className="bg-gradient-to-r from-amber-500 to-orange-500 rounded-[32px] p-6 text-white relative overflow-hidden shadow-xl">
          <div className="absolute -right-8 -top-8 w-40 h-40 bg-white/10 rounded-full blur-2xl" />
          <div className="relative z-10 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div>
              <div className="flex items-center gap-2 mb-2">
                <Star className="w-5 h-5" fill="currentColor" />
                <span className="text-xs font-bold uppercase tracking-wider">Limited Offer</span>
              </div>
              <h3 className="text-xl font-black mb-1">Founding Member — Lifetime Access</h3>
              <p className="text-white/80 text-sm">
                All Premium features forever. One-time payment of ₹{PRICING.foundingMember.lifetime}.
              </p>
            </div>
            <div className="text-right shrink-0">
              <span className="text-3xl font-black">₹{PRICING.foundingMember.lifetime}</span>
              <span className="block text-sm font-bold text-white/80">
                {foundingSpotsRemaining} of {PRICING.foundingMember.maxSlots} spots left
              </span>
            </div>
          </div>
        </div>
      )}

      {/* ── Billing Toggle ─────────────────────────────────────────── */}
      <div className="flex justify-center">
        <div className="bg-slate-100 rounded-full p-1 flex">
          <button
            onClick={() => setBilling('monthly')}
            className={`px-5 py-2 rounded-full text-sm font-bold transition-all ${
              billing === 'monthly' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500'
            }`}
          >
            Monthly
          </button>
          <button
            onClick={() => setBilling('yearly')}
            className={`px-5 py-2 rounded-full text-sm font-bold transition-all ${
              billing === 'yearly' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500'
            }`}
          >
            Yearly{' '}
            <span className="text-emerald-600 text-[10px] font-black ml-1">SAVE 40%</span>
          </button>
        </div>
      </div>

      {/* ── Three-Column Plan Cards ────────────────────────────────── */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 lg:gap-6">
        {/* Free */}
        <div
          className={`bg-white rounded-[32px] p-6 border-2 ${
            tier === 'free' ? 'border-slate-300' : 'border-slate-100'
          } shadow-sm flex flex-col`}
        >
          <span className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-2">Free</span>
          <div className="mb-4">
            <span className="text-4xl font-black">₹0</span>
            <span className="text-slate-400 text-sm font-medium">/forever</span>
          </div>
          {tier === 'free' && (
            <span className="text-xs font-bold bg-slate-100 text-slate-600 px-3 py-1 rounded-full w-max mb-4">
              Current Plan
            </span>
          )}
          <ul className="space-y-3 flex-1 mb-6">
            <PlanFeature>Full 1,500 word dictionary</PlanFeature>
            <PlanFeature>SRS engine fully functional</PlanFeature>
            <PlanFeature>Quick Quiz game mode</PlanFeature>
            <PlanFeature>3 AI calls per day</PlanFeature>
            <PlanFeature>Basic analytics</PlanFeature>
          </ul>
          <div className="bg-slate-50 text-slate-500 text-center py-3 rounded-2xl font-bold text-sm border border-slate-100">
            Free Forever
          </div>
        </div>

        {/* Premium */}
        <div className="bg-white rounded-[32px] p-6 border-2 border-[#4F46E5] shadow-lg shadow-indigo-100 flex flex-col relative">
          <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-[#4F46E5] text-white text-[10px] font-bold uppercase tracking-wider px-4 py-1 rounded-full">
            Most Popular
          </div>
          <span className="text-xs font-bold uppercase tracking-wider text-[#4F46E5] mb-2">Premium</span>
          <div className="mb-4">
            <span className="text-4xl font-black">₹{premiumPrice}</span>
            <span className="text-slate-400 text-sm font-medium">/mo</span>
            {billing === 'yearly' && (
              <span className="block text-xs text-slate-400 mt-1">
                Billed ₹{PRICING.premium.yearly}/year
              </span>
            )}
          </div>
          <ul className="space-y-3 flex-1 mb-6">
            <PlanFeature>Everything in Free</PlanFeature>
            <PlanFeature highlight>All 4 game modes</PlanFeature>
            <PlanFeature highlight>30 AI calls per day</PlanFeature>
            <PlanFeature>Cross-device sync</PlanFeature>
            <PlanFeature>Advanced analytics</PlanFeature>
            <PlanFeature>Priority AI queue</PlanFeature>
            <PlanFeature>Email support</PlanFeature>
          </ul>
          {softLaunch ? (
            <div className="bg-indigo-50 text-[#4F46E5] text-center py-3 rounded-2xl font-bold text-sm border border-indigo-100">
              Coming Soon
            </div>
          ) : (
            <button className="bg-[#4F46E5] text-white py-4 rounded-2xl font-bold text-lg shadow-lg shadow-indigo-200 hover:bg-indigo-600 transition-colors">
              Upgrade to Premium
            </button>
          )}
        </div>

        {/* Pro */}
        <div
          className={`bg-white rounded-[32px] p-6 border-2 ${
            tier === 'pro' ? 'border-slate-800' : 'border-slate-100'
          } shadow-sm flex flex-col`}
        >
          <span className="text-xs font-bold uppercase tracking-wider text-slate-800 mb-2">Pro</span>
          <div className="mb-4">
            <span className="text-4xl font-black">₹{proPrice}</span>
            <span className="text-slate-400 text-sm font-medium">/mo</span>
            {billing === 'yearly' && (
              <span className="block text-xs text-slate-400 mt-1">
                Billed ₹{PRICING.pro.yearly}/year
              </span>
            )}
          </div>
          <ul className="space-y-3 flex-1 mb-6">
            <PlanFeature>Everything in Premium</PlanFeature>
            <PlanFeature highlight>Unlimited AI calls</PlanFeature>
            <PlanFeature>AI Tutor mode</PlanFeature>
            <PlanFeature>Custom word lists upload</PlanFeature>
            <PlanFeature>Mock exam generator</PlanFeature>
            <PlanFeature>Personalized study plans</PlanFeature>
            <PlanFeature>Telegram/WhatsApp group</PlanFeature>
          </ul>
          {softLaunch ? (
            <div className="bg-slate-50 text-slate-500 text-center py-3 rounded-2xl font-bold text-sm border border-slate-100">
              Coming Soon
            </div>
          ) : (
            <button className="bg-slate-800 text-white py-4 rounded-2xl font-bold text-lg shadow-lg hover:bg-slate-700 transition-colors">
              Upgrade to Pro
            </button>
          )}
        </div>
      </div>

      {/* ── Feature Comparison Table ───────────────────────────────── */}
      <div className="bg-white rounded-[32px] p-6 border border-slate-200 shadow-sm overflow-x-auto">
        <h3 className="text-lg font-bold mb-4">Feature Comparison</h3>
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-slate-100">
              <th className="text-left py-3 font-bold text-slate-500">Feature</th>
              <th className="text-center py-3 font-bold text-slate-500 w-20">Free</th>
              <th className="text-center py-3 font-bold text-[#4F46E5] w-20">Premium</th>
              <th className="text-center py-3 font-bold text-slate-800 w-20">Pro</th>
            </tr>
          </thead>
          <tbody>
            {FEATURE_COMPARISON.map(row => (
              <tr key={row.feature} className="border-b border-slate-50">
                <td className="py-3 font-medium">{row.feature}</td>
                {(['free', 'premium', 'pro'] as const).map(col => {
                  const val = row[col];
                  return (
                    <td key={col} className="text-center py-3">
                      {val === true ? (
                        <Check className="w-4 h-4 text-emerald-500 mx-auto" />
                      ) : val === false ? (
                        <XIcon className="w-4 h-4 text-slate-300 mx-auto" />
                      ) : (
                        <span className="font-bold">{val}</span>
                      )}
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* ── Waitlist CTA (soft launch only) ────────────────────────── */}
      {softLaunch && (
        <div className="bg-indigo-50 rounded-[32px] p-6 lg:p-8 border border-indigo-100 text-center">
          <Sparkles className="w-8 h-8 text-[#4F46E5] mx-auto mb-3" />
          <h3 className="text-xl font-black mb-2">Premium is Coming Soon</h3>
          <p className="text-slate-500 mb-6 max-w-md mx-auto">
            Join the waitlist to be first in line. Early members get exclusive launch pricing.
          </p>
          {submitted ? (
            <div className="bg-white rounded-2xl p-4 max-w-sm mx-auto border border-emerald-200">
              <p className="font-bold text-emerald-700">You're on the waitlist!</p>
              <p className="text-sm text-slate-500 mt-1">We'll notify you at launch.</p>
            </div>
          ) : (
            <form onSubmit={handleWaitlist} className="flex gap-2 max-w-sm mx-auto">
              <div className="flex-1 relative">
                <Mail className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="email"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  placeholder="your@email.com"
                  required
                  className="w-full border border-slate-200 rounded-xl pl-10 pr-4 py-3 text-sm focus:outline-none focus:border-[#4F46E5] focus:ring-1 focus:ring-[#4F46E5] bg-white"
                />
              </div>
              <button
                type="submit"
                disabled={submitting}
                className="bg-[#4F46E5] text-white px-5 py-3 rounded-xl font-bold text-sm hover:bg-indigo-600 disabled:opacity-50"
              >
                {submitting ? '...' : 'Join'}
              </button>
            </form>
          )}
        </div>
      )}
    </div>
  );
}

/** Small helper to keep the plan card lists DRY. */
function PlanFeature({
  children,
  highlight,
}: {
  children: React.ReactNode;
  highlight?: boolean;
}) {
  return (
    <li className={`flex items-start gap-2 text-sm ${highlight ? 'font-bold text-[#4F46E5]' : ''}`}>
      {highlight ? (
        <Crown className="w-4 h-4 shrink-0 mt-0.5" />
      ) : (
        <Check className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
      )}
      <span>{children}</span>
    </li>
  );
}
