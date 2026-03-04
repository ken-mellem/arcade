---
agent: agent
description: Step-by-step guide for wiring the shared high score system into any Arcade Hub game.
---

# Task: Wire the High Score System

Every game must implement all six integration points below. The shared API lives in
**`src/lib/highScores.ts`** — no game file should touch `localStorage` directly.

Use **`src/games/snake/`** as the reference implementation (clean and minimal).

---

## API Reference — `src/lib/highScores.ts`

```typescript
interface HighScoreEntry { initials: string; score: number }

loadScores(gameId: string): HighScoreEntry[]
// Returns top-5 sorted descending. Returns [] on first run.

isTopScore(gameId: string, score: number): boolean
// True when score > 0 and qualifies for top-5.

addScore(gameId: string, score: number, initials: string): HighScoreEntry[]
// Inserts, sorts, persists, returns updated list.
// Initials are normalised to 1-3 uppercase alphanumeric chars.
// Empty/invalid initials are rejected — the existing list is returned unchanged.
```

Storage key format: `arcade-hs-{gameId}` (e.g. `arcade-hs-tetris`).

---

## 6 Integration Points

### Point 1 — Engine state contains `highScore`

In `*Engine.ts`, add `highScore: number` to the state interface and accept it as a seed:

```typescript
export interface GameState {
  // ... existing fields ...
  highScore: number;
}

export function createInitialState(savedHighScore: number): GameState {
  return {
    // ... existing initial values ...
    highScore: savedHighScore,
  };
}
```

### Point 2 — Engine updates `highScore` on every game-over branch

Every branch in the reducer that transitions to a game-over state must update the high score:

```typescript
case 'TICK': {  // or wherever game-over is detected
  if (isGameOver) {
    return {
      ...state,
      phase: 'gameover',
      highScore: Math.max(state.highScore, state.score),
    }
  }
  // ...
}
```

### Point 3 — Engine carries `highScore` through `RESTART`

```typescript
case 'RESTART':
  return {
    ...createInitialState(state.highScore),
    highScore: state.highScore,
  }
```

### Point 4 — Hook seeds engine from `loadScores` and manages `pendingScore`

In `use*.ts`:

```typescript
import { loadScores, isTopScore, addScore } from "../../lib/highScores";

const GAME_ID = "your-game-id"; // must match registry.ts id

// Seed the engine with the saved best score
const [state, dispatch] = useReducer(reducer, undefined, () =>
  createInitialState(loadScores(GAME_ID)[0]?.score ?? 0),
);

const [pendingScore, setPendingScore] = useState<number | null>(null);
const pendingRef = useRef<number | null>(null);
pendingRef.current = pendingScore;

// Detect game-over and check if score qualifies
useEffect(() => {
  if (state.phase === "gameover" && isTopScore(GAME_ID, state.score)) {
    setPendingScore(state.score);
  }
}, [state.phase, state.score]);

// IMPORTANT: use the ref-guard pattern — do NOT close over pendingScore state.
// A second invocation before the render settles would still see the old state value.
const submitInitials = useCallback((initials: string) => {
  if (pendingRef.current === null) return;
  const score = pendingRef.current;
  pendingRef.current = null; // synchronously invalidate before async state update
  addScore(GAME_ID, score, initials);
  setPendingScore(null);
  dispatch({ type: "RESTART" });
}, []);
```

Return `pendingScore` and `submitInitials` from the hook.

### Point 5 — Page renders `<InitialsOverlay>` and blocks Enter-restart

In `*Page.tsx`:

```tsx
import InitialsOverlay from "../../components/InitialsOverlay";

// Inside the component, before the canvas:
{
  pendingScore !== null && (
    <InitialsOverlay score={pendingScore} onSubmit={submitInitials} />
  );
}
```

Block Enter from triggering a restart while the overlay is visible:

```typescript
// In the keydown handler (usually inside the hook):
if (e.key === "Enter" && pendingScore === null) {
  dispatch({ type: "RESTART" });
}
```

### Point 6 — Page HUD shows `BEST` stat in neon yellow

In the left stats panel of `*Page.tsx`:

```tsx
<div className={styles.statLabel}>BEST</div>
<div className={styles.statValueAlt}>{state.highScore}</div>
```

`statValueAlt` renders in `--color-neon-yellow` — use it only for the high score, not for other stats.

---

## Checklist

- [ ] `highScore: number` in engine `GameState` interface
- [ ] `createInitialState(savedHighScore)` accepts and seeds from the saved value
- [ ] Every game-over branch updates `highScore: Math.max(state.highScore, state.score)`
- [ ] `RESTART` action carries `highScore` through
- [ ] Hook seeds from `loadScores(GAME_ID)[0]?.score ?? 0`
- [ ] Hook uses `pendingRef` + ref-guard pattern in `submitInitials` (see Point 4 template)
- [ ] Hook exposes `pendingScore` and `submitInitials`
- [ ] Page renders `<InitialsOverlay>` when `pendingScore !== null`
- [ ] Enter-restart is blocked while overlay is active
- [ ] `BEST` stat displayed using `statValueAlt` CSS class

---

## Verify

Run `npm run build && npm test` after completing all points. Both must pass with zero errors.
