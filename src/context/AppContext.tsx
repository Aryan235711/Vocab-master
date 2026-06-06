/**
 * @file AppContext.tsx
 * @description Centralized state management for vocabulary, user progress, and LocII
 * (Locally Integrated Intelligence) algorithm logic.
 */

import React, { createContext, useContext, useEffect, useState } from 'react';
import { WordData, INITIAL_WORDS, loadFullDictionary, getExamFrequency } from '../data/words';
import { isBefore, isSameDay, startOfDay } from 'date-fns';
import { calculateAdaptiveMultiplier, calculateNextReviewState } from '../utils/srs';
import {
  computeLevel,
  computeStreak,
  checkStreakBreak,
  computeDailyCounters,
  computeBestScore,
  updateDailyActivity,
  toDateKey,
  updateCategoryAccuracyLog,
  observedDifficulty,
  type DailyActivityEntry,
  type CategoryAccuracyLog,
} from '../utils/analytics';

/**
 * Aggregates all user performance, metrics, and application engagement data.
 */
export interface UserStats {
  xp: number; // Experience points earned by playing games and completing reviews
  streak: number; // Current day consistency streak
  lastStudyDate: string | null; // ISO string to track breaking streaks
  wordsLearnedToday: number; // Count of newly interacted words
  reviewsCompletedToday: number; // Count of mature reviews processed today
  level: number; // Derived dynamically from XP
  bestScores: Record<string, number>; // High scores across minigames
  categoryStats: Record<string, { correct: number; total: number }>; // Cumulative aggregate per category (for ProgressTab visualizations)
  dailyActivity: Record<string, DailyActivityEntry>; // Append-only per-day { reviews, learned } log feeding the heatmap
  categoryAccuracyLog: CategoryAccuracyLog; // Per-category per-day { correct, total } buckets — LocII consumes this via exponential decay
}

/** Specific status of a word in the algorithm pipeline */
export type WordStatus = 'new' | 'learning' | 'reviewing' | 'mastered';

/**
 * An individual word's metadata linking its progress in the Spaced Repetition pipeline.
 */
export interface UserWord {
  id: string; // references WordData.id structurally
  easeFactor: number; // SM-2 Ease multiplier: indicates how inherently "easy" this is for the user
  interval: number; // In days. Current interval before next due review.
  repetitions: number; // Successful, contiguous recall events.
  nextReviewDate: string; // ISO string representing when this word is next due.
  status: WordStatus; // Broad category location in the user's brain.
  // LocII Tier 2.3 — running quality stats per word. Optional so existing
  // localStorage payloads from before Tier 2.3 hydrate cleanly; new writes
  // always include them. `observedDifficulty(...)` consumes these.
  qualitySum?: number;   // sum of quality scores across all reviews of this word
  qualityCount?: number; // count of reviews contributing to qualitySum
}

interface AppContextType {
  words: WordData[]; // Static library of language content
  userWords: Record<string, UserWord>; // Keyed dictionary mapping WordData IDs to user progress
  stats: UserStats;
  settings: {
    examTarget: string;
    dailyGoal: number;
    showHindi: boolean;
    darkMode: boolean;
    userName: string;
    hasCompletedOnboarding: boolean;
    soundEffects: boolean;
  };
  updateSettings: (newSettings: Partial<AppContextType['settings']>) => void;
  updateBestScore: (mode: string, score: number) => void;
  /** Records a flashcard review. `responseTimeMs` (LocII Tier 2.1) is the
   *  time from card-shown to rating-tapped; omit it for non-flashcard
   *  callers (e.g. game modes) and the response-time factor neutralises. */
  recordReview: (wordId: string, quality: number, responseTimeMs?: number) => void;
  getDueCards: () => WordData[];
  getNewCards: (limit: number) => WordData[];
  gainXp: (amount: number) => void;
  resetProgress: () => void;
  exportData: () => string;
  importData: (jsonData: string) => boolean;
}

const defaultStats: UserStats = {
  xp: 0,
  streak: 0,
  lastStudyDate: null,
  wordsLearnedToday: 0,
  reviewsCompletedToday: 0,
  level: 1,
  bestScores: {
    'quickQuiz': 0,
    'synonymSprint': 0,
    'sentenceFill': 0,
    'mixedMock': 0
  },
  categoryStats: {},
  dailyActivity: {},
  categoryAccuracyLog: {}
};

const defaultSettings = {
  examTarget: 'SSC CGL',
  dailyGoal: 10,
  showHindi: true,
  darkMode: false,
  userName: 'Aspirant',
  hasCompletedOnboarding: false,
  soundEffects: true
};

const AppContext = createContext<AppContextType | undefined>(undefined);

/**
 * Top-level configuration context wrapper.
 * Connects persistence (localStorage) to generic app state mechanics, exposing functional modifier hooks.
 */
export const AppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [words, setWords] = useState<WordData[]>(INITIAL_WORDS);

  // Lazy-load the full dictionary after first paint
  useEffect(() => {
    loadFullDictionary().then(setWords);
  }, []);
  
  // Hydrate structural algorithms (progress states)
  const [userWords, setUserWords] = useState<Record<string, UserWord>>(() => {
    const saved = localStorage.getItem('vocabdost_userWords');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {
        console.error('Failed to parse userWords from local storage', e);
      }
    }
    return {};
  });

  // Hydrate gamification and historical analytics
  const [stats, setStats] = useState<UserStats>(() => {
    const saved = localStorage.getItem('vocabdost_stats');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        return {
          ...defaultStats,
          ...parsed,
          bestScores: { ...defaultStats.bestScores, ...(parsed.bestScores || {}) },
          categoryStats: { ...defaultStats.categoryStats, ...(parsed.categoryStats || {}) },
          dailyActivity: { ...defaultStats.dailyActivity, ...(parsed.dailyActivity || {}) },
          categoryAccuracyLog: { ...defaultStats.categoryAccuracyLog, ...(parsed.categoryAccuracyLog || {}) },
        };
      } catch (e) {
        console.error('Failed to parse stats from local storage', e);
      }
    }
    return defaultStats;
  });

  // Hydrate cosmetic/app-level settings
  const [settings, setSettings] = useState<AppContextType['settings']>(() => {
    const saved = localStorage.getItem('vocabdost_settings');
    if (saved) {
      try {
        return { ...defaultSettings, ...JSON.parse(saved) };
      } catch (e) {
        console.error('Failed to parse settings from local storage', e);
      }
    }
    return defaultSettings;
  });

  // ----------------------------------------------------
  // Persistent Syncing Hooks
  // ----------------------------------------------------

  useEffect(() => {
    localStorage.setItem('vocabdost_userWords', JSON.stringify(userWords));
  }, [userWords]);

  useEffect(() => {
    localStorage.setItem('vocabdost_stats', JSON.stringify(stats));
  }, [stats]);

  useEffect(() => {
    localStorage.setItem('vocabdost_settings', JSON.stringify(settings));
    if (settings.darkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [settings]);

  // ----------------------------------------------------
  // Engine Hooks
  // ----------------------------------------------------

  // Streak-break detection runs once on mount (hydration).
  // Subsequent streak updates are handled atomically inside recordReview.
  useEffect(() => {
    const today = startOfDay(new Date());
    const checkedStreak = checkStreakBreak(stats.lastStudyDate, today, stats.streak);
    if (checkedStreak !== stats.streak) {
      setStats(s => ({ ...s, streak: checkedStreak }));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  /** Appends explicit settings deltas while ensuring untouched configurations persist. */
  const updateSettings = (newSettings: Partial<AppContextType['settings']>) => {
    setSettings((s: AppContextType['settings']) => ({ ...s, ...newSettings }));
  };

  /** Checks minigames state and only overwrites if superior to existing values */
  const updateBestScore = (mode: string, score: number) => {
    setStats((s: UserStats) => {
      const currentBest = s.bestScores[mode] || 0;
      const best = computeBestScore(currentBest, score);
      if (best !== currentBest) {
        return { ...s, bestScores: { ...s.bestScores, [mode]: best } };
      }
      return s;
    });
  };

  /** Simple linear algorithm computing user levels across broad ranges. */
  const gainXp = (amount: number) => {
    setStats((s: UserStats) => {
      const newXp = s.xp + amount;
      return { ...s, xp: newXp, level: computeLevel(newXp) };
    });
  };

  /**
   * Master interaction processor applying SM-2 algorithm modified heavily with LocII (Locally Integrated Intelligence) overrides.
   *
   * Compute-then-commit: every derived value (fresh category stats, multiplier,
   * next SRS state, daily counters, streak) is computed from current closure
   * state BEFORE any setter is called. Then exactly one setStats + one
   * setUserWords fire — no nested setters, safe under React 19 strict mode.
   *
   * @param wordId Identifier for the word logic chunk.
   * @param quality Quality scalar measuring discrete cognitive feedback loops derived explicitly from user UX (0-5, Hard to Easy)
   */
  const recordReview = (wordId: string, quality: number, responseTimeMs?: number) => {
    // quality: 0 (Again), 3 (Hard), 4 (Good), 5 (Easy)
    // responseTimeMs: optional latency signal — Tier 2.1 LocII modifier
    const word = words.find(w => w.id === wordId);
    if (!word) return;

    const category = word.category;
    const isCorrect = quality >= 3;
    const today = startOfDay(new Date());
    const todayStr = today.toISOString();
    const dateKey = toDateKey(today);

    // Cumulative aggregate (for ProgressTab visualizations) — kept in sync
    // alongside the time-bucketed log that LocII actually consumes.
    const catStats = stats.categoryStats[category] || { correct: 0, total: 0 };
    const freshCatStats = {
      ...stats.categoryStats,
      [category]: {
        correct: catStats.correct + (isCorrect ? 1 : 0),
        total: catStats.total + 1,
      },
    };

    // LocII Tier 1.1 — fresh per-day bucket; multiplier reads from this.
    const freshAccuracyLog = updateCategoryAccuracyLog(
      stats.categoryAccuracyLog, category, dateKey, isCorrect
    );

    const currentWordState = userWords[wordId];
    const isNewWord = !currentWordState || currentWordState.status === 'new';

    // LocII Tier 2.3 — observed difficulty calibration.
    // Maintain running per-word quality stats and, once the sample is
    // large enough, override the static dictionary label with the
    // user-personal observation. Static label is the fallback prior.
    const freshQualitySum = (currentWordState?.qualitySum ?? 0) + quality;
    const freshQualityCount = (currentWordState?.qualityCount ?? 0) + 1;
    const calibratedDifficulty =
      observedDifficulty(freshQualitySum, freshQualityCount) ?? word.difficulty;

    const overallMultiplier = calculateAdaptiveMultiplier(
      category, calibratedDifficulty, freshAccuracyLog,
      { today, responseTimeMs }
    );

    const nextState = calculateNextReviewState(word, currentWordState, quality, overallMultiplier);

    const isDifferentDay = stats.lastStudyDate !== todayStr;
    const newStreak = isDifferentDay
      ? computeStreak(stats.lastStudyDate, today, stats.streak)
      : stats.streak;
    const counters = computeDailyCounters(
      isDifferentDay, isNewWord, stats.wordsLearnedToday, stats.reviewsCompletedToday
    );
    const freshDailyActivity = updateDailyActivity(
      stats.dailyActivity, dateKey, isNewWord
    );

    setStats(s => ({
      ...s,
      categoryStats: freshCatStats,
      streak: newStreak,
      lastStudyDate: todayStr,
      ...counters,
      dailyActivity: freshDailyActivity,
      categoryAccuracyLog: freshAccuracyLog,
    }));

    setUserWords(prev => ({
      ...prev,
      [wordId]: {
        id: wordId,
        ...nextState,
        qualitySum: freshQualitySum,
        qualityCount: freshQualityCount,
      },
    }));
  };

  /** Fetches all words scheduled in user flow explicitly before or intersecting identical temporal frames. */
  const getDueCards = () => {
    const now = new Date();
    return words.filter(w => {
      const userWord = userWords[w.id];
      if (!userWord) return false;
      return isBefore(new Date(userWord.nextReviewDate), now) || isSameDay(new Date(userWord.nextReviewDate), now);
    });
  };

  /** Provides untracked structural objects prioritized by the user's chosen exam target.
   *  Words are bucketed by exam-specific frequency, each bucket is fully Fisher-Yates
   *  shuffled, then concatenated highest-frequency-first. */
  const getNewCards = (limit: number) => {
    const newW = words.filter(w => !userWords[w.id]);
    const examTarget = settings.examTarget;

    const buckets = new Map<number, WordData[]>();
    for (const w of newW) {
      const freq = getExamFrequency(w, examTarget);
      const bucket = buckets.get(freq);
      if (bucket) bucket.push(w);
      else buckets.set(freq, [w]);
    }

    const sortedFreqs = Array.from(buckets.keys()).sort((a, b) => b - a);
    const result: WordData[] = [];
    for (const freq of sortedFreqs) {
      const bucket = buckets.get(freq)!;
      for (let i = bucket.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [bucket[i], bucket[j]] = [bucket[j], bucket[i]];
      }
      result.push(...bucket);
      if (result.length >= limit) break;
    }

    return result.slice(0, limit);
  };

  /** Completely resets volatile internal interactions effectively deleting accounts via context override mechanisms. */
  const resetProgress = () => {
    setUserWords({});
    setStats(defaultStats);
    setSettings(defaultSettings);
  };

  /** Exports all user progress as a serialized JSON string. */
  const exportData = () => {
    const data = {
      userWords,
      stats,
      settings,
      version: '1.0' // For future schema migrations
    };
    return JSON.stringify(data);
  };

  /** Safely parses and imports user progress from a serialized JSON string. */
  const importData = (jsonData: string): boolean => {
    try {
      const parsed = JSON.parse(jsonData);
      
      // Basic validation to ensure it's a valid backup file
      if (parsed.userWords && parsed.stats && parsed.settings) {
        setUserWords(parsed.userWords);
        setStats({ ...defaultStats, ...parsed.stats });
        setSettings({ ...defaultSettings, ...parsed.settings });
        return true;
      }
      return false;
    } catch (e) {
      console.error('Failed to import backup data', e);
      return false;
    }
  };

  return (
    <AppContext.Provider
      value={{
        words,
        userWords,
        stats,
        settings,
        updateSettings,
        updateBestScore,
        recordReview,
        getDueCards,
        getNewCards,
        gainXp,
        resetProgress,
        exportData,
        importData
      }}
    >
      {children}
    </AppContext.Provider>
  );
};

/**
 * Accessor hook mapping specific data requirements directly from hierarchical scopes.
 */
export const useApp = () => {
  const context = useContext(AppContext);
  if (context === undefined) {
    throw new Error('useApp must be used within an AppProvider');
  }
  return context;
};
