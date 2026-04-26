# LocII (Locally Integrated Intelligence) — Future Upgrades

This document outlines planned enhancements to the analytics-LocII-SRS pipeline.
All upgrades preserve the core principle: **analytics captures → LocII interprets → SRS schedules**.

---

## Current Pipeline (v1.0)

```
User Action → recordReview(wordId, quality)
  ├─ categoryStats updated (analytics)
  ├─ calculateAdaptiveMultiplier(category, difficulty, categoryStats) → LocII multiplier
  ├─ calculateNextReviewState(word, state, quality, multiplier) → new SRS state
  └─ dailyProgress + streak updated
```

**Data captured today:**
- Per-category accuracy (correct/total with Laplace smoothing)
- Per-word SRS state (easeFactor, interval, repetitions, status)
- Daily counters (wordsLearned, reviewsCompleted)
- Streak (consecutive study days)
- XP + level
- Best scores per game mode

---

## Tier 1 — Near-term (No schema changes)

### 1.1 Time-Weighted Category Accuracy
**Problem:** Current categoryStats treat a mistake from day 1 the same as one from today.
**Approach:** Exponential decay weighting — recent reviews count more.
```
weightedRate = sum(correct_i * decay^(daysSince_i)) / sum(decay^(daysSince_i))
```
**Where it plugs in:** Replace the Laplace-smoothed rate inside `calculateAdaptiveMultiplier`.
**Data needed:** Timestamp per review event (append-only log alongside aggregate stats).

### 1.2 Session Fatigue Detection
**Problem:** Accuracy drops after 15-20 cards in a single session but LocII doesn't know.
**Approach:** Track per-session accuracy slope. If accuracy drops >15% from session start, suggest a break or shorten remaining session.
**Where it plugs in:** New signal consumed by LearnTab UI, not SRS directly.
**Data needed:** Session start timestamp + running session accuracy.

### 1.3 Activity Heatmap (Real Data)
**Problem:** ProgressTab heatmap is a placeholder.
**Approach:** Store `{ [dateString]: { reviews: number, learned: number } }` in stats.
**Where it plugs in:** ProgressTab visualization. No SRS impact.
**Data needed:** Daily activity log (append on each `updateDailyProgress` call).

---

## Tier 2 — Medium-term (Minor schema additions)

### 2.1 Response Time as Quality Signal
**Problem:** A correct answer after 15 seconds of hesitation isn't the same as an instant recall.
**Approach:** Measure time-to-respond on flashcard flip. Map to a confidence modifier:
- < 3s: confident (no penalty)
- 3-8s: moderate (multiply interval by 0.9)
- > 8s: hesitant (multiply interval by 0.75)
**Where it plugs in:** New factor in `calculateAdaptiveMultiplier` output.
**Data needed:** `responseTimeMs` passed into `recordReview`.

### 2.2 Cross-Category Interference Detection
**Problem:** Users who learn "PUGNACIOUS" and "BELLIGERENT" in the same session confuse them.
**Approach:** Track co-failure pairs. If two words from the same synonym cluster both fail within N reviews, flag them as interference pairs and space them apart.
**Where it plugs in:** New scheduling constraint in `getDueCards` — avoid surfacing interference pairs in the same session.
**Data needed:** Failure co-occurrence matrix (sparse, keyed by word-pair).

### 2.3 Difficulty Auto-Calibration
**Problem:** Static `Easy/Medium/Hard` labels may not match actual user experience.
**Approach:** After 50+ total reviews of a word across all users (future server-side), or 5+ personal reviews, override the static difficulty with observed difficulty based on average quality scores.
**Where it plugs in:** Replace `word.difficulty` input to `calculateAdaptiveMultiplier`.
**Data needed:** Per-word aggregate quality score.

### 2.4 Game Mode Performance Feeding SRS
**Problem:** Game scores (Synonym Sprint, Sentence Fill) don't inform the SRS pipeline.
**Approach:** Map game interactions to lightweight quality signals:
- Correct in quiz → quality 4 equivalent
- Incorrect in quiz → quality 1 equivalent
- Apply a dampened multiplier (e.g., 0.5x weight) since games are lower-fidelity than flashcard self-assessment.
**Where it plugs in:** Call `recordReview` from game completion with a `source: 'game'` flag.
**Data needed:** Word-level game results (already partially available in PracticeTab).

---

## Tier 3 — Long-term (Architecture evolution)

### 3.1 Predictive Lapse Model
**Problem:** SM-2 is reactive — it only adjusts after a failure.
**Approach:** Train a lightweight logistic regression (runs client-side) on:
- days since last review / scheduled interval ratio
- ease factor trajectory (rising/falling)
- category accuracy trend
- time-of-day study patterns

Predicts P(lapse) before the card is shown. If P(lapse) > 0.7, preemptively shorten interval.
**Where it plugs in:** New `predictLapseProbability()` function feeding into `overallMultiplier`.
**Data needed:** All existing signals, just composed differently.

### 3.2 Optimal Review Ordering
**Problem:** Cards are served in arbitrary order within a session.
**Approach:** Interleave categories (don't show 10 Idioms in a row). Prioritize high-lapse-probability cards early in session when focus is highest.
**Where it plugs in:** Sort function in `getDueCards`.
**Data needed:** Lapse predictions from 3.1 + session position counter.

### 3.3 Server-Side LocII (Cloud Sync)
**Problem:** All intelligence is local — lost on device switch.
**Approach:** When Premium cloud sync ships, persist `categoryStats`, `userWords`, and the activity log to Firestore. LocII computations remain client-side (fast, offline-capable) but read from synced data.
**Where it plugs in:** Replace localStorage hydration in AppContext with Firestore listener.
**Data needed:** Same schema, different storage backend.

---

## Design Principles (All Tiers)

1. **Analytics captures, LocII interprets, SRS schedules.** Never skip a layer.
2. **Pure functions.** Every new signal → new pure function → tested independently.
3. **Backward compatible.** New fields default gracefully. Old data still works.
4. **Client-first.** All computation runs locally. Server is optional sync, not required compute.
5. **Transparent.** Every multiplier and signal is visible in ProgressTab. No black boxes.
