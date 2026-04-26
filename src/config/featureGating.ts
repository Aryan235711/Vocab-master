/**
 * @file featureGating.ts
 * @description Tier definitions, feature limits, pricing constants, and gating helpers
 * for Free / Premium / Pro tiers plus the Founding Member lifetime sub-tier.
 */

// ─── Tier Types ──────────────────────────────────────────────────

export type UserTier = 'free' | 'premium' | 'pro';

export interface TierLimits {
  aiCallsPerDay: number; // -1 = unlimited
  unlockedGameModes: string[];
  crossDeviceSync: boolean;
  advancedAnalytics: boolean;
  priorityAiQueue: boolean;
  aiTutorMode: boolean;
  customWordLists: boolean;
  mockExamGenerator: boolean;
  personalizedStudyPlans: boolean;
}

// ─── Tier Limit Constants ────────────────────────────────────────

export const FREE_TIER_LIMITS: TierLimits = {
  aiCallsPerDay: 3,
  unlockedGameModes: ['quickQuiz'],
  crossDeviceSync: false,
  advancedAnalytics: false,
  priorityAiQueue: false,
  aiTutorMode: false,
  customWordLists: false,
  mockExamGenerator: false,
  personalizedStudyPlans: false,
};

export const PREMIUM_LIMITS: TierLimits = {
  aiCallsPerDay: 30,
  unlockedGameModes: ['quickQuiz', 'synonymSprint', 'sentenceFill', 'idiomsMatch'],
  crossDeviceSync: true,
  advancedAnalytics: true,
  priorityAiQueue: true,
  aiTutorMode: false,
  customWordLists: false,
  mockExamGenerator: false,
  personalizedStudyPlans: false,
};

export const PRO_LIMITS: TierLimits = {
  aiCallsPerDay: -1,
  unlockedGameModes: ['quickQuiz', 'synonymSprint', 'sentenceFill', 'idiomsMatch'],
  crossDeviceSync: true,
  advancedAnalytics: true,
  priorityAiQueue: true,
  aiTutorMode: true,
  customWordLists: true,
  mockExamGenerator: true,
  personalizedStudyPlans: true,
};

export const TIER_LIMITS: Record<UserTier, TierLimits> = {
  free: FREE_TIER_LIMITS,
  premium: PREMIUM_LIMITS,
  pro: PRO_LIMITS,
};

// ─── Helpers ─────────────────────────────────────────────────────

export function getLimitsForTier(tier: UserTier): TierLimits {
  return TIER_LIMITS[tier];
}

// ─── Pricing (INR) ──────────────────────────────────────────────

export const PRICING = {
  premium: { monthly: 99, yearly: 699 },
  pro: { monthly: 199, yearly: 1499 },
  foundingMember: {
    lifetime: 1999,
    maxSlots: 100,
    /** Founding Members get Premium-equivalent access, NOT Pro */
    tier: 'premium' as UserTier,
  },
} as const;

// ─── Feature Comparison Table Data ──────────────────────────────

export const FEATURE_COMPARISON = [
  { feature: '1,500 word dictionary', free: true, premium: true, pro: true },
  { feature: 'Full SRS engine', free: true, premium: true, pro: true },
  { feature: 'Quick Quiz', free: true, premium: true, pro: true },
  { feature: 'All 4 game modes', free: false, premium: true, pro: true },
  { feature: 'AI calls per day', free: '3', premium: '30', pro: 'Unlimited' },
  { feature: 'Basic analytics', free: true, premium: true, pro: true },
  { feature: 'Advanced analytics', free: false, premium: true, pro: true },
  { feature: 'Cross-device sync', free: false, premium: true, pro: true },
  { feature: 'Priority AI queue', free: false, premium: true, pro: true },
  { feature: 'AI Tutor mode', free: false, premium: false, pro: true },
  { feature: 'Custom word lists', free: false, premium: false, pro: true },
  { feature: 'Mock exam generator', free: false, premium: false, pro: true },
  { feature: 'Personalized study plans', free: false, premium: false, pro: true },
  { feature: 'Email support', free: false, premium: true, pro: true },
  { feature: 'Telegram/WhatsApp group', free: false, premium: false, pro: true },
] as const;
