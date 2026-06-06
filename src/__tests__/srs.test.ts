import { describe, it, expect } from 'vitest';
import { calculateAdaptiveMultiplier, calculateNextReviewState } from '../utils/srs';
import type { UserWord } from '../context/AppContext';
import type { WordData } from '../data/words';
import type { CategoryAccuracyLog } from '../utils/analytics';

// Fixed "today" + dateKey helpers so the time-decay math is deterministic.
const FIXED_TODAY = new Date(2026, 4, 27, 12, 0, 0); // May 27, 2026 local
const todayKey = '2026-05-27';

/** Build a single-bucket accuracy log dated today. Equivalent to the old
 *  Laplace-only signature {Category: {correct, total}} but expressed in
 *  the new time-bucketed shape so existing assertions hold. */
const logToday = (category: string, correct: number, total: number): CategoryAccuracyLog => ({
  [category]: { [todayKey]: { correct, total } },
});

// Minimal word fixture for tests
const makeWord = (overrides?: Partial<WordData>): WordData => ({
  id: 'test-1',
  word: 'TEST',
  meaning: 'A test word',
  hindiTranslation: 'परीक्षा',
  exampleSentence: 'This is a test.',
  synonyms: ['exam'],
  antonyms: ['real'],
  difficulty: 'Medium',
  frequency: 'High',
  examFrequency: { SSC_CGL: 7, UPSC: 5, IBPS_PO: 6 },
  category: 'Vocabulary',
  ...overrides,
});

const makeUserWord = (overrides?: Partial<UserWord>): UserWord => ({
  id: 'test-1',
  easeFactor: 2.5,
  interval: 1,
  repetitions: 1,
  nextReviewDate: new Date().toISOString(),
  status: 'learning',
  ...overrides,
});

// ─── calculateAdaptiveMultiplier ─────────────────────────────────

describe('calculateAdaptiveMultiplier', () => {
  it('returns 1.0 for medium difficulty with balanced stats', () => {
    // All buckets today → no decay. 7/10 correct → smoothed = 8/12 = 0.667 → in [0.6, 0.85] → 1.0
    const result = calculateAdaptiveMultiplier('Vocabulary', 'Medium',
      logToday('Vocabulary', 7, 10), { today: FIXED_TODAY });
    expect(result).toBe(1.0);
  });

  it('returns 0.8 when user struggles in category (low accuracy)', () => {
    // 2/10 → smoothed = 3/12 = 0.25 → < 0.6 → 0.8
    const result = calculateAdaptiveMultiplier('Idioms', 'Medium',
      logToday('Idioms', 2, 10), { today: FIXED_TODAY });
    expect(result).toBe(0.8);
  });

  it('returns 1.2 when user excels in category (high accuracy)', () => {
    // 19/20 → smoothed = 20/22 = 0.909 → > 0.85 → 1.2
    const result = calculateAdaptiveMultiplier('Vocabulary', 'Medium',
      logToday('Vocabulary', 19, 20), { today: FIXED_TODAY });
    expect(result).toBe(1.2);
  });

  it('applies difficulty multiplier for Hard words', () => {
    const result = calculateAdaptiveMultiplier('Vocabulary', 'Hard',
      logToday('Vocabulary', 7, 10), { today: FIXED_TODAY });
    expect(result).toBeCloseTo(0.85);
  });

  it('applies difficulty multiplier for Easy words', () => {
    const result = calculateAdaptiveMultiplier('Vocabulary', 'Easy',
      logToday('Vocabulary', 7, 10), { today: FIXED_TODAY });
    expect(result).toBeCloseTo(1.15);
  });

  it('compounds category struggle + hard difficulty', () => {
    const result = calculateAdaptiveMultiplier('Idioms', 'Hard',
      logToday('Idioms', 2, 10), { today: FIXED_TODAY });
    expect(result).toBeCloseTo(0.8 * 0.85);
  });

  it('uses neutral Laplace prior for empty log', () => {
    // No data → rate = 0.5 → < 0.6 → 0.8
    const result = calculateAdaptiveMultiplier('Vocabulary', 'Medium', {}, { today: FIXED_TODAY });
    expect(result).toBe(0.8);
  });

  it('uses neutral Laplace prior for a category with no buckets', () => {
    const result = calculateAdaptiveMultiplier('Phrasal Verbs', 'Medium',
      logToday('Vocabulary', 10, 10), { today: FIXED_TODAY });
    expect(result).toBe(0.8);
  });

  // ─── Time-decay-specific behavior (LocII Tier 1.1) ──────────────

  it('weights recent buckets more than ancient ones (recovery)', () => {
    // 28-day-old buckets (weight ≈ 0.25) say 0/10. Today's bucket says 10/10.
    // Recent perfect performance should now dominate → no struggle signal.
    const accuracyLog: CategoryAccuracyLog = {
      Idioms: {
        '2026-04-29': { correct: 0, total: 10 }, // 28 days ago
        [todayKey]: { correct: 10, total: 10 },
      },
    };
    const result = calculateAdaptiveMultiplier('Idioms', 'Medium', accuracyLog,
      { today: FIXED_TODAY, halfLifeDays: 14 });
    // Weighted: 0.25 * (0 correct, 10 total) + 1.0 * (10, 10) ≈ rate (10 + 1)/(12.5 + 2) ≈ 0.76 → 1.0
    expect(result).toBe(1.0);
  });

  it('weights recent failures more (regression detection)', () => {
    // Ancient great history shouldn't mask a sudden recent collapse.
    const accuracyLog: CategoryAccuracyLog = {
      Idioms: {
        '2026-04-29': { correct: 10, total: 10 }, // 28 days ago, weight 0.25
        [todayKey]: { correct: 0, total: 10 },     // today, full weight
      },
    };
    const result = calculateAdaptiveMultiplier('Idioms', 'Medium', accuracyLog,
      { today: FIXED_TODAY, halfLifeDays: 14 });
    // Weighted (0 + 0.25*10 + 1)/(10 + 0.25*10 + 2) ≈ 3.5/14.5 ≈ 0.24 → 0.8
    expect(result).toBe(0.8);
  });

  it('treats a single dated bucket the same as the legacy aggregate would', () => {
    // Sanity: when all data is "today", time-weighted result equals
    // plain Laplace, so backward-compat reasoning still works.
    const plain = calculateAdaptiveMultiplier('Vocabulary', 'Medium',
      logToday('Vocabulary', 5, 10), { today: FIXED_TODAY });
    // 5/10 → smoothed 6/12 = 0.5 → < 0.6 → 0.8
    expect(plain).toBe(0.8);
  });

  // ─── Response-time integration (LocII Tier 2.1) ─────────────────

  it('omitting responseTimeMs keeps the legacy behavior (neutral 1.0 factor)', () => {
    const noLatency = calculateAdaptiveMultiplier('Vocabulary', 'Medium',
      logToday('Vocabulary', 7, 10), { today: FIXED_TODAY });
    const explicitNeutral = calculateAdaptiveMultiplier('Vocabulary', 'Medium',
      logToday('Vocabulary', 7, 10), { today: FIXED_TODAY, responseTimeMs: 1000 });
    expect(noLatency).toBe(1.0);
    expect(explicitNeutral).toBe(1.0); // 1.0 * 1.0 * 1.0
  });

  it('moderate response time (3–8s) shrinks the multiplier by 0.9x', () => {
    const result = calculateAdaptiveMultiplier('Vocabulary', 'Medium',
      logToday('Vocabulary', 7, 10), { today: FIXED_TODAY, responseTimeMs: 5000 });
    // 1.0 * 1.0 * 0.9 = 0.9
    expect(result).toBeCloseTo(0.9);
  });

  it('hesitant response time (>= 8s) shrinks the multiplier by 0.75x', () => {
    const result = calculateAdaptiveMultiplier('Vocabulary', 'Medium',
      logToday('Vocabulary', 7, 10), { today: FIXED_TODAY, responseTimeMs: 12000 });
    expect(result).toBeCloseTo(0.75);
  });

  it('compounds with category struggle + difficulty', () => {
    // Struggling (0.8) × Hard (0.85) × hesitant (0.75) ≈ 0.51
    const result = calculateAdaptiveMultiplier('Idioms', 'Hard',
      logToday('Idioms', 2, 10),
      { today: FIXED_TODAY, responseTimeMs: 12000 });
    expect(result).toBeCloseTo(0.8 * 0.85 * 0.75);
  });

  it('compounds favourably with excellence + ease + confidence', () => {
    // Excelling (1.2) × Easy (1.15) × confident (1.0) = 1.38
    const result = calculateAdaptiveMultiplier('Vocabulary', 'Easy',
      logToday('Vocabulary', 19, 20),
      { today: FIXED_TODAY, responseTimeMs: 1000 });
    expect(result).toBeCloseTo(1.2 * 1.15 * 1.0);
  });
});

// ─── calculateNextReviewState ────────────────────────────────────

describe('calculateNextReviewState', () => {
  const word = makeWord();

  describe('new word (no prior state)', () => {
    it('sets interval=1 and reps=1 on first correct (quality=4)', () => {
      const result = calculateNextReviewState(word, undefined, 4, 1.0);
      expect(result.interval).toBe(1);
      expect(result.repetitions).toBe(1);
      expect(result.status).toBe('learning');
    });

    it('resets to 0 interval on incorrect (quality=0)', () => {
      const result = calculateNextReviewState(word, undefined, 0, 1.0);
      expect(result.interval).toBe(0);
      expect(result.repetitions).toBe(0);
      expect(result.status).toBe('learning');
    });

    it('applies multiplier to first correct interval', () => {
      const result = calculateNextReviewState(word, undefined, 4, 0.8);
      // 1 * 0.8 = 0.8 → rounded to max(1, round(0.8)) = 1
      expect(result.interval).toBe(1);
    });
  });

  describe('second review (reps=1)', () => {
    it('jumps to interval=6 on correct', () => {
      const state = makeUserWord({ repetitions: 1, interval: 1 });
      const result = calculateNextReviewState(word, state, 4, 1.0);
      expect(result.interval).toBe(6);
      expect(result.repetitions).toBe(2);
      expect(result.status).toBe('reviewing');
    });

    it('applies multiplier to interval=6', () => {
      const state = makeUserWord({ repetitions: 1, interval: 1 });
      const result = calculateNextReviewState(word, state, 4, 1.2);
      // 6 * 1.2 = 7.2 → round = 7
      expect(result.interval).toBe(7);
    });
  });

  describe('subsequent reviews (reps > 1)', () => {
    it('multiplies interval by easeFactor', () => {
      const state = makeUserWord({ repetitions: 2, interval: 6, easeFactor: 2.5 });
      const result = calculateNextReviewState(word, state, 4, 1.0);
      // 6 * 2.5 * 1.0 = 15
      expect(result.interval).toBe(15);
      expect(result.repetitions).toBe(3);
    });

    it('applies adaptive multiplier on top of easeFactor', () => {
      const state = makeUserWord({ repetitions: 2, interval: 6, easeFactor: 2.5 });
      const result = calculateNextReviewState(word, state, 4, 0.8);
      // 6 * 2.5 * 0.8 = 12
      expect(result.interval).toBe(12);
    });
  });

  describe('incorrect answer resets', () => {
    it('resets reps and interval on quality=0', () => {
      const state = makeUserWord({ repetitions: 5, interval: 30, easeFactor: 2.5 });
      const result = calculateNextReviewState(word, state, 0, 1.0);
      expect(result.interval).toBe(0);
      expect(result.repetitions).toBe(0);
    });

    it('resets reps and interval on quality=2', () => {
      const state = makeUserWord({ repetitions: 3, interval: 15, easeFactor: 2.5 });
      const result = calculateNextReviewState(word, state, 2, 1.0);
      expect(result.interval).toBe(0);
      expect(result.repetitions).toBe(0);
    });
  });

  describe('ease factor adjustment', () => {
    it('increases ease factor for quality=5 (easy)', () => {
      const state = makeUserWord({ easeFactor: 2.5 });
      const result = calculateNextReviewState(word, state, 5, 1.0);
      // EF = 2.5 + (0.1 - 0*(0.08+0*0.02)) = 2.5 + 0.1 = 2.6
      expect(result.easeFactor).toBeCloseTo(2.6);
    });

    it('decreases ease factor for quality=3 (hard)', () => {
      const state = makeUserWord({ easeFactor: 2.5 });
      const result = calculateNextReviewState(word, state, 3, 1.0);
      // EF = 2.5 + (0.1 - 2*(0.08+2*0.02)) = 2.5 + (0.1 - 2*0.12) = 2.5 + (0.1 - 0.24) = 2.36
      expect(result.easeFactor).toBeCloseTo(2.36);
    });

    it('heavily decreases ease factor for quality=0', () => {
      const state = makeUserWord({ easeFactor: 2.5 });
      const result = calculateNextReviewState(word, state, 0, 1.0);
      // EF = 2.5 + (0.1 - 5*(0.08+5*0.02)) = 2.5 + (0.1 - 5*0.18) = 2.5 + (0.1 - 0.9) = 1.7
      expect(result.easeFactor).toBeCloseTo(1.7);
    });

    it('floors ease factor at 1.3', () => {
      const state = makeUserWord({ easeFactor: 1.3 });
      const result = calculateNextReviewState(word, state, 0, 1.0);
      // Would drop below 1.3 → clamped to 1.3
      expect(result.easeFactor).toBe(1.3);
    });
  });

  describe('status transitions', () => {
    it('returns "learning" for first correct answer', () => {
      const result = calculateNextReviewState(word, undefined, 4, 1.0);
      expect(result.status).toBe('learning');
    });

    it('returns "reviewing" when reps > 1', () => {
      const state = makeUserWord({ repetitions: 1, interval: 1 });
      const result = calculateNextReviewState(word, state, 4, 1.0);
      expect(result.status).toBe('reviewing');
    });

    it('returns "mastered" when interval > 30 and reps > 5', () => {
      const state = makeUserWord({ repetitions: 5, interval: 31, easeFactor: 2.5 });
      const result = calculateNextReviewState(word, state, 5, 1.0);
      // interval = round(31 * 2.5 * 1.0) = 78, reps = 6
      expect(result.status).toBe('mastered');
      expect(result.interval).toBeGreaterThan(30);
      expect(result.repetitions).toBeGreaterThan(5);
    });

    it('drops from mastered back to learning on incorrect', () => {
      const state = makeUserWord({ repetitions: 6, interval: 60, status: 'mastered' });
      const result = calculateNextReviewState(word, state, 0, 1.0);
      expect(result.status).toBe('learning');
      expect(result.repetitions).toBe(0);
    });
  });

  describe('minimum interval enforcement', () => {
    it('enforces minimum 1-day interval on correct answers', () => {
      // With a very low multiplier that would produce sub-1 interval
      const result = calculateNextReviewState(word, undefined, 3, 0.1);
      // 1 * 0.1 = 0.1 → max(1, round(0.1)) = 1
      expect(result.interval).toBeGreaterThanOrEqual(1);
    });
  });

  // ─── Asymmetric LocII floor ────────────────────────────────────
  // When the user is doing well (multiplier >= 1.0), intervals must
  // grow monotonically. When LocII signals struggle (multiplier < 1.0),
  // contraction is allowed down to a 1-day floor.

  describe('asymmetric LocII floor', () => {
    it('enforces monotonic growth when multiplier >= 1.0', () => {
      // 6 * 2.5 * 1.0 = 15 → grows from 6 ✓
      const state = makeUserWord({ repetitions: 2, interval: 6, easeFactor: 2.5 });
      const result = calculateNextReviewState(word, state, 4, 1.0);
      expect(result.interval).toBeGreaterThan(state.interval);
    });

    it('allows contraction when multiplier < 1.0', () => {
      // Without contraction the floor would force interval >= 11.
      // With LocII signaling struggle, 10 * 2.0 * 0.4 = 8 should be allowed.
      const state = makeUserWord({ repetitions: 3, interval: 10, easeFactor: 2.0 });
      const result = calculateNextReviewState(word, state, 3, 0.4);
      // 10 * 2.0 * 0.4 = 8 → contracted (less than prev interval of 10)
      expect(result.interval).toBe(8);
      expect(result.interval).toBeLessThan(state.interval);
    });

    it('contraction never drops below 1 day', () => {
      // Heavy contraction signal should still leave at least 1 day.
      const state = makeUserWord({ repetitions: 3, interval: 4, easeFactor: 1.3 });
      const result = calculateNextReviewState(word, state, 3, 0.1);
      // 4 * 1.3 * 0.1 = 0.52 → max(1, round) = 1
      expect(result.interval).toBe(1);
    });

    it('ceiling of 365 days still applies under any multiplier', () => {
      const state = makeUserWord({ repetitions: 10, interval: 300, easeFactor: 2.5 });
      const result = calculateNextReviewState(word, state, 5, 1.2);
      // 300 * 2.5 * 1.2 = 900 → capped at 365
      expect(result.interval).toBe(365);
    });
  });
});
