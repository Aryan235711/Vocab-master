import { UserWord } from '../context/AppContext';
import { WordData } from '../data/words';
import { addDays } from 'date-fns';
import {
  computeTimeWeightedRate,
  responseTimeMultiplier,
  type CategoryAccuracyLog,
} from './analytics';

/**
 * Calculates adaptive modifiers based on user performance in specific word
 * categories, the inherent difficulty of the word, and the user's response
 * latency on the most recent answer.
 *
 * LocII Tier 1.1: the category rate is computed via exponential decay over
 * per-day buckets (14-day half-life — recent reviews count more).
 * LocII Tier 2.1: an optional response-time signal compounds with the
 * category + difficulty factors. A slow correct answer is still a weaker
 * signal than an instant correct one.
 *
 * @param category   Category of the word (e.g., 'Vocabulary', 'Idioms')
 * @param difficulty Inherent difficulty label
 * @param accuracyLog Per-category per-day buckets ({ category: { dateKey: {correct, total} } })
 * @param options.today reference date for decay (default: now)
 * @param options.halfLifeDays days until a bucket's weight halves (default 14)
 * @param options.responseTimeMs time from card-shown to rating-tapped, in ms.
 *        Omit to neutralise the response-time factor (default behaviour for
 *        callers that don't measure latency, e.g. game-mode reviews).
 * @returns Multiplier to inject into the SM-2 interval calculation
 */
export function calculateAdaptiveMultiplier(
  category: string,
  difficulty: string,
  accuracyLog: CategoryAccuracyLog,
  options: {
    today?: Date;
    halfLifeDays?: number;
    responseTimeMs?: number;
  } = {}
): number {
  const today = options.today ?? new Date();
  const halfLifeDays = options.halfLifeDays ?? 14;

  // Time-weighted Laplace-smoothed rate for this category.
  const smoothedRate = computeTimeWeightedRate(
    accuracyLog[category],
    today,
    halfLifeDays
  );

  // LocII (Locally Integrated Intelligence) Engine: dynamically alters the
  // spacing interval based on weighted accuracy in this specific category.
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

  // Response-time modifier — only applied when the caller measured it.
  // Game-mode reviews etc. omit the signal and get a neutral 1.0x.
  const responseMultiplier =
    typeof options.responseTimeMs === 'number'
      ? responseTimeMultiplier(options.responseTimeMs)
      : 1.0;

  return lociiMultiplier * difficultyMultiplier * responseMultiplier;
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
    
    // Safety Net 1: Asymmetric floor.
    // When LocII signals "user is doing fine here" (multiplier >= 1.0), enforce
    // monotonic growth — prevents tiny EF-decay jitter from shrinking a stable
    // interval. When LocII signals struggle (multiplier < 1.0), allow the
    // interval to contract down to 1 day so the LocII brake actually bites.
    if (overallMultiplier >= 1.0) {
      interval = Math.max(current.interval + 1, Math.round(interval));
    } else {
      interval = Math.max(1, Math.round(interval));
    }

    // Safety Net 2: Ceiling
    // Cap the maximum interval at 365 days to ensure mastered words are checked annually
    interval = Math.min(interval, 365);
    
    repetitions += 1;
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
