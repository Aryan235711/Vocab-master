// @vitest-environment jsdom
/**
 * @file AppContext.test.tsx
 * @description Integration tests for the AppProvider. Exercises the public
 * surface (recordReview, gainXp, updateBestScore, getDueCards, getNewCards,
 * resetProgress, exportData/importData) and pins the invariants of the
 * compute-then-commit refactor: a single recordReview must atomically write
 * consistent userWords + categoryStats + daily counters + streak in one batch.
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import React from 'react';
import { AppProvider, useApp } from '../context/AppContext';
import { INITIAL_WORDS } from '../data/words';
import { toDateKey } from '../utils/analytics';

// loadFullDictionary calls fetch('/api/dictionary'). Stub it so jsdom
// doesn't reach the network — the fallback words on INITIAL_WORDS are
// enough for assertions.
beforeEach(() => {
  localStorage.clear();
  vi.stubGlobal('fetch', vi.fn().mockRejectedValue(new Error('no network in tests')));
});

const wrapper = ({ children }: { children: React.ReactNode }) => (
  <AppProvider>{children}</AppProvider>
);

// ─── Initial state ───────────────────────────────────────────────

describe('AppProvider initial state', () => {
  it('starts with empty userWords + default stats + default settings', () => {
    const { result } = renderHook(() => useApp(), { wrapper });
    expect(result.current.userWords).toEqual({});
    expect(result.current.stats.xp).toBe(0);
    expect(result.current.stats.level).toBe(1);
    expect(result.current.stats.streak).toBe(0);
    expect(result.current.stats.lastStudyDate).toBeNull();
    expect(result.current.settings.dailyGoal).toBe(10);
    expect(result.current.settings.examTarget).toBe('SSC CGL');
    expect(result.current.settings.hasCompletedOnboarding).toBe(false);
  });

  it('exposes fallback words synchronously (no network required)', () => {
    const { result } = renderHook(() => useApp(), { wrapper });
    expect(result.current.words.length).toBe(INITIAL_WORDS.length);
    expect(result.current.words[0]).toHaveProperty('id');
  });
});

// ─── gainXp + level derivation ───────────────────────────────────

describe('gainXp', () => {
  it('adds XP and recomputes level', () => {
    const { result } = renderHook(() => useApp(), { wrapper });
    act(() => result.current.gainXp(250));
    expect(result.current.stats.xp).toBe(250);
    expect(result.current.stats.level).toBe(1);

    act(() => result.current.gainXp(300));
    expect(result.current.stats.xp).toBe(550);
    expect(result.current.stats.level).toBe(2);
  });

  it('persists XP across remount via localStorage', () => {
    const first = renderHook(() => useApp(), { wrapper });
    act(() => first.result.current.gainXp(500));
    first.unmount();

    const second = renderHook(() => useApp(), { wrapper });
    expect(second.result.current.stats.xp).toBe(500);
    expect(second.result.current.stats.level).toBe(2);
  });
});

// ─── updateBestScore ─────────────────────────────────────────────

describe('updateBestScore', () => {
  it('writes a higher score and ignores a lower one', () => {
    const { result } = renderHook(() => useApp(), { wrapper });
    act(() => result.current.updateBestScore('quickQuiz', 50));
    expect(result.current.stats.bestScores.quickQuiz).toBe(50);

    act(() => result.current.updateBestScore('quickQuiz', 30));
    expect(result.current.stats.bestScores.quickQuiz).toBe(50);

    act(() => result.current.updateBestScore('quickQuiz', 75));
    expect(result.current.stats.bestScores.quickQuiz).toBe(75);
  });
});

// ─── recordReview pipeline ───────────────────────────────────────

describe('recordReview', () => {
  it('writes a UserWord entry on first correct review', () => {
    const { result } = renderHook(() => useApp(), { wrapper });
    const wordId = result.current.words[0].id;
    act(() => result.current.recordReview(wordId, 4));

    const uw = result.current.userWords[wordId];
    expect(uw).toBeDefined();
    expect(uw.repetitions).toBe(1);
    expect(uw.interval).toBeGreaterThanOrEqual(1);
    expect(uw.status).toBe('learning');
  });

  it('atomically updates categoryStats so a second review sees fresh accuracy', () => {
    // This pins the invariant of the compute-then-commit refactor: by the
    // time the second recordReview runs, the categoryStats from the first
    // call must already be visible.
    const { result } = renderHook(() => useApp(), { wrapper });
    const vocabWords = result.current.words.filter(w => w.category === 'Vocabulary');
    expect(vocabWords.length).toBeGreaterThanOrEqual(2);

    act(() => result.current.recordReview(vocabWords[0].id, 4));
    expect(result.current.stats.categoryStats['Vocabulary']).toEqual({
      correct: 1,
      total: 1,
    });

    act(() => result.current.recordReview(vocabWords[1].id, 0));
    expect(result.current.stats.categoryStats['Vocabulary']).toEqual({
      correct: 1,
      total: 2,
    });
  });

  it('starts a streak of 1 on the first review of a fresh user', () => {
    const { result } = renderHook(() => useApp(), { wrapper });
    expect(result.current.stats.streak).toBe(0);
    act(() => result.current.recordReview(result.current.words[0].id, 4));
    expect(result.current.stats.streak).toBe(1);
    expect(result.current.stats.lastStudyDate).not.toBeNull();
  });

  it('does not increment streak on a same-day repeat review', () => {
    const { result } = renderHook(() => useApp(), { wrapper });
    act(() => result.current.recordReview(result.current.words[0].id, 4));
    expect(result.current.stats.streak).toBe(1);
    act(() => result.current.recordReview(result.current.words[1].id, 4));
    expect(result.current.stats.streak).toBe(1);
  });

  it('increments wordsLearnedToday for a new word, reviewsCompletedToday for a repeat', () => {
    const { result } = renderHook(() => useApp(), { wrapper });
    const wordId = result.current.words[0].id;
    act(() => result.current.recordReview(wordId, 4));
    expect(result.current.stats.wordsLearnedToday).toBe(1);
    expect(result.current.stats.reviewsCompletedToday).toBe(0);

    // Second review of the SAME word — it's no longer status='new' so the
    // counter goes to reviewsCompletedToday.
    act(() => result.current.recordReview(wordId, 4));
    expect(result.current.stats.wordsLearnedToday).toBe(1);
    expect(result.current.stats.reviewsCompletedToday).toBe(1);
  });

  it('ignores an unknown wordId without throwing', () => {
    const { result } = renderHook(() => useApp(), { wrapper });
    expect(() => act(() => result.current.recordReview('does-not-exist', 4))).not.toThrow();
    expect(result.current.userWords).toEqual({});
  });

  it('appends today\'s entry to dailyActivity (drives the heatmap)', () => {
    const { result } = renderHook(() => useApp(), { wrapper });
    expect(result.current.stats.dailyActivity).toEqual({});

    const todayKey = toDateKey(new Date());
    const wordId = result.current.words[0].id;
    act(() => result.current.recordReview(wordId, 4));

    // First touch of a new word → learned++, reviews stays at 0.
    expect(result.current.stats.dailyActivity[todayKey]).toEqual({
      reviews: 0,
      learned: 1,
    });

    // Re-reviewing the same word later → reviews++.
    act(() => result.current.recordReview(wordId, 4));
    expect(result.current.stats.dailyActivity[todayKey]).toEqual({
      reviews: 1,
      learned: 1,
    });
  });
});

// ─── getDueCards / getNewCards ───────────────────────────────────

describe('getDueCards', () => {
  it('returns words whose nextReviewDate is at or before now', () => {
    const { result } = renderHook(() => useApp(), { wrapper });
    const wordId = result.current.words[0].id;
    // q=0 marks the word as immediately due
    act(() => result.current.recordReview(wordId, 0));
    const due = result.current.getDueCards();
    expect(due.find(w => w.id === wordId)).toBeDefined();
  });

  it('excludes words scheduled for the future', () => {
    const { result } = renderHook(() => useApp(), { wrapper });
    const wordId = result.current.words[0].id;
    // q=5 → interval = 1.15 (Easy multiplier baked in), so nextReviewDate is +1 day
    act(() => result.current.recordReview(wordId, 5));
    const due = result.current.getDueCards();
    expect(due.find(w => w.id === wordId)).toBeUndefined();
  });
});

describe('getNewCards', () => {
  it('returns only words the user has never reviewed', () => {
    const { result } = renderHook(() => useApp(), { wrapper });
    const seenId = result.current.words[0].id;
    act(() => result.current.recordReview(seenId, 4));

    const fresh = result.current.getNewCards(50);
    expect(fresh.find(w => w.id === seenId)).toBeUndefined();
  });

  it('respects the limit parameter', () => {
    const { result } = renderHook(() => useApp(), { wrapper });
    const fresh = result.current.getNewCards(3);
    expect(fresh.length).toBeLessThanOrEqual(3);
  });

  it('returns words in non-increasing exam frequency order (bucket shuffle invariant)', () => {
    const { result } = renderHook(() => useApp(), { wrapper });
    const fresh = result.current.getNewCards(20);
    // Per-exam frequency values for the configured target should be
    // non-increasing across the result (higher buckets emit first).
    const target = result.current.settings.examTarget;
    const examKey = target === 'SSC CGL' ? 'SSC_CGL' : 'SSC_CGL';
    const freqs = fresh.map(w => w.examFrequency[examKey] ?? 0);
    for (let i = 1; i < freqs.length; i++) {
      expect(freqs[i]).toBeLessThanOrEqual(freqs[i - 1]);
    }
  });
});

// ─── Persistence ─────────────────────────────────────────────────

describe('localStorage persistence', () => {
  it('writes userWords + stats + settings on change', () => {
    const { result } = renderHook(() => useApp(), { wrapper });
    act(() => result.current.recordReview(result.current.words[0].id, 4));
    act(() => result.current.updateSettings({ dailyGoal: 25 }));

    const userWords = JSON.parse(localStorage.getItem('vocabdost_userWords') || '{}');
    const stats = JSON.parse(localStorage.getItem('vocabdost_stats') || '{}');
    const settings = JSON.parse(localStorage.getItem('vocabdost_settings') || '{}');

    expect(Object.keys(userWords).length).toBe(1);
    expect(stats.streak).toBe(1);
    expect(settings.dailyGoal).toBe(25);
  });

  it('rehydrates from localStorage on remount', () => {
    const first = renderHook(() => useApp(), { wrapper });
    act(() => first.result.current.gainXp(750));
    act(() => first.result.current.updateSettings({ userName: 'Pranav' }));
    first.unmount();

    const second = renderHook(() => useApp(), { wrapper });
    expect(second.result.current.stats.xp).toBe(750);
    expect(second.result.current.settings.userName).toBe('Pranav');
  });

  it('survives corrupted localStorage and falls back to defaults', () => {
    localStorage.setItem('vocabdost_stats', 'not-valid-json{{{');
    localStorage.setItem('vocabdost_userWords', '@@@');
    localStorage.setItem('vocabdost_settings', 'broken');

    const { result } = renderHook(() => useApp(), { wrapper });
    expect(result.current.stats.xp).toBe(0);
    expect(result.current.userWords).toEqual({});
    expect(result.current.settings.dailyGoal).toBe(10);
  });
});

// ─── resetProgress + exportData / importData ─────────────────────

describe('resetProgress', () => {
  it('clears userWords, stats, and settings back to defaults', () => {
    const { result } = renderHook(() => useApp(), { wrapper });
    act(() => result.current.recordReview(result.current.words[0].id, 4));
    act(() => result.current.gainXp(1000));
    act(() => result.current.updateSettings({ userName: 'Ravi', dailyGoal: 20 }));

    act(() => result.current.resetProgress());

    expect(result.current.userWords).toEqual({});
    expect(result.current.stats.xp).toBe(0);
    expect(result.current.stats.streak).toBe(0);
    expect(result.current.settings.dailyGoal).toBe(10);
    expect(result.current.settings.userName).toBe('Aspirant');
  });
});

describe('exportData / importData', () => {
  it('round-trips userWords + stats + settings', () => {
    const first = renderHook(() => useApp(), { wrapper });
    act(() => first.result.current.recordReview(first.result.current.words[0].id, 4));
    act(() => first.result.current.gainXp(123));
    act(() => first.result.current.updateSettings({ userName: 'Asha' }));

    const snapshot = first.result.current.exportData();
    expect(typeof snapshot).toBe('string');

    // Reset, then import the snapshot back.
    act(() => first.result.current.resetProgress());
    expect(first.result.current.stats.xp).toBe(0);

    act(() => {
      const ok = first.result.current.importData(snapshot);
      expect(ok).toBe(true);
    });

    expect(first.result.current.stats.xp).toBe(123);
    expect(first.result.current.settings.userName).toBe('Asha');
    expect(Object.keys(first.result.current.userWords).length).toBe(1);
  });

  it('rejects malformed import payload without crashing', () => {
    const { result } = renderHook(() => useApp(), { wrapper });
    act(() => {
      const ok = result.current.importData('{"not":"a backup"}');
      expect(ok).toBe(false);
    });
    act(() => {
      const ok = result.current.importData('this is not json');
      expect(ok).toBe(false);
    });
  });
});
