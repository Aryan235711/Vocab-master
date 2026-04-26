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
