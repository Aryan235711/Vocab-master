/**
 * @file analytics.ts
 * @description Pure functions for analytics computations used by AppContext.
 * Extracted for testability — these drive XP, leveling, streaks, and daily progress tracking.
 * Part of the LocII (Locally Integrated Intelligence) system.
 */

import { startOfDay } from 'date-fns';

/**
 * Computes the user level from total XP.
 * Every 500 XP = 1 level. Level starts at 1.
 */
export function computeLevel(xp: number): number {
  return Math.floor(xp / 500) + 1;
}

/**
 * Determines whether a streak should continue, reset, or start fresh.
 *
 * @param lastStudyDate ISO string of last study session, or null if never studied
 * @param today The current date (start of day)
 * @param currentStreak The user's current streak count
 * @returns The updated streak value
 */
export function computeStreak(
  lastStudyDate: string | null,
  today: Date,
  currentStreak: number
): number {
  if (!lastStudyDate) return 1; // first ever session

  const lastDate = startOfDay(new Date(lastStudyDate));
  const diffDays = Math.round(
    Math.abs(today.getTime() - lastDate.getTime()) / (1000 * 60 * 60 * 24)
  );

  if (diffDays === 0) return currentStreak; // same day — no change
  if (diffDays === 1) return currentStreak + 1; // consecutive day
  return 1; // gap > 1 day — reset to 1 (today counts)
}

/**
 * Checks if a streak should be broken on app load (mount-time check).
 * Returns 0 if the gap since last study is > 1 day, otherwise returns the current streak.
 */
export function checkStreakBreak(
  lastStudyDate: string | null,
  today: Date,
  currentStreak: number
): number {
  if (!lastStudyDate) return currentStreak;

  const lastDate = startOfDay(new Date(lastStudyDate));
  const diffDays = Math.round(
    Math.abs(today.getTime() - lastDate.getTime()) / (1000 * 60 * 60 * 24)
  );

  return diffDays > 1 ? 0 : currentStreak;
}

/**
 * Computes updated daily progress counters.
 *
 * @param isDifferentDay Whether today differs from lastStudyDate
 * @param isNewWord Whether the reviewed word was new (first interaction)
 * @param currentWordsLearnedToday Current count
 * @param currentReviewsCompletedToday Current count
 * @returns Updated { wordsLearnedToday, reviewsCompletedToday }
 */
export function computeDailyCounters(
  isDifferentDay: boolean,
  isNewWord: boolean,
  currentWordsLearnedToday: number,
  currentReviewsCompletedToday: number
): { wordsLearnedToday: number; reviewsCompletedToday: number } {
  if (isDifferentDay) {
    return {
      wordsLearnedToday: isNewWord ? 1 : 0,
      reviewsCompletedToday: isNewWord ? 0 : 1,
    };
  }
  return {
    wordsLearnedToday: currentWordsLearnedToday + (isNewWord ? 1 : 0),
    reviewsCompletedToday: currentReviewsCompletedToday + (isNewWord ? 0 : 1),
  };
}

/**
 * Returns the updated best score for a mode.
 * Only overwrites if the new score is strictly higher.
 */
export function computeBestScore(
  currentBest: number,
  newScore: number
): number {
  return newScore > currentBest ? newScore : currentBest;
}

/**
 * Single-day activity entry stored per date in the activity log.
 * `learned` counts first-touch interactions (new words seen today),
 * `reviews` counts re-reviews of already-known words.
 */
export interface DailyActivityEntry {
  reviews: number;
  learned: number;
}

/**
 * Append-or-increment helper for the per-day activity log that drives the
 * heatmap on ProgressTab. Pure: returns a new object, never mutates.
 *
 * @param current Existing log keyed by YYYY-MM-DD
 * @param dateKey YYYY-MM-DD for the day to increment
 * @param isNewWord true → bump `learned`; false → bump `reviews`
 */
export function updateDailyActivity(
  current: Record<string, DailyActivityEntry>,
  dateKey: string,
  isNewWord: boolean
): Record<string, DailyActivityEntry> {
  const existing = current[dateKey] || { reviews: 0, learned: 0 };
  return {
    ...current,
    [dateKey]: {
      reviews: existing.reviews + (isNewWord ? 0 : 1),
      learned: existing.learned + (isNewWord ? 1 : 0),
    },
  };
}

/**
 * Convenience converter: Date → 'YYYY-MM-DD' in LOCAL timezone.
 * We use the local-date getters instead of `toISOString()` because the
 * caller often passes `startOfDay(new Date())`, which is local midnight.
 * Slicing that as UTC would push timezones east of UTC to the previous
 * calendar day, putting heatmap cells under the wrong key.
 */
export function toDateKey(d: Date): string {
  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, '0');
  const dd = String(d.getDate()).padStart(2, '0');
  return `${yyyy}-${mm}-${dd}`;
}

// ─── Per-Category Accuracy Log (LocII Tier 1.1) ──────────────────

export interface AccuracyBucket {
  correct: number;
  total: number;
}

/** Per-category accuracy log keyed as `category → YYYY-MM-DD → {correct,total}`. */
export type CategoryAccuracyLog = Record<string, Record<string, AccuracyBucket>>;

/**
 * Records one review's outcome into the per-day bucket for its category.
 * Pure: returns a new object, never mutates.
 */
export function updateCategoryAccuracyLog(
  current: CategoryAccuracyLog,
  category: string,
  dateKey: string,
  isCorrect: boolean
): CategoryAccuracyLog {
  const catBuckets = current[category] || {};
  const bucket = catBuckets[dateKey] || { correct: 0, total: 0 };
  return {
    ...current,
    [category]: {
      ...catBuckets,
      [dateKey]: {
        correct: bucket.correct + (isCorrect ? 1 : 0),
        total: bucket.total + 1,
      },
    },
  };
}

/**
 * Computes a Laplace-smoothed accuracy rate where each bucket's
 * contribution decays exponentially with age. A bucket from
 * `halfLifeDays` ago weighs 0.5; from 2× ago weighs 0.25; etc.
 *
 * Pure: no state, no date-fns coupling.
 *
 * @param buckets per-day buckets for one category (or undefined → empty)
 * @param today reference date for decay computation
 * @param halfLifeDays days until weight halves (default 14)
 */
export function computeTimeWeightedRate(
  buckets: Record<string, AccuracyBucket> | undefined,
  today: Date,
  halfLifeDays: number = 14
): number {
  if (!buckets || Object.keys(buckets).length === 0) {
    // Laplace prior over zero data → 0.5 (neutral).
    return 0.5;
  }
  const todayMs = today.getTime();
  let weightedCorrect = 0;
  let weightedTotal = 0;
  for (const [dateKey, bucket] of Object.entries(buckets)) {
    // Parse the YYYY-MM-DD key as a LOCAL date (matches toDateKey output).
    const [y, m, d] = dateKey.split('-').map(Number);
    const bucketDate = new Date(y, m - 1, d);
    const daysAgo = Math.max(
      0,
      (todayMs - bucketDate.getTime()) / (1000 * 60 * 60 * 24)
    );
    const weight = Math.pow(0.5, daysAgo / halfLifeDays);
    weightedCorrect += weight * bucket.correct;
    weightedTotal += weight * bucket.total;
  }
  // Laplace smoothing using the weighted total as effective sample size.
  return (weightedCorrect + 1) / (weightedTotal + 2);
}

// ─── Observed Difficulty (LocII Tier 2.3) ────────────────────────

export type DifficultyLabel = 'Easy' | 'Medium' | 'Hard';

/**
 * Maps the user's observed average-quality score on a single word to a
 * difficulty label, returning `null` when the sample size is too small
 * to be reliable.
 *
 * Static dictionary labels are a population prior. After enough personal
 * reviews, this user's actual experience should dominate — a word that's
 * labelled "Medium" but the user always nails in 1 second is effectively
 * Easy FOR THEM, and LocII should schedule it accordingly.
 *
 * Default thresholds (from LOCII_ROADMAP.md §2.3):
 *   avg >= 4.0   → 'Easy'    (mostly 4s and 5s)
 *   3.0 <= avg   → 'Medium'  (correct but with friction)
 *   avg < 3.0    → 'Hard'    (frequent lapses)
 *
 * @param qualitySum   sum of quality scores across all reviews of the word
 * @param qualityCount how many reviews contributed to qualitySum
 * @param minReviews   minimum sample size before overriding the prior (default 5)
 * @returns the calibrated label, or null if insufficient data
 */
export function observedDifficulty(
  qualitySum: number,
  qualityCount: number,
  minReviews: number = 5
): DifficultyLabel | null {
  if (qualityCount < minReviews) return null;
  if (qualityCount <= 0) return null;
  const avg = qualitySum / qualityCount;
  if (avg >= 4.0) return 'Easy';
  if (avg >= 3.0) return 'Medium';
  return 'Hard';
}

// ─── Response Time Modifier (LocII Tier 2.1) ─────────────────────

/**
 * Maps total time-to-answer (card shown → rating tapped) to a multiplier
 * on the SRS interval. The intuition: a correct answer after 12 seconds
 * of staring at the card is less load-bearing than an instant recall —
 * the engine should schedule it sooner.
 *
 * Default thresholds (from LOCII_ROADMAP.md §2.1):
 *   < 3000ms  → 1.00x  (confident)
 *   3-8000ms  → 0.90x  (moderate)
 *   > 8000ms  → 0.75x  (hesitant)
 *
 * Pure: no state, no side effects.
 *
 * @param responseTimeMs total ms from card shown to rating tapped
 * @param options.confidentMs upper bound of "confident" band (default 3000)
 * @param options.hesitantMs  upper bound of "moderate"  band (default 8000)
 */
export function responseTimeMultiplier(
  responseTimeMs: number,
  options: { confidentMs?: number; hesitantMs?: number } = {}
): number {
  const confident = options.confidentMs ?? 3000;
  const hesitant = options.hesitantMs ?? 8000;
  // Negative times (clock skew, NaN) → fall back to neutral. Never amplify.
  if (!(responseTimeMs >= 0)) return 1.0;
  if (responseTimeMs < confident) return 1.0;
  if (responseTimeMs < hesitant) return 0.9;
  return 0.75;
}

// ─── Session Fatigue Detection (LocII Tier 1.2) ──────────────────

export interface SessionFatigueSignal {
  /** True when the late-window accuracy has dropped enough below the
   *  early-window accuracy to suggest the user is tiring. */
  fatigued: boolean;
  /** Accuracy across the first `windowSize` answers (0–1). */
  earlyAccuracy: number;
  /** Accuracy across the most recent `windowSize` answers (0–1). */
  recentAccuracy: number;
  /** Drop, in absolute percentage points (positive = decline). */
  dropPercent: number;
}

/**
 * Compares accuracy in the opening window of a session to the most
 * recent window. Flags fatigue when the late-window accuracy is at
 * least `thresholdDrop` (as a fraction, e.g. 0.15 = 15 pts) below the
 * early window. Pure: no React, no side effects.
 *
 * @param qualityHistory ordered quality scores (0–5) from the current session
 * @param windowSize how many answers form each window (default 5)
 * @param thresholdDrop required drop as a fraction, e.g. 0.15 = 15 pts
 */
export function detectSessionFatigue(
  qualityHistory: number[],
  windowSize: number = 5,
  thresholdDrop: number = 0.15
): SessionFatigueSignal {
  // Need two non-overlapping windows of data before signalling —
  // otherwise a single bad answer near the start would trip it.
  if (qualityHistory.length < windowSize * 2) {
    return { fatigued: false, earlyAccuracy: 0, recentAccuracy: 0, dropPercent: 0 };
  }
  const early = qualityHistory.slice(0, windowSize);
  const recent = qualityHistory.slice(-windowSize);
  const correctRate = (arr: number[]) => arr.filter(q => q >= 3).length / arr.length;
  const earlyAccuracy = correctRate(early);
  const recentAccuracy = correctRate(recent);
  const drop = earlyAccuracy - recentAccuracy;
  return {
    fatigued: drop >= thresholdDrop,
    earlyAccuracy,
    recentAccuracy,
    dropPercent: drop * 100,
  };
}
