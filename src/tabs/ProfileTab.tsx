/**
 * @file ProfileTab.tsx
 * @description User settings, AI usage display, cross-device sync messaging,
 * founding member badge, and upgrade/waitlist CTA.
 */

import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { usePremium } from '../context/PremiumContext';
import { useNavigate } from 'react-router-dom';
import { Code, Heart, Crown, Cloud, Star } from 'lucide-react';
import AiUsageIndicator from '../components/AiUsageIndicator';
import UpgradeModal from '../components/UpgradeModal';

export default function ProfileTab() {
  const { settings, updateSettings, resetProgress } = useApp();
  const { tier, isFoundingMember, softLaunch } = usePremium();
  const navigate = useNavigate();
  const [showSyncUpgrade, setShowSyncUpgrade] = useState(false);

  const handleReset = () => {
    if (window.confirm('Are you sure you want to reset all progress? This cannot be undone.')) {
      resetProgress();
      navigate('/home');
    }
  };

  return (
    <div className="p-4 lg:p-8 max-w-4xl w-full mx-auto flex flex-col gap-6 pb-20">
      <h2 className="text-3xl font-black mb-2">Profile & Settings</h2>

      {/* ── Founding Member Badge ──────────────────────────────────── */}
      {isFoundingMember && (
        <div className="bg-gradient-to-r from-amber-500 to-orange-500 rounded-2xl p-4 flex items-center gap-3 text-white shadow-lg">
          <Star className="w-8 h-8" fill="currentColor" />
          <div>
            <span className="font-black text-lg block leading-tight">Founding Member</span>
            <span className="text-sm text-white/80">Lifetime Premium access</span>
          </div>
        </div>
      )}

      {/* ── Tier Badge ────────────────────────────────────────────── */}
      {!isFoundingMember && (
        <div className="flex items-center justify-between bg-white rounded-2xl p-4 border border-slate-200 shadow-sm">
          <div className="flex items-center gap-3">
            <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${
              tier === 'pro' ? 'bg-slate-800 text-white' :
              tier === 'premium' ? 'bg-indigo-100 text-[#4F46E5]' :
              'bg-slate-100 text-slate-500'
            }`}>
              <Crown className="w-5 h-5" />
            </div>
            <div>
              <span className="font-bold capitalize">{tier} Plan</span>
              <span className="block text-xs text-slate-400">
                {tier === 'free' ? 'Basic features' : tier === 'premium' ? 'All game modes + 30 AI/day' : 'Unlimited access'}
              </span>
            </div>
          </div>
          {tier === 'free' && (
            <button
              onClick={() => navigate('/pricing')}
              className="bg-[#4F46E5] text-white px-4 py-2 rounded-xl text-sm font-bold hover:bg-indigo-600 transition-colors"
            >
              {softLaunch ? 'View Plans' : 'Upgrade'}
            </button>
          )}
        </div>
      )}

      {/* ── AI Usage Counter ──────────────────────────────────────── */}
      <AiUsageIndicator />

      {/* ── Cross-Device Sync Messaging ───────────────────────────── */}
      {tier === 'free' && (
        <div
          onClick={() => setShowSyncUpgrade(true)}
          className="bg-slate-50 rounded-2xl p-4 border border-slate-200 flex items-center gap-3 cursor-pointer hover:bg-slate-100 transition-colors"
        >
          <Cloud className="w-8 h-8 text-slate-400 shrink-0" />
          <div className="flex-1">
            <span className="font-bold text-sm block">Your progress is saved on this device</span>
            <span className="text-xs text-slate-500">
              Upgrade to Premium for cloud sync across all devices.
            </span>
          </div>
          <Crown className="w-5 h-5 text-[#4F46E5] shrink-0" />
        </div>
      )}

      {/* ── Settings Card ─────────────────────────────────────────── */}
      <div className="bg-white rounded-[32px] p-6 lg:p-8 border border-slate-200 shadow-sm space-y-6">
        <div>
          <label className="block text-sm font-bold text-slate-500 uppercase tracking-wider mb-2">Exam Target</label>
          <select
            value={settings.examTarget}
            onChange={e => updateSettings({ examTarget: e.target.value })}
            className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 font-medium outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-all cursor-pointer"
          >
            <option>SSC CGL</option>
            <option>SSC CHSL</option>
            <option>UPSC CSAT</option>
            <option>IBPS PO</option>
            <option>SBI Clerk</option>
          </select>
        </div>

        <div>
          <div className="flex justify-between items-center mb-2">
            <label className="text-sm font-bold text-slate-500 uppercase tracking-wider">Daily Goal (Words)</label>
            <span className="font-black text-[#4F46E5]">{settings.dailyGoal}</span>
          </div>
          <input
            type="range"
            min="5" max="30" step="5"
            value={settings.dailyGoal}
            onChange={e => updateSettings({ dailyGoal: Number(e.target.value) })}
            className="w-full accent-[#4F46E5] cursor-pointer"
          />
        </div>

        <div className="flex items-center justify-between border-t border-slate-100 pt-6">
          <div>
            <span className="block font-bold">Hindi Translations</span>
            <span className="text-xs text-slate-500 font-medium">Show Hindi meaning on cards</span>
          </div>
          <button
            onClick={() => updateSettings({ showHindi: !settings.showHindi })}
            className={`w-14 h-8 rounded-full p-1 transition-colors ${settings.showHindi ? 'bg-emerald-500' : 'bg-slate-300'}`}
          >
            <div className={`w-6 h-6 bg-white rounded-full shadow-md transform transition-transform ${settings.showHindi ? 'translate-x-6' : 'translate-x-0'}`} />
          </button>
        </div>

      </div>

      <button
        onClick={handleReset}
        className="mt-2 bg-red-50 text-red-600 font-bold py-4 rounded-2xl border border-red-100 hover:bg-red-100 transition-colors"
      >
        Danger: Reset All Progress
      </button>

      <div className="mt-4 flex flex-col items-center opacity-60 text-slate-500">
        <span className="text-sm font-bold tracking-wider mb-1 flex items-center gap-1">
          <Code size={14}/> VocabDost v1.0.0
        </span>
        <span className="text-xs font-medium flex items-center gap-1">Made with <Heart className="w-3 h-3 text-red-500 fill-red-500" /> in India</span>
      </div>

      <UpgradeModal
        open={showSyncUpgrade}
        onClose={() => setShowSyncUpgrade(false)}
        feature="Cross-device sync"
      />
    </div>
  );
}
