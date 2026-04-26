/**
 * @file AiUsageIndicator.tsx
 * @description Shows "AI used today: X/Y (resets at midnight)".
 * Compact mode renders as a small pill for inline use (e.g., Learn tab top bar).
 * Full mode renders as a card for Profile tab.
 */

import React from 'react';
import { Sparkles } from 'lucide-react';
import { usePremium } from '../context/PremiumContext';

interface AiUsageIndicatorProps {
  compact?: boolean;
}

export default function AiUsageIndicator({ compact = false }: AiUsageIndicatorProps) {
  const { aiUsageToday, aiLimitToday } = usePremium();

  // Unlimited tier — no indicator needed
  if (aiLimitToday === -1) return null;

  const remaining = Math.max(0, aiLimitToday - aiUsageToday);
  const isLow = remaining <= 1;

  if (compact) {
    return (
      <div
        className={`flex items-center gap-1 text-[10px] font-bold px-2 py-1 rounded-full ${
          isLow ? 'bg-red-50 text-red-600' : 'bg-indigo-50 text-indigo-600'
        }`}
        title={`AI calls: ${aiUsageToday}/${aiLimitToday} used today`}
      >
        <Sparkles className="w-3 h-3" />
        <span>
          {aiUsageToday}/{aiLimitToday}
        </span>
      </div>
    );
  }

  return (
    <div
      className={`flex items-center justify-between p-4 rounded-2xl border ${
        isLow ? 'bg-red-50 border-red-100' : 'bg-indigo-50 border-indigo-100'
      }`}
    >
      <div className="flex items-center gap-3">
        <Sparkles className={`w-5 h-5 ${isLow ? 'text-red-500' : 'text-indigo-500'}`} />
        <div>
          <span className="block text-sm font-bold">
            AI used today: {aiUsageToday}/{aiLimitToday}
          </span>
          <span className="block text-[10px] text-slate-500 font-medium">Resets at midnight</span>
        </div>
      </div>
      <div
        className={`text-xs font-bold px-3 py-1 rounded-full ${
          isLow ? 'bg-red-100 text-red-700' : 'bg-indigo-100 text-indigo-700'
        }`}
      >
        {remaining} left
      </div>
    </div>
  );
}
