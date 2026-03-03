# Feature: High Scores

**Status:** ✅ Implemented  
**Date requested:** 2026-03-03  
**Route:** N/A — cross-cutting feature, applies to all games

## What was built

Every game persists a per-game **top-5 leaderboard** (score + 3-letter initials) in
`localStorage`. When a player's final score qualifies for the top 5, an initials-entry
overlay is shown before the game restarts. Scores survive page refreshes and browser
restarts. The landing-page game cards show the top 3 scores for each game.

## Storage

```
Key:   arcade-hs-{gameId}            (e.g. arcade-hs-tetris)
Value: JSON array — max 5 entries, sorted descending by score
```

```typescript
interface HighScoreEntry {
  initials: string;  // 3 chars, uppercase, padded with "_"
  score:    number;
}
```

All read/write logic is centralised in **`src/lib/highScores.ts`**.  
No engine or page component should touch `localStorage` directly.

## Implementation layers

| Layer                   | What it does                                                                                                       |
| ----------------------- | ------------------------------------------------------------------------------------------------------------------ |
| `src/lib/highScores.ts` | `loadScores`, `isTopScore`, `addScore` — pure TS, zero React                                                       |
| Engine (`*Engine.ts`)   | Holds `highScore: number` in state for HUD display; updated on every game-over branch                              |
| Hook (`use*.ts`)        | Seeds engine from `loadScores` on mount; detects qualifying game-over; exposes `pendingScore` and `submitInitials` |
| Page (`*Page.tsx`)      | Renders `<InitialsOverlay>` when `pendingScore !== null`; blocks Enter-restart while overlay is active             |
| `<InitialsOverlay>`     | Captures 3-letter initials, saves score, then auto-restarts                                                        |
| `<ScoreTable>`          | Compact top-3 list used inside `<GameCard>` on the landing page                                                    |

## Checklist for new games

See the _High Scores_ item in the **Extending — Adding a New Game** checklist in
[`/plan/ARCHITECTURE.md`](../plan/ARCHITECTURE.md).
