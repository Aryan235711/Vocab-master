/**
 * @file PremiumContext.tsx
 * @description State management for premium tiers, soft-launch mode,
 * AI usage tracking, and founding member status.
 *
 * Soft launch behaviour:
 *   soft_launch: true  → all features unlocked, "Premium Coming Soon" badges, waitlist mode
 *   soft_launch: false → tier limits enforced, upgrade buttons active
 */

import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { UserTier, getLimitsForTier, PRICING } from '../config/featureGating';
import { getSoftLaunchEnabled, getFoundingMembersSold } from '../services/firestoreService';

// ─── Types ───────────────────────────────────────────────────────

interface AiUsage {
  date: string; // YYYY-MM-DD
  count: number;
}

interface PremiumContextType {
  tier: UserTier;
  isFoundingMember: boolean;
  softLaunch: boolean;
  softLaunchLoaded: boolean;
  foundingMembersSold: number;
  foundingSpotsRemaining: number;
  aiUsageToday: number;
  aiLimitToday: number;
  canUseAi: () => boolean;
  recordAiUsage: () => void;
  isGameModeUnlocked: (modeId: string) => boolean;
  isPremiumFeature: (modeId: string) => boolean;
}

const PremiumContext = createContext<PremiumContextType | undefined>(undefined);

// ─── Helpers ─────────────────────────────────────────────────────

function getTodayStr(): string {
  return new Date().toISOString().slice(0, 10);
}

function loadAiUsage(): AiUsage {
  try {
    const saved = localStorage.getItem('vocabdost_ai_usage');
    if (saved) {
      const parsed = JSON.parse(saved);
      if (parsed.date === getTodayStr()) return parsed;
    }
  } catch { /* reset on corruption */ }
  return { date: getTodayStr(), count: 0 };
}

// ─── Provider ────────────────────────────────────────────────────

export const PremiumProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  // Tier state (persisted in localStorage, always 'free' until Razorpay is wired)
  const [tier] = useState<UserTier>(() => {
    return (localStorage.getItem('vocabdost_tier') as UserTier) || 'free';
  });
  const [isFoundingMember] = useState<boolean>(() => {
    return localStorage.getItem('vocabdost_founding_member') === 'true';
  });

  // Remote config from Firestore
  const [softLaunch, setSoftLaunch] = useState(true);
  const [softLaunchLoaded, setSoftLaunchLoaded] = useState(false);
  const [foundingMembersSold, setFoundingMembersSold] = useState(0);

  // AI daily usage (localStorage)
  const [aiUsage, setAiUsage] = useState<AiUsage>(loadAiUsage);

  // Fetch remote config once on mount
  useEffect(() => {
    getSoftLaunchEnabled().then(val => {
      setSoftLaunch(val);
      setSoftLaunchLoaded(true);
    });
    getFoundingMembersSold().then(setFoundingMembersSold);
  }, []);

  // Persist AI usage
  useEffect(() => {
    localStorage.setItem('vocabdost_ai_usage', JSON.stringify(aiUsage));
  }, [aiUsage]);

  const limits = getLimitsForTier(tier);

  /**
   * Can the user make another AI call today?
   * In soft launch mode, everything is free — always returns true.
   */
  const canUseAi = useCallback(() => {
    if (softLaunch) return true;
    if (limits.aiCallsPerDay === -1) return true;
    const today = getTodayStr();
    if (aiUsage.date !== today) return true;
    return aiUsage.count < limits.aiCallsPerDay;
  }, [softLaunch, aiUsage, limits.aiCallsPerDay]);

  /** Record one AI call. Always tracks, even in soft launch (for analytics). */
  const recordAiUsage = useCallback(() => {
    const today = getTodayStr();
    setAiUsage(prev => {
      if (prev.date !== today) return { date: today, count: 1 };
      return { ...prev, count: prev.count + 1 };
    });
  }, []);

  /**
   * Is a game mode actually playable right now?
   * In soft launch: everything unlocked.
   * Otherwise: check tier limits.
   */
  const isGameModeUnlocked = useCallback((modeId: string) => {
    if (softLaunch) return true;
    return limits.unlockedGameModes.includes(modeId);
  }, [softLaunch, limits.unlockedGameModes]);

  /**
   * Is this mode gated behind Premium/Pro when live?
   * Used to show "Premium Coming Soon" badges even in soft launch.
   */
  const isPremiumFeature = useCallback((modeId: string) => {
    return !getLimitsForTier('free').unlockedGameModes.includes(modeId);
  }, []);

  const foundingSpotsRemaining = Math.max(
    0,
    PRICING.foundingMember.maxSlots - foundingMembersSold
  );

  return (
    <PremiumContext.Provider
      value={{
        tier,
        isFoundingMember,
        softLaunch,
        softLaunchLoaded,
        foundingMembersSold,
        foundingSpotsRemaining,
        aiUsageToday: aiUsage.date === getTodayStr() ? aiUsage.count : 0,
        aiLimitToday: limits.aiCallsPerDay,
        canUseAi,
        recordAiUsage,
        isGameModeUnlocked,
        isPremiumFeature,
      }}
    >
      {children}
    </PremiumContext.Provider>
  );
};

export const usePremium = () => {
  const ctx = useContext(PremiumContext);
  if (!ctx) throw new Error('usePremium must be used within PremiumProvider');
  return ctx;
};
