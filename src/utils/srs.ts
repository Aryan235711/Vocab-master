import { UserWord } from '../context/AppContext';
import { WordData } from '../data/words';
import { addDays } from 'date-fns';

/**
 * Calculates adaptive modifiers based on user performance in specific word categories
 * and the inherent difficulty of the word itself.
 * 
 * @param category The category of the word (e.g., 'Vocabulary', 'Idioms')
 * @param difficulty The generic difficulty level of the word
 * @param categoryStats The user's historical performance statistics across categories
 * @returns A multiplier to adjust the Spaced Repetition interval
 */
export function calculateAdaptiveMultiplier(
  category: string,
  difficulty: string,
  categoryStats: Record<string, { correct: number; total: number }>
): number {
  const catStats = categoryStats[category] || { correct: 0, total: 0 };
  
  // Laplace smoothing to prevent extreme jumps initially
  const smoothedRate = (catStats.correct + 1) / (catStats.total + 2);

  // LocII (Locally Integrated Intelligence) Engine:
  // Dynamically alters the spacing interval based on how well the user performs in this SPECIFIC category
  let lociiMultiplier = 1.0;
  if (smoothedRate < 0.6) {
    lociiMultiplier = 0.8; // User struggles here; decrease interval (increase frequency)
  } else if (smoothedRate > 0.85) {
    lociiMultiplier = 1.2; // User excels here; increase interval (decrease frequency)
  }

  // Difficulty Modifier
  let difficultyMultiplier = 1.0;
  if (difficulty === 'Hard') difficultyMultiplier = 0.85;
  else if (difficulty === 'Easy') difficultyMultiplier = 1.15;

  return lociiMultiplier * difficultyMultiplier;
}

/**
 * Performs a modified SuperMemo-2 (SM-2) algorithm step enriched with LocII (Locally Integrated Intelligence).
 * 
 * @param word The word being reviewed
 * @param currentWordState The user's current progression state for this word
 * @param quality Score from 0 (Blackout) to 5 (Perfect Response)
 * @param overallMultiplier The adaptive multiplier returned by `calculateAdaptiveMultiplier`
 */
export function calculateNextReviewState(
  word: WordData,
  currentWordState: UserWord | undefined,
  quality: number,
  overallMultiplier: number
): Omit<UserWord, 'id'> {
  // Initialize state if learning for the first time
  const initialState = {
    easeFactor: 2.5,
    interval: 0,
    repetitions: 0,
    nextReviewDate: new Date().toISOString(),
    status: 'new' as const
  };

  const current = currentWordState || initialState;
  let { easeFactor, interval, repetitions } = current;

  // Quality < 3 signifies incorrect answer
  if (quality < 3) {
    repetitions = 0;
    interval = 0; 
  } else {
    // Correct answer progression
    if (repetitions === 0) {
      interval = 1 * overallMultiplier;
    } else if (repetitions === 1) {
      interval = 6 * overallMultiplier;
    } else {
      interval = Math.round(interval * easeFactor * overallMultiplier);
    }
    repetitions += 1;
    // Enforce a minimum interval of 1 day for correct answers
    interval = Math.max(1, Math.round(interval));
  }

  // Adjust Ease Factor based on quality rating
  easeFactor = easeFactor + (0.1 - (5 - quality) * (0.08 + (5 - quality) * 0.02));
  if (easeFactor < 1.3) easeFactor = 1.3;

  // Calculate next review timestamp
  let nextReviewDate = addDays(new Date(), interval).toISOString();
  if (quality < 3) {
    nextReviewDate = new Date().toISOString(); // Due immediately if incorrect
  }

  // Determine categorical status
  let status: 'new' | 'learning' | 'reviewing' | 'mastered' = 'learning';
  if (interval > 30 && repetitions > 5) {
    status = 'mastered';
  } else if (repetitions > 1) {
    status = 'reviewing';
  }

  return {
    easeFactor,
    interval,
    repetitions,
    nextReviewDate,
    status
  };
}
