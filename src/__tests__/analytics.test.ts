import { describe, it, expect } from 'vitest';
import {
  computeLevel,
  computeStreak,
  checkStreakBreak,
  computeDailyCounters,
  computeBestScore,
  updateDailyActivity,
  toDateKey,
} from '../utils/analytics';
import { startOfDay, subDays } from 'date-fns';

// ─── computeLevel ───────────────────────────────────────────────

describe('computeLevel', () => {
  it('starts at level 1 with 0 XP', () => {
    expect(computeLevel(0)).toBe(1);
  });

  it('stays at level 1 with 499 XP', () => {
    expect(computeLevel(499)).toBe(1);
  });

  it('reaches level 2 at exactly 500 XP', () => {
    expect(computeLevel(500)).toBe(2);
  });

  it('computes level 10 at 4500 XP', () => {
    expect(computeLevel(4500)).toBe(10);
  });

  it('handles large XP values', () => {
    expect(computeLevel(10000)).toBe(21);
  });
});

// ─── computeStreak ──────────────────────────────────────────────

describe('computeStreak', () => {
  const today = startOfDay(new Date());

  it('returns 1 on first ever session (no lastStudyDate)', () => {
    expect(computeStreak(null, today, 0)).toBe(1);
  });

  it('continues streak for consecutive day', () => {
    const yesterday = subDays(today, 1).toISOString();
    expect(computeStreak(yesterday, today, 5)).toBe(6);
  });

  it('keeps streak unchanged if same day', () => {
    const todayStr = today.toISOString();
    expect(computeStreak(todayStr, today, 5)).toBe(5);
  });

  it('resets streak to 1 if gap > 1 day', () => {
    const threeDaysAgo = subDays(today, 3).toISOString();
    expect(computeStreak(threeDaysAgo, today, 10)).toBe(1);
  });

  it('resets streak to 1 if gap is exactly 2 days', () => {
    const twoDaysAgo = subDays(today, 2).toISOString();
    expect(computeStreak(twoDaysAgo, today, 7)).toBe(1);
  });
});

// ─── checkStreakBreak ───────────────────────────────────────────

describe('checkStreakBreak', () => {
  const today = startOfDay(new Date());

  it('preserves streak if no lastStudyDate', () => {
    expect(checkStreakBreak(null, today, 3)).toBe(3);
  });

  it('preserves streak if last studied yesterday', () => {
    const yesterday = subDays(today, 1).toISOString();
    expect(checkStreakBreak(yesterday, today, 5)).toBe(5);
  });

  it('preserves streak if last studied today', () => {
    const todayStr = today.toISOString();
    expect(checkStreakBreak(todayStr, today, 5)).toBe(5);
  });

  it('breaks streak to 0 if gap > 1 day', () => {
    const threeDaysAgo = subDays(today, 3).toISOString();
    expect(checkStreakBreak(threeDaysAgo, today, 10)).toBe(0);
  });

  it('breaks streak to 0 if gap is exactly 2 days', () => {
    const twoDaysAgo = subDays(today, 2).toISOString();
    expect(checkStreakBreak(twoDaysAgo, today, 7)).toBe(0);
  });
});

// ─── computeDailyCounters ───────────────────────────────────────

describe('computeDailyCounters', () => {
  it('resets counters on new day with new word', () => {
    const result = computeDailyCounters(true, true, 5, 10);
    expect(result).toEqual({ wordsLearnedToday: 1, reviewsCompletedToday: 0 });
  });

  it('resets counters on new day with review (not new word)', () => {
    const result = computeDailyCounters(true, false, 5, 10);
    expect(result).toEqual({ wordsLearnedToday: 0, reviewsCompletedToday: 1 });
  });

  it('increments wordsLearnedToday for new word on same day', () => {
    const result = computeDailyCounters(false, true, 3, 7);
    expect(result).toEqual({ wordsLearnedToday: 4, reviewsCompletedToday: 7 });
  });

  it('increments reviewsCompletedToday for review on same day', () => {
    const result = computeDailyCounters(false, false, 3, 7);
    expect(result).toEqual({ wordsLearnedToday: 3, reviewsCompletedToday: 8 });
  });

  it('starts from zero on new day correctly', () => {
    const result = computeDailyCounters(true, true, 0, 0);
    expect(result).toEqual({ wordsLearnedToday: 1, reviewsCompletedToday: 0 });
  });
});

// ─── computeBestScore ───────────────────────────────────────────

describe('computeBestScore', () => {
  it('returns new score when higher than current', () => {
    expect(computeBestScore(50, 75)).toBe(75);
  });

  it('returns current score when new score is lower', () => {
    expect(computeBestScore(80, 60)).toBe(80);
  });

  it('returns current score when scores are equal', () => {
    expect(computeBestScore(50, 50)).toBe(50);
  });

  it('handles zero current score', () => {
    expect(computeBestScore(0, 10)).toBe(10);
  });

  it('handles zero new score', () => {
    expect(computeBestScore(30, 0)).toBe(30);
  });
});

// ─── updateDailyActivity ────────────────────────────────────────

describe('updateDailyActivity', () => {
  it('adds a fresh entry on a previously-empty date', () => {
    const result = updateDailyActivity({}, '2026-05-27', true);
    expect(result).toEqual({ '2026-05-27': { reviews: 0, learned: 1 } });
  });

  it('increments learned for a new word', () => {
    const base = { '2026-05-27': { reviews: 4, learned: 2 } };
    const result = updateDailyActivity(base, '2026-05-27', true);
    expect(result['2026-05-27']).toEqual({ reviews: 4, learned: 3 });
  });

  it('increments reviews for a repeat word', () => {
    const base = { '2026-05-27': { reviews: 4, learned: 2 } };
    const result = updateDailyActivity(base, '2026-05-27', false);
    expect(result['2026-05-27']).toEqual({ reviews: 5, learned: 2 });
  });

  it('preserves entries for other days', () => {
    const base = {
      '2026-05-26': { reviews: 8, learned: 3 },
      '2026-05-27': { reviews: 1, learned: 1 },
    };
    const result = updateDailyActivity(base, '2026-05-27', true);
    expect(result['2026-05-26']).toEqual({ reviews: 8, learned: 3 });
    expect(result['2026-05-27']).toEqual({ reviews: 1, learned: 2 });
  });

  it('does not mutate the input object', () => {
    const base = { '2026-05-27': { reviews: 1, learned: 1 } };
    const snapshot = JSON.stringify(base);
    updateDailyActivity(base, '2026-05-27', true);
    expect(JSON.stringify(base)).toBe(snapshot);
  });
});

describe('toDateKey', () => {
  it('returns YYYY-MM-DD in local timezone', () => {
    // Construct via local-date constructor so the test is TZ-agnostic.
    const d = new Date(2026, 4, 27, 10, 0, 0); // May 27, 2026 10:00 local
    expect(toDateKey(d)).toBe('2026-05-27');
  });

  it('zero-pads single-digit months and days', () => {
    const d = new Date(2026, 0, 3, 9, 0, 0); // Jan 3, 2026
    expect(toDateKey(d)).toBe('2026-01-03');
  });
});
