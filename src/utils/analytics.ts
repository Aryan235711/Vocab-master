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
