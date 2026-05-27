import { test, expect } from '@playwright/test';
import { calculateAdaptiveMultiplier, calculateNextReviewState } from '../../src/utils/srs';
import { WordData } from '../../src/data/words';
import { UserWord } from '../../src/context/AppContext';

test.describe('Tier 1: SRS Engine Mathematical Audit', () => {

  const mockWord: WordData = {
    id: 'test-word-1',
    word: 'OBFUSCATE',
    meaning: 'To confuse',
    category: 'Vocabulary',
    difficulty: 'Hard',
    hindiTranslation: '',
    synonyms: [],
    antonyms: [],
    exampleSentence: '',
    etymology: '',
    frequency: 'High',
    examFrequency: { 'SSC_CGL': 8 }
  };

  test('Struggling user: LocII contracts intervals but they stay in valid bounds', () => {
    const strugglingStats = { 'Vocabulary': { correct: 2, total: 10 } };
    const overallMultiplier = calculateAdaptiveMultiplier(mockWord.category, mockWord.difficulty, strugglingStats);
    expect(overallMultiplier).toBeLessThan(1.0);

    let currentState: UserWord | undefined = undefined;

    for (let i = 0; i < 50; i++) {
      const nextState = calculateNextReviewState(mockWord, currentState, 3, overallMultiplier);
      // Sanity rails always hold
      expect(nextState.easeFactor).toBeGreaterThanOrEqual(1.3);
      expect(nextState.interval).toBeGreaterThanOrEqual(1);
      expect(nextState.interval).toBeLessThanOrEqual(365);
      currentState = { id: mockWord.id, ...nextState };
    }
  });

  test('Best-case scenario: Interval caps at 365 days to ensure annual checkups', () => {
    const excellingStats = { 'Vocabulary': { correct: 20, total: 20 } };
    const easyWord: WordData = { ...mockWord, difficulty: 'Easy' };
    const overallMultiplier = calculateAdaptiveMultiplier(easyWord.category, easyWord.difficulty, excellingStats);
    expect(overallMultiplier).toBeGreaterThan(1.0);

    let currentState: UserWord | undefined = undefined;

    for (let i = 0; i < 20; i++) {
      const nextState = calculateNextReviewState(easyWord, currentState, 5, overallMultiplier);
      expect(nextState.interval).toBeLessThanOrEqual(365);
      currentState = { id: easyWord.id, ...nextState };
    }
    expect(currentState?.interval).toBe(365);
  });
});
