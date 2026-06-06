import { describe, it, expect } from 'vitest';
import {
  computeLevel,
  computeStreak,
  checkStreakBreak,
  computeDailyCounters,
  computeBestScore,
  updateDailyActivity,
  toDateKey,
  detectSessionFatigue,
  updateCategoryAccuracyLog,
  computeTimeWeightedRate,
  responseTimeMultiplier,
  observedDifficulty,
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

// ─── detectSessionFatigue (LocII Tier 1.2) ──────────────────────

describe('detectSessionFatigue', () => {
  it('stays quiet until there are at least 2× windowSize answers', () => {
    // 9 answers, all correct, windowSize=5 → not enough for two windows
    const r = detectSessionFatigue([5, 5, 5, 5, 5, 5, 5, 5, 5]);
    expect(r.fatigued).toBe(false);
    expect(r.dropPercent).toBe(0);
  });

  it('does NOT fatigue when accuracy stays high throughout', () => {
    const r = detectSessionFatigue([5, 4, 5, 4, 5, 4, 5, 4, 5, 4]);
    expect(r.fatigued).toBe(false);
    expect(r.earlyAccuracy).toBe(1);
    expect(r.recentAccuracy).toBe(1);
  });

  it('does NOT fatigue when accuracy is consistently mediocre', () => {
    // 60% throughout — no drop, no signal.
    const r = detectSessionFatigue([5, 5, 5, 0, 0, 5, 5, 5, 0, 0]);
    expect(r.earlyAccuracy).toBeCloseTo(0.6);
    expect(r.recentAccuracy).toBeCloseTo(0.6);
    expect(r.fatigued).toBe(false);
  });

  it('fatigues when late-window accuracy drops below threshold', () => {
    // Early: 5/5 correct = 100%. Recent: 1/5 correct = 20%. Drop = 80pts.
    const r = detectSessionFatigue([5, 5, 5, 5, 5, 0, 0, 0, 0, 5]);
    expect(r.fatigued).toBe(true);
    expect(r.earlyAccuracy).toBe(1);
    expect(r.recentAccuracy).toBeCloseTo(0.2);
    expect(r.dropPercent).toBeCloseTo(80);
  });

  it('does NOT fatigue when the drop is below the threshold', () => {
    // Early: 100%. Recent: 90% (4/5). Drop = 10pts < 15pts default.
    const r = detectSessionFatigue(
      [5, 5, 5, 5, 5, 5, 5, 5, 5, 0],
      5,
      0.15
    );
    expect(r.dropPercent).toBeCloseTo(20);
    // (with 5,5,5,5,5 vs 5,5,5,5,0 → 100% vs 80% = 20pt drop, still > 15pt threshold)
    expect(r.fatigued).toBe(true);
  });

  it('respects a stricter threshold parameter', () => {
    // Same data as above but with threshold raised to 25pts — should NOT fatigue.
    const r = detectSessionFatigue(
      [5, 5, 5, 5, 5, 5, 5, 5, 5, 0],
      5,
      0.25
    );
    expect(r.fatigued).toBe(false);
  });

  it('recovers (no signal) when recent answers bounce back', () => {
    // Initial dip, then full recovery in the recent window.
    const r = detectSessionFatigue([5, 5, 5, 5, 5, 0, 0, 5, 5, 5, 5, 5]);
    expect(r.recentAccuracy).toBe(1);
    expect(r.fatigued).toBe(false);
  });

  it('handles single-window quality signals correctly with a custom window size', () => {
    // windowSize=3, need 6 answers minimum.
    const r = detectSessionFatigue([5, 5, 5, 0, 0, 0], 3, 0.15);
    expect(r.earlyAccuracy).toBe(1);
    expect(r.recentAccuracy).toBe(0);
    expect(r.fatigued).toBe(true);
  });
});

// ─── updateCategoryAccuracyLog (LocII Tier 1.1) ─────────────────

describe('updateCategoryAccuracyLog', () => {
  it('creates a new category bucket on first write', () => {
    const result = updateCategoryAccuracyLog({}, 'Vocabulary', '2026-05-27', true);
    expect(result).toEqual({
      Vocabulary: { '2026-05-27': { correct: 1, total: 1 } },
    });
  });

  it('increments correct only when isCorrect=true', () => {
    let log = updateCategoryAccuracyLog({}, 'Idioms', '2026-05-27', true);
    log = updateCategoryAccuracyLog(log, 'Idioms', '2026-05-27', false);
    log = updateCategoryAccuracyLog(log, 'Idioms', '2026-05-27', true);
    expect(log.Idioms['2026-05-27']).toEqual({ correct: 2, total: 3 });
  });

  it('keeps separate buckets per day within the same category', () => {
    let log = updateCategoryAccuracyLog({}, 'Vocabulary', '2026-05-26', true);
    log = updateCategoryAccuracyLog(log, 'Vocabulary', '2026-05-27', false);
    expect(log.Vocabulary['2026-05-26']).toEqual({ correct: 1, total: 1 });
    expect(log.Vocabulary['2026-05-27']).toEqual({ correct: 0, total: 1 });
  });

  it('keeps separate categories independent', () => {
    let log = updateCategoryAccuracyLog({}, 'Vocabulary', '2026-05-27', true);
    log = updateCategoryAccuracyLog(log, 'Idioms', '2026-05-27', false);
    expect(log.Vocabulary['2026-05-27']).toEqual({ correct: 1, total: 1 });
    expect(log.Idioms['2026-05-27']).toEqual({ correct: 0, total: 1 });
  });

  it('does not mutate the input', () => {
    const base = { Vocabulary: { '2026-05-27': { correct: 1, total: 1 } } };
    const snapshot = JSON.stringify(base);
    updateCategoryAccuracyLog(base, 'Vocabulary', '2026-05-27', true);
    expect(JSON.stringify(base)).toBe(snapshot);
  });
});

// ─── computeTimeWeightedRate (LocII Tier 1.1) ───────────────────

describe('computeTimeWeightedRate', () => {
  const TODAY = new Date(2026, 4, 27, 12, 0, 0); // May 27, 2026 local

  it('returns the neutral Laplace prior (0.5) on an empty bucket map', () => {
    expect(computeTimeWeightedRate(undefined, TODAY)).toBe(0.5);
    expect(computeTimeWeightedRate({}, TODAY)).toBe(0.5);
  });

  it('reproduces the unweighted Laplace rate when all data is today', () => {
    // weight = 0.5^0 = 1 → matches the plain rate formula
    const rate = computeTimeWeightedRate(
      { '2026-05-27': { correct: 7, total: 10 } },
      TODAY
    );
    expect(rate).toBeCloseTo((7 + 1) / (10 + 2));
  });

  it('decays older buckets exponentially per half-life', () => {
    // 14-day-old bucket should weigh 0.5, today's full weight.
    const rate = computeTimeWeightedRate(
      {
        '2026-05-13': { correct: 0, total: 10 }, // 14 days ago, weight 0.5
        '2026-05-27': { correct: 10, total: 10 },
      },
      TODAY,
      14
    );
    // Weighted correct = 10. Weighted total = 5 + 10 = 15.
    // Smoothed = (10 + 1)/(15 + 2) ≈ 0.647
    expect(rate).toBeCloseTo(11 / 17, 3);
  });

  it('ancient mistakes barely move the needle', () => {
    // 84-day-old (6 half-lives) bucket weighs 1/64 ≈ 0.0156.
    const rate = computeTimeWeightedRate(
      {
        '2026-03-04': { correct: 0, total: 100 }, // 84 days ago
        '2026-05-27': { correct: 10, total: 10 },
      },
      TODAY,
      14
    );
    // Weighted correct ≈ 10. Weighted total ≈ 10 + 100*0.0156 ≈ 11.56.
    // Smoothed ≈ 11/13.56 ≈ 0.81 → still in "excels" range
    expect(rate).toBeGreaterThan(0.75);
  });

  it('clamps negative ages to zero (future buckets get full weight, not extrapolated)', () => {
    const future = new Date(2026, 5, 10, 12, 0, 0); // June 10
    const rate = computeTimeWeightedRate(
      { '2026-06-15': { correct: 0, total: 10 } }, // 5 days in the future
      future,
      14
    );
    // Future bucket should be treated as "today" (weight 1), not amplified.
    // weighted correct = 0, weighted total = 10. Smoothed = 1/12 ≈ 0.083
    expect(rate).toBeCloseTo(1 / 12, 3);
  });
});

// ─── responseTimeMultiplier (LocII Tier 2.1) ────────────────────

describe('responseTimeMultiplier', () => {
  it('returns 1.0 in the confident band (< 3s)', () => {
    expect(responseTimeMultiplier(0)).toBe(1.0);
    expect(responseTimeMultiplier(500)).toBe(1.0);
    expect(responseTimeMultiplier(2999)).toBe(1.0);
  });

  it('returns 0.9 in the moderate band (3s-8s)', () => {
    expect(responseTimeMultiplier(3000)).toBe(0.9);
    expect(responseTimeMultiplier(5500)).toBe(0.9);
    expect(responseTimeMultiplier(7999)).toBe(0.9);
  });

  it('returns 0.75 in the hesitant band (>= 8s)', () => {
    expect(responseTimeMultiplier(8000)).toBe(0.75);
    expect(responseTimeMultiplier(15000)).toBe(0.75);
    expect(responseTimeMultiplier(60_000)).toBe(0.75);
  });

  it('respects custom threshold parameters', () => {
    expect(responseTimeMultiplier(4500, { confidentMs: 5000, hesitantMs: 12000 })).toBe(1.0);
    expect(responseTimeMultiplier(8000, { confidentMs: 5000, hesitantMs: 12000 })).toBe(0.9);
    expect(responseTimeMultiplier(15000, { confidentMs: 5000, hesitantMs: 12000 })).toBe(0.75);
  });

  it('falls back to neutral 1.0 on negative or NaN input (no amplification)', () => {
    expect(responseTimeMultiplier(-100)).toBe(1.0);
    expect(responseTimeMultiplier(NaN)).toBe(1.0);
  });
});

// ─── observedDifficulty (LocII Tier 2.3) ────────────────────────

describe('observedDifficulty', () => {
  it('returns null below the minimum sample size', () => {
    // 4 reviews, all perfect 5s — still too few to override.
    expect(observedDifficulty(20, 4)).toBeNull();
    // Edge: 0 reviews.
    expect(observedDifficulty(0, 0)).toBeNull();
  });

  it('returns Easy when average quality is >= 4.0 (mostly 4s and 5s)', () => {
    expect(observedDifficulty(25, 5)).toBe('Easy');   // 5.0
    expect(observedDifficulty(20, 5)).toBe('Easy');   // 4.0
    expect(observedDifficulty(45, 10)).toBe('Easy');  // 4.5
  });

  it('returns Medium when average is in [3.0, 4.0)', () => {
    expect(observedDifficulty(15, 5)).toBe('Medium'); // 3.0
    expect(observedDifficulty(18, 5)).toBe('Medium'); // 3.6
    expect(observedDifficulty(19.9, 5)).toBe('Medium'); // 3.98
  });

  it('returns Hard when average is < 3.0 (frequent lapses)', () => {
    expect(observedDifficulty(14, 5)).toBe('Hard'); // 2.8
    expect(observedDifficulty(0, 5)).toBe('Hard');  // 0.0 — total blackouts
    expect(observedDifficulty(10, 5)).toBe('Hard'); // 2.0
  });

  it('respects a custom minReviews threshold', () => {
    // Lower the bar to 3 reviews — sum=10 / 3 ≈ 3.33 → Medium.
    expect(observedDifficulty(10, 3, 3)).toBe('Medium');
    // Raise the bar to 10 — even 5 perfect reviews don't qualify.
    expect(observedDifficulty(25, 5, 10)).toBeNull();
  });

  it('treats the 4.0 and 3.0 boundaries as inclusive lower bounds', () => {
    // Exactly 4.0 → Easy (>= 4.0)
    expect(observedDifficulty(20, 5)).toBe('Easy');
    // Exactly 3.0 → Medium (>= 3.0)
    expect(observedDifficulty(15, 5)).toBe('Medium');
  });
});
