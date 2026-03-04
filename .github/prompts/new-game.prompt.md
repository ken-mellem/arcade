---
mode: agent
description: Full checklist and file templates for adding a new game to Arcade Hub.
---

# Task: Add a New Game

You are adding a new game to the Arcade Hub. Follow every step in order. Do not skip the build verification or the documentation steps.

## Variables

- `$GAME_NAME` — PascalCase game name, e.g. `Pacman`
- `$GAME_ID` — kebab-case game ID, e.g. `pacman`
- `$ACCENT_VAR` — neon CSS variable for this game, e.g. `--color-neon-yellow`
- `$GLOW_VAR` — matching border-glow variable, e.g. `--border-glow-yellow`
- `$ACCENT_COLOR` — `var($ACCENT_VAR)` resolved form for `registry.ts`

Use an existing game as the canonical reference implementation:

- **`src/games/tetris/`** — best reference for a grid-based game
- **`src/games/asteroids/`** — best reference for a physics/vector game
- **`src/games/snake/`** — best reference for a simple loop-based game

---

## Step 1 — Create the game folder

Create exactly these five files under `src/games/$GAME_ID/`:

### `constants.ts`

Pure constants: board dimensions, speeds, scoring values, any lookup tables.
No React imports. No engine imports.

### `$GAME_NAME`Engine.ts`

Pure TypeScript reducer. Zero React imports.

Required exports:

```typescript
export interface GameState { /* all game state, including highScore: number */ }
export type GameAction = /* all action union types */

export function createInitialState(savedHighScore: number): GameState
export function reducer(state: GameState, action: GameAction): GameState
```

Rules:

- All game-over branches must update `highScore: Math.max(state.highScore, newScore)`.
- `RESTART` action must carry `highScore` through to the new state.
- No side effects — the engine is a pure function.

### `use$GAME_NAME.ts`

React hook. Owns the RAF loop, keyboard input, and state wiring.

Required:

```typescript
import { loadScores, isTopScore, addScore } from "../../lib/highScores";

const GAME_ID = "$GAME_ID";

// Initialise with saved high score
const [state, dispatch] = useReducer(reducer, undefined, () =>
  createInitialState(loadScores(GAME_ID)[0]?.score ?? 0),
);

// pendingScore is non-null when the initials overlay should be shown
const [pendingScore, setPendingScore] = useState<number | null>(null);

// Detect qualifying game-over in a useEffect watching state
// Call submitInitials to save and clear
const submitInitials = (initials: string) => {
  if (pendingScore !== null) {
    addScore(GAME_ID, pendingScore, initials);
    setPendingScore(null);
    dispatch({ type: "RESTART" });
  }
};

// Block Enter-restart while overlay is active
```

Return `{ state, submitInitials, pendingScore, /* other controls */ }` from the hook.

### `$GAME_NAME`Page.tsx`

Route component. Three-column layout — see `plan/ARCHITECTURE.md` for the exact structure.

Required:

- Import and render `<InitialsOverlay>` when `pendingScore !== null`
- Show `BEST` stat using the `statValueAlt` CSS class (neon yellow)
- Use `<ArcadeScreen accent="var($ACCENT_VAR)">` as the canvas wrapper
- Block Enter key from restarting while overlay is active

### `$GAME_NAME`Page.module.css`

Co-located styles. All colors via CSS vars from `theme.css`. No hard-coded hex.

---

## Step 2 — Register the game

Add an entry to **`src/games/registry.ts`**:

```typescript
{
  id: '$GAME_ID',
  title: '$GAME_NAME'.toUpperCase(),
  description: 'One sentence description.',
  route: '/games/$GAME_ID',
  accentColor: 'var($ACCENT_VAR)',
  glowVar: '$GLOW_VAR',
  status: 'available',
  controls: '← → description of controls',
}
```

---

## Step 3 — Add the route

In **`src/App.tsx`**, add inside the `<Routes>` block:

```tsx
import $GAME_NAMEPage from './games/$GAME_ID/$GAME_NAME'Page'

<Route path="/games/$GAME_ID" element={<$GAME_NAME'Page />} />
```

---

## Step 4 — Wire the high score system

Follow **`.github/prompts/high-score.prompt.md`** to verify all six integration points are covered. The hook skeleton in Step 1 already contains the key patterns, but cross-check each point in that prompt before moving on.

---

## Step 5 — Verify the build

```bash
npm run build
```

Fix all TypeScript and build errors before proceeding. Do not skip this step.

---

## Step 6 — Create the feature doc

Create **`feature/$GAME_NAME.md`** using this template exactly:

```markdown
# Feature: $GAME_NAME

**Status:** ✅ Implemented
**Date requested:** YYYY-MM-DD
**Route:** `/games/$GAME_ID`

## Summary

One-paragraph description.

## Rules Implemented / What was built

- ...

## Controls

| Key | Action |
| --- | ------ |
| ... | ...    |
```

Then add a row to **`feature/INDEX.md`**:

```markdown
| N | YYYY-MM-DD | $GAME_NAME | ✅ Done | [$GAME_NAME.md](./$GAME_NAME.md) |
```

---

## Checklist

- [ ] `src/games/$GAME_ID/constants.ts` created
- [ ] `src/games/$GAME_ID/$GAME_NAME`Engine.ts` created (no React imports)
- [ ] `src/games/$GAME_ID/use$GAME_NAME.ts` created
- [ ] `src/games/$GAME_ID/$GAME_NAME`Page.tsx` created
- [ ] `src/games/$GAME_ID/$GAME_NAME`Page.module.css` created
- [ ] Entry added to `src/games/registry.ts`
- [ ] Route added to `src/App.tsx`
- [ ] High score system wired (all 6 points from `high-score.prompt.md`)
- [ ] `npm run build` passes with zero errors
- [ ] `feature/$GAME_NAME.md` created
- [ ] `feature/INDEX.md` updated
