# VocabDost 

VocabDost is a dynamic, intelligent vocabulary and idiom learning application built with React, Vite, and Tailwind CSS. It leverages a custom, mathematically sound Spaced Repetition System (SRS) enhanced with a LocII (Locally Integrated Intelligence) engine to adapt to individual learning trajectories.

## Table of Contents

1. [Architecture Overview](#architecture-overview)
2. [Spaced Repetition System (SRS) & LocII (Locally Integrated Intelligence)](#spaced-repetition-system-srs--local-intelligence)
3. [State Management](#state-management)
4. [Component Structure](#component-structure)
5. [Deployment (Render)](#deployment-render)
6. [Data Models](#data-models)
7. [Future Enhancements](#future-enhancements)

---

## Architecture Overview

The app is a standard Client-Side SPA structured into discrete feature tabs:
- **Home**: Dashboard showing today's goals, overall progress, and quick actions.
- **Learn**: The core SRS flashcard interface where actual learning and reviewing takes place.
- **Games**: Gamified modes (Synonym Sprint, Sentence Fill) to reinforce learned knowledge outside of rote memorization.
- **Progress**: Deep visual analytics of the user's journey, including streaks and the LocII Engine's internal states.
- **Settings**: User preferences (daily goals, notifications).

The app relies heavily on `localStorage` for data persistence, eliminating the need for a backend in this iteration.

---

## Spaced Repetition System (SRS) & LocII (Locally Integrated Intelligence)

### The Core Algorithm (`src/utils/srs.ts`)
VocabDost uses a modified **SuperMemo-2 (SM-2)** algorithm. When a user reviews a card, they rate their recall quality (0-5). The algorithm then calculates:
- `easeFactor`: A scalar denoting how easy the word is to remember. Incorrect answers decrease this factor; correct answers increase it.
- `interval`: The number of days before the word should be reviewed again. 

### LocII (Locally Integrated Intelligence) (Adaptive Multiplier)
Before the algorithm calculates the final interval, the system injects a "LocII (Locally Integrated Intelligence)" multiplier. 
- It tracks the user's aggregate accuracy across fundamental linguistic categories (e.g., `Vocabulary`, `Idioms`, `Phrasal Verbs`).
- If a user struggles specifically with Phrasal Verbs (accuracy < 60%), the engine applies an `0.8` multiplier to the interval, forcing those words to appear more frequently.
- Conversely, if the user excels in standard Vocabulary (accuracy > 85%), a `1.2` multiplier reduces the frequency of those cards, preventing review fatigue.
- This layer interfaces seamlessly with a generic "Word Difficulty" variable, ensuring inherently hard words are reviewed more often regardless of overall category proficiency.

---

## State Management (`src/context/AppContext.tsx`)

All global state is encapsulated in `AppContextProvider`.
1. **`words`**: The static source of truth for the linguistic definitions (`src/data/words.ts`).
2. **`userWords`**: A map linking a word's `id` to the user's specific SRS progress data (`easeFactor`, `interval`, `status`, etc.).
3. **`stats`**: Holds user analytics `xp`, `level`, `streak`, `categoryStats`, and top game scores.
4. **`settings`**: User configuration.

These states are hydrated from and synced to `localStorage` via generic `useEffect` hooks. The Context also exports crucial bound mutators:
- `recordReview(wordId, quality)`: The primary endpoint for updating SRS state after a card is flipped.
- `gainXp(amount)`: Handles level processing.
- `updateBestScore(mode, score)`: Extensibility hook for mini-games.

---

## Component Structure

- **`App.tsx`**: The main shell. Handles the bottom navigation bar and dynamic tab rendering based on `activeTab` state.
- **Tabs (`src/tabs/*.tsx`)**: 
  - `HomeTab.tsx`: Aggregates Context state into readable daily gauges.
  - `LearnTab.tsx`: Implements the stacked card UI and the "flip" mechanism. Calls `recordReview` upon user input. Also utilizes the Web Speech API via `window.speechSynthesis`.
  - `ProgressTab.tsx`: Parses `stats.categoryStats` into the "LocII Engine" visual UI, showing users exactly how the algorithm is tailoring their experience.
  - `GamesTab.tsx` / `SettingsTab.tsx`: Self-contained functional flows.

---

## Spaced Repetition (SRS) & LocII Engine

VocabDost employs a highly modified SuperMemo-2 (SM-2) algorithm decoupled by a "LocII (Locally Integrated Intelligence)" engine that adjusts mathematical constraints dynamically based on temporal accuracy and categorical clustering. 

### 1. The Core SM-2 Engine
At its heart, the system tracks each word with three temporal variables:
- **Interval ($I$)**: Days until the next review.
- **Repetitions ($R$)**: Consecutive correct responses.
- **Ease Factor ($EF$)**: The "stickiness" multiplier (default $2.5$, floor $1.3$).

Users rate their recall on a Quality scale ($q$) from $0$ (Blackout) to $5$ (Perfect).

**If Correct ($q \ge 3$):**
$$ I = \begin{cases} 
      1 \times M & \text{if } R = 0 \\
      6 \times M & \text{if } R = 1 \\
      \text{round}(I_{prev} \times EF \times M) & \text{if } R > 1 
   \end{cases} $$
*(Where $M$ is the Adaptive Multiplier, explained below). $R$ is then incremented.*

**If Incorrect ($q < 3$):**
$$ I = 0, \quad R = 0 \quad (\text{Due immediately}) $$

**Ease Factor Re-calculation (Always applied):**
$$ EF_{new} = EF_{prev} + \left(0.1 - (5 - q) \times (0.08 + (5 - q) \times 0.02)\right) $$
*If $EF < 1.3$, it is capped at $1.3$.*

### 2. The "LocII (Locally Integrated Intelligence)" Engine
Humans don't learn all categories at the same rate. This engine evaluates user accuracy per vocabulary category (e.g., Idioms vs. One Word Substitutions) to punish or reward intervals.

**Laplace Smoothing** is used to avoid zero-frequency extremities in early learning phases:
$$ \text{Smoothed Rate} = \frac{\text{CategoryCorrect} + 1}{\text{CategoryTotal} + 2} $$

**Categorical Multiplier ($C_{mult}$):**
- If Rate $< 0.6$: $C_{mult} = 0.8$ *(Struggling: Intervals shortened by 20%)*
- If Rate $> 0.85$: $C_{mult} = 1.2$ *(Excelling: Intervals expanded by 20%)*
- Otherwise: $C_{mult} = 1.0$

### 3. Inherent Difficulty Modifier
Words carry static difficulty flags (`Easy`, `Medium`, `Hard`) that stack with categorical intelligence. Check the raw values:
- Easy ($D_{mult} = 1.15$)
- Normal ($D_{mult} = 1.0$)
- Hard ($D_{mult} = 0.85$)

### 4. Final Spacing Equation
When the SM-2 engine queries the interval ($I$) step, the overall Multiplier ($M$) is injected:
$$ M = C_{mult} \times D_{mult} $$

**Result:** A user struggling with "Hard" words mapping to the "Idioms" category (assuming idiom accuracy $<60\%$) will face a punishing compound multiplier of $0.8 \times 0.85 = 0.68$. A standard 10-day interval instantly aggressively contracts to a ~6-day interval to prevent memory decay.

### 5. Loop & User Interaction Hook
The adaptation is strictly tightly coupled to the user's active interactions within the **Flashcard Assessment Hub**. 

1. **Feedback Loop (`q`-score ingestion):**
   When the user flips a flashcard during their daily review, they are forced to self-assess their recall on a physical button array mapping to values (e.g., $1 = \text{Again}$, $3 = \text{Hard}$, $4 = \text{Good}$, $5 = \text{Easy}$). 
2. **Category Performance Cascade:**
   The moment a score is registered, two data structures morph simultaneously:
   - The individual word's $EF$ drifts up or down.
   - The *Global Category Accuracy* ledger increments. A $q \ge 3$ counts as a "Correct" categorical strike. A $q < 3$ counts as a "Failed" categorical strike.
3. **Immediate Interval Translation:**
   Because the LocII (Locally Integrated Intelligence) Engine re-evaluates the mathematical limits on *every single swipe*, the multiplier ($M$) can shift mid-session. If a user fails 5 "Idiom" cards in a row, the categorical rate ($C_{mult}$) may plunge below $0.6$ immediately. The 6th Idiom card they study that day will be aggressively scheduled with a $0.8x$ shortened interval length.

This creates a hyper-personalized feedback loop where the algorithm seamlessly protects weak areas in real-time, functioning exactly as an adaptive "digital tutor."

**WordData** (`src/data/dictionary/*.ts`)
Defines the structure of a raw word. 
```typescript
{
  id: string;
  word: string;
  meaning: string;
  // ...translations, examples
  difficulty: 'Easy' | 'Medium' | 'Hard';
  category: 'Vocabulary' | 'Idioms' | 'PhrasalVerbs' | 'OneWordSubstitution';
}
```

**UserWord** (`src/context/AppContext.tsx`)
The user's relational linkage to a Word.
```typescript
{
  id: string;
  easeFactor: number;
  interval: number;
  repetitions: number;
  nextReviewDate: string; // ISO String
  status: 'new' | 'learning' | 'reviewing' | 'mastered';
}
```

---

## Deployment (Render)

VocabDost deploys as a single Express service on [Render](https://render.com) — the server serves the built React frontend and proxies AI calls to Gemini.

> **Note: Firebase is optional.** The app runs fully without Firebase env vars — it falls back to local-only mode (waitlist saves to localStorage, soft launch defaults to ON). Set up Firebase later when you're ready for cloud waitlist + cross-device sync.

### Prerequisites

- A [Render](https://render.com) account (free tier works)
- A [Google Gemini API key](https://aistudio.google.com/apikey) (free tier available)

### Deploy Steps

1. **Push your repo to GitHub** (or GitLab).
2. **Create a new Web Service on Render**:
   - Connect your repo.
   - Render auto-detects `render.yaml` and configures build/start commands.
3. **Set the `GEMINI_API_KEY` environment variable**:
   - Dashboard → your service → Environment → Add `GEMINI_API_KEY` with your key.
   - This is the only secret. All other env vars are set in `render.yaml`.
4. **Deploy**. Render runs `npm install && npm run build` then `npm start`.

### How It Works in Production

| Layer | What happens |
|-------|-------------|
| **Build** | `npm run build` validates the dictionary, then Vite bundles React into `dist/` |
| **Runtime** | `npm start` runs `tsx server.ts` — Express serves `dist/` as static files |
| **AI proxy** | `/api/mnemonic`, `/api/explain`, `/api/chat` proxy to Gemini with session auth + rate limiting |
| **Dictionary** | `/api/dictionary` serves the full 1,500-word dataset as JSON (cached in memory) |
| **SPA routing** | Any non-API, non-static GET falls through to `index.html` for React Router |

### Local Production Test

```bash
npm run build
PORT=10000 npm start
# Open http://localhost:10000
```

### Updating

Push to the connected branch. Render auto-deploys on every push (`autoDeploy: true` in `render.yaml`).

### Gotchas

- **Free tier spins down after inactivity.** First request after idle takes ~30s to cold-start. See "Preventing Cold Starts" below.
- **No persistent storage.** `localStorage` lives in the user's browser. Server-side state (sessions, rate limits) resets on redeploy.
- **`GEMINI_API_KEY` must be set manually** in Render dashboard — it's not committed to the repo.
- **Express 5 route syntax.** If adding new catch-all routes, use `/{*param}` not bare `*` (path-to-regexp v8 requirement).

### Preventing Cold Starts (Free Tier)

Render's free tier sleeps after 15 minutes of inactivity, causing 30-60 second cold starts for the next user. To prevent this:

1. Sign up at [uptimerobot.com](https://uptimerobot.com) (free)
2. Add a new monitor:
   - Type: HTTPS
   - URL: your Render URL + `/api/dictionary`
   - Interval: 5 minutes
3. Save. Your server will be pinged every 5 min and never sleep.

When you upgrade to Render Starter ($7/month), you can remove this — paid tiers don't sleep.

---

## Development Constraints & Practices

- **Tailwind**: Used strictly through utility classes. No arbitrary `.css` additions.
- **Pipelines**: ESLint + TypeScript `tsc --noEmit` checks guarantee type continuity. 
- **Modularity**: Complex logic (like SRS mechanics) is strictly separated out into pure functions in `src/utils/` to ensure predictable, testable data transformation without side-effects.

---

## Technical Changelog (Latest Updates)

### 1. Dictionary Data Expansion (Full Scale 1,500 Words)
* **Modified Files**: `src/data/dictionary/*`
* **Changes**: Scaled the vocabulary dataset from 50 to 1,500 rigorously validated nodes. Split into discrete batched files for optimal bundler performance. Encompasses Vocabulary, Idioms, Phrasal Verbs, and One Word Substitutions tailored for Tier-1 Indian competitive exams.
* **Integrity Validation**: Implemented strict semantic validators (`scripts/validate_dictionary.ts`) ensuring 100% absence of placeholder attributes (e.g., semantic masks, mock strings).

### 2. Live Generative AI SDK Integration
* **Modified File**: `src/services/aiService.ts`
* **Changes**: Wired up the official `@google/genai` TypeScript SDK mapped generically to inference model `gemini-3-flash-preview` to perform inference against users' content.
* **Endpoints Wired**: `generateMnemonic`, `explainInContext`, and `createDoubtChat`. Gracefully degrades if the user loses network connection.

### 3. Gamification Engine Unlocks (`PracticeTab`)
* **Modified File**: `src/tabs/PracticeTab.tsx`
* **Changes**: Activated previously disabled mini-games, wiring up operational modes to provide reinforcement alternatives decoupled from the core SRS queue.
* **New Modes**:
  * **Synonym Sprint**: Uses a custom `useEffect`-driven 60-second recursive interval tick limit. Maps correct and incorrect synonyms using random arrays based on dictionary data.
  * **Sentence Fill**: Implements global insensitive `RegExp` string substitution over `WordData.exampleSentence` values to create dynamic fill-in-the-blank questions based on prior mastery.
  * **Idioms Match**: Uses explicit `category === 'Idioms'` filtering over the master word list.

### 4. Transparent Algorithmic Multipliers
* **Modified File**: `src/tabs/ProgressTab.tsx`
* **Changes**: Exposes the internal AI "LocII (Locally Integrated Intelligence)" engine algorithm (`accuracy < 0.6 ? x0.8 : accuracy > 0.85 ? x1.2 : x1.0`) directly to the UI rendering loop, so users can visually track algorithmic interval penalties and boosts.

### 5. Progressive Web App (PWA) & Offline UX
* **Modified Files**: `public/sw.js`, `public/manifest.json`, `src/components/PWAProvider.tsx`
* **Changes**: Configured full offline caching using a Service Worker app shell strategy. 
* **Install Experience**: Custom `beforeinstallprompt` intercepts to show contextual non-intrusive offline-first installation UI.
* **Offline AI Graceful Fallback**: Native `navigator.onLine` checks ensure that offline attempts to ping Gemini API fail gracefully via contextual UI toasts rather than halting the process. Core Spaced Repetition logic safely processes offline entirely via robust local storage structures.
