import { describe, it, expect } from 'vitest';
import { calculateAdaptiveMultiplier, calculateNextReviewState } from '../utils/srs';
import type { UserWord } from '../context/AppContext';
import type { WordData } from '../data/words';

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
    // 7/10 correct → smoothed = 8/12 = 0.667 → between 0.6 and 0.85 → multiplier 1.0
    const result = calculateAdaptiveMultiplier('Vocabulary', 'Medium', {
      Vocabulary: { correct: 7, total: 10 },
    });
    expect(result).toBe(1.0);
  });

  it('returns 0.8 when user struggles in category (low accuracy)', () => {
    // 2/10 correct → smoothed = 3/12 = 0.25 → < 0.6 → 0.8
    const result = calculateAdaptiveMultiplier('Idioms', 'Medium', {
      Idioms: { correct: 2, total: 10 },
    });
    expect(result).toBe(0.8);
  });

  it('returns 1.2 when user excels in category (high accuracy)', () => {
    // 19/20 correct → smoothed = 20/22 = 0.909 → > 0.85 → 1.2
    const result = calculateAdaptiveMultiplier('Vocabulary', 'Medium', {
      Vocabulary: { correct: 19, total: 20 },
    });
    expect(result).toBe(1.2);
  });

  it('applies difficulty multiplier for Hard words', () => {
    // Balanced accuracy (1.0) * Hard difficulty (0.85) = 0.85
    const result = calculateAdaptiveMultiplier('Vocabulary', 'Hard', {
      Vocabulary: { correct: 7, total: 10 },
    });
    expect(result).toBeCloseTo(0.85);
  });

  it('applies difficulty multiplier for Easy words', () => {
    // Balanced accuracy (1.0) * Easy difficulty (1.15) = 1.15
    const result = calculateAdaptiveMultiplier('Vocabulary', 'Easy', {
      Vocabulary: { correct: 7, total: 10 },
    });
    expect(result).toBeCloseTo(1.15);
  });

  it('compounds category struggle + hard difficulty', () => {
    // Low accuracy (0.8) * Hard (0.85) = 0.68
    const result = calculateAdaptiveMultiplier('Idioms', 'Hard', {
      Idioms: { correct: 2, total: 10 },
    });
    expect(result).toBeCloseTo(0.8 * 0.85);
  });

  it('uses Laplace smoothing for empty stats', () => {
    // No data → smoothed = 1/2 = 0.5 → < 0.6 → 0.8
    const result = calculateAdaptiveMultiplier('Vocabulary', 'Medium', {});
    expect(result).toBe(0.8);
  });

  it('uses Laplace smoothing for missing category', () => {
    const result = calculateAdaptiveMultiplier('Phrasal Verbs', 'Medium', {
      Vocabulary: { correct: 10, total: 10 },
    });
    // Phrasal Verbs not in stats → smoothed = 1/2 = 0.5 → 0.8
    expect(result).toBe(0.8);
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
});
