/**
 * @file AppContext.tsx
 * @description Centralized state management for vocabulary, user progress, and LocII
 * (Locally Integrated Intelligence) algorithm logic.
 */

import React, { createContext, useContext, useEffect, useState } from 'react';
import { WordData, INITIAL_WORDS, loadFullDictionary, getExamFrequency } from '../data/words';
import { isBefore, isSameDay, startOfDay } from 'date-fns';
import { calculateAdaptiveMultiplier, calculateNextReviewState } from '../utils/srs';
import { computeLevel, computeStreak, checkStreakBreak, computeDailyCounters, computeBestScore } from '../utils/analytics';

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
  categoryStats: Record<string, { correct: number; total: number }>; // Tracks raw accuracy across language constraints (Vocabulary, Idioms, etc.)
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
  recordReview: (wordId: string, quality: number) => void;
  getDueCards: () => WordData[];
  getNewCards: (limit: number) => WordData[];
  gainXp: (amount: number) => void;
  resetProgress: () => void;
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
  categoryStats: {}
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
          categoryStats: { ...defaultStats.categoryStats, ...(parsed.categoryStats || {}) }
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
  // Subsequent streak updates are handled atomically inside updateDailyProgress.
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

  const updateDailyProgress = (isNewWord: boolean) => {
    const today = startOfDay(new Date());
    const todayStr = today.toISOString();
    setStats((s: UserStats) => {
      const isDifferentDay = s.lastStudyDate !== todayStr;
      const newStreak = isDifferentDay
        ? computeStreak(s.lastStudyDate, today, s.streak)
        : s.streak;
      const counters = computeDailyCounters(
        isDifferentDay, isNewWord, s.wordsLearnedToday, s.reviewsCompletedToday
      );

      return {
        ...s,
        streak: newStreak,
        lastStudyDate: todayStr,
        ...counters,
      };
    });
  };

  /**
   * Master interaction processor applying SM-2 algorithm modified heavily with LocII (Locally Integrated Intelligence) overrides.
   * Exposes interaction constraints determining intervals applied.
   * 
   * @param wordId Identifier for the word logic chunk.
   * @param quality Quality scalar measuring discrete cognitive feedback loops derived explicitly from user UX (0-5, Hard to Easy)
   */
  const recordReview = (wordId: string, quality: number) => {
    // quality: 0 (Again), 3 (Hard), 4 (Good), 5 (Easy)
    const word = words.find(w => w.id === wordId);
    if (!word) return;

    const category = word.category;
    const isCorrect = quality >= 3;

    // Precompute updated category stats ONCE to avoid stale closure reads.
    // Both setStats and setUserWords use the functional updater form to read
    // the latest state, and we derive the freshCatStats from the stats updater
    // so the adaptive multiplier is always computed against current data.
    setStats((s: UserStats) => {
      const catStats = s.categoryStats[category] || { correct: 0, total: 0 };
      const freshCatStats = {
        ...s.categoryStats,
        [category]: {
          correct: catStats.correct + (isCorrect ? 1 : 0),
          total: catStats.total + 1
        }
      };

      // Compute SRS update synchronously within the same state snapshot
      const overallMultiplier = calculateAdaptiveMultiplier(category, word.difficulty, freshCatStats);

      setUserWords(prev => {
        const currentWordState = prev[wordId];
        const isNewWord = !currentWordState || currentWordState.status === 'new';
        const nextState = calculateNextReviewState(word, currentWordState, quality, overallMultiplier);

        updateDailyProgress(isNewWord);

        return {
          ...prev,
          [wordId]: {
            id: wordId,
            ...nextState
          }
        };
      });

      return { ...s, categoryStats: freshCatStats };
    });
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

  /** Provides untracked structural objects prioritized by the user's chosen exam target. */
  const getNewCards = (limit: number) => {
    const newW = words.filter(w => !userWords[w.id]);
    const examTarget = settings.examTarget;

    // Sort by exam-specific frequency (highest first)
    newW.sort((a, b) => getExamFrequency(b, examTarget) - getExamFrequency(a, examTarget));

    // Fisher-Yates shuffle within same-frequency groups to add variety
    for (let i = newW.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      if (getExamFrequency(newW[i], examTarget) === getExamFrequency(newW[j], examTarget)) {
        [newW[i], newW[j]] = [newW[j], newW[i]];
      }
    }

    return newW.slice(0, limit);
  };

  /** Completely resets volatile internal interactions effectively deleting accounts via context override mechanisms. */
  const resetProgress = () => {
    setUserWords({});
    setStats(defaultStats);
    setSettings(defaultSettings);
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
        resetProgress
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
