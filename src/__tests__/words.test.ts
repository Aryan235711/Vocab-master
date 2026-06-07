/**
 * @file words.test.ts
 * @description Pins the invariants of the exam-target plumbing so the
 * onboarding + profile pickers can never drift out of sync with the
 * EXAM_KEY_MAP that the SRS prioritisation actually reads.
 *
 * History: before this test, the onboarding screen offered "Banking /
 * IBPS" as a button while EXAM_KEY_MAP only knew "IBPS PO". A banking
 * aspirant picking that option silently got SSC CGL prioritisation for
 * the entire lifetime of the install, with no warning anywhere.
 */

import { describe, it, expect, vi } from 'vitest';
import {
  EXAM_KEY_MAP,
  EXAM_OPTIONS,
  getExamFrequency,
  type WordData,
} from '../data/words';

const sample: WordData = {
  id: 'test-1',
  word: 'TEST',
  meaning: '',
  hindiTranslation: '',
  exampleSentence: '',
  synonyms: [],
  antonyms: [],
  difficulty: 'Medium',
  frequency: 'High',
  examFrequency: { SSC_CGL: 5, UPSC: 7, IBPS_PO: 3 },
  category: 'Vocabulary',
};

describe('EXAM_OPTIONS ⊆ EXAM_KEY_MAP', () => {
  it('every user-facing option resolves to a real key in EXAM_KEY_MAP', () => {
    // This is THE invariant that prevents the "Banking / IBPS" class
    // of bug. If someone adds a new option to the picker without
    // wiring a key map entry, CI fails here.
    for (const opt of EXAM_OPTIONS) {
      expect(EXAM_KEY_MAP[opt]).toBeDefined();
    }
  });

  it('EXAM_OPTIONS is non-empty (we always offer the user at least one choice)', () => {
    expect(EXAM_OPTIONS.length).toBeGreaterThan(0);
  });

  it('every EXAM_KEY_MAP entry points to a real dictionary key', () => {
    // Catches typos like 'SSC_CLG' that would silently 404 inside the
    // examFrequency map. Sample word is contrived but covers the three
    // canonical pools we ship — extend this set if you add a 4th pool.
    const realPools = new Set(Object.keys(sample.examFrequency));
    for (const target of Object.keys(EXAM_KEY_MAP)) {
      const pool = EXAM_KEY_MAP[target];
      expect(realPools.has(pool)).toBe(true);
    }
  });
});

describe('getExamFrequency', () => {
  it('returns the per-exam score when the target is known', () => {
    expect(getExamFrequency(sample, 'SSC CGL')).toBe(5);
    expect(getExamFrequency(sample, 'UPSC CSAT')).toBe(7);
    expect(getExamFrequency(sample, 'IBPS PO')).toBe(3);
  });

  it('shares pools across aliased exam targets', () => {
    // SSC CHSL aliases to SSC_CGL by design.
    expect(getExamFrequency(sample, 'SSC CHSL')).toBe(getExamFrequency(sample, 'SSC CGL'));
    // SBI Clerk aliases to IBPS_PO by design.
    expect(getExamFrequency(sample, 'SBI Clerk')).toBe(getExamFrequency(sample, 'IBPS PO'));
  });

  it('falls back to SSC_CGL AND emits a console.warn when the target is unknown', () => {
    const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => undefined);
    const result = getExamFrequency(sample, 'Imaginary Exam');
    expect(result).toBe(sample.examFrequency.SSC_CGL); // 5 — fell back
    expect(warnSpy).toHaveBeenCalledTimes(1);
    expect(warnSpy.mock.calls[0][0]).toMatch(/Unknown examTarget/i);
    warnSpy.mockRestore();
  });

  it('returns 0 for a known target the word happens to lack a score for', () => {
    const sparse: WordData = { ...sample, examFrequency: { SSC_CGL: 9 } };
    // UPSC pool exists in EXAM_KEY_MAP but this word has no UPSC score —
    // no warn, just 0. Distinct from the unknown-target case above.
    const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => undefined);
    expect(getExamFrequency(sparse, 'UPSC CSAT')).toBe(0);
    expect(warnSpy).not.toHaveBeenCalled();
    warnSpy.mockRestore();
  });
});
