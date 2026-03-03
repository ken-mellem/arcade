# ARCADE HUB — Master Architecture Plan

## Vision
A browser-based arcade game hub. Players visit a landing page styled as a retro arcade
machine, select a game from the available library, and play it in a CRT-bezel framed
canvas.  All games run client-side with no backend.

---

## Toolstack

| Layer           | Choice                              | Rationale                                    |
| --------------- | ----------------------------------- | -------------------------------------------- |
| Build / Dev     | Vite 5                              | Instant HMR, native ESModule, minimal config |
| UI Framework    | React 18 + TypeScript               | Component model perfect for menus/HUD        |
| Routing         | React Router v6                     | `/` landing page, `/games/:id` per game      |
| Game Rendering  | HTML5 Canvas API                    | Native perf, full pixel control              |
| Styling         | CSS Modules + CSS custom properties | Arcade theme without framework bleed         |
| Font            | Press Start 2P (Google Fonts)       | Canonical pixel arcade font                  |
| State (game)    | `useReducer` + `useRef`             | Predictable, no external state lib           |
| package manager | npm                                 | Default, stable                              |

---

## Project Structure

```
src/
├── main.tsx                     # React root, BrowserRouter
├── App.tsx                      # Route declarations
├── styles/
│   ├── globals.css              # Reset + base
│   └── theme.css                # CSS vars: neon palette, animations, CRT
├── components/
│   ├── ArcadeScreen.tsx/.module.css   # CRT bezel wrapper
│   └── GameCard.tsx/.module.css       # Clickable game card
├── pages/
│   └── LandingPage.tsx/.module.css    # Grid of GameCards + marquee
└── games/
    ├── registry.ts              # Typed list of all games
    └── tetris/
        ├── constants.ts         # Board dimensions, tetrominoes, colors
        ├── TetrisEngine.ts      # Pure logic: board, pieces, scoring
        ├── useTetris.ts         # RAF game loop + keyboard hook
        ├── TetrisPage.tsx       # Route page: canvas + HUD layout
        └── TetrisPage.module.css
```

---

## Routing

| Path            | Component     | Notes                |
| --------------- | ------------- | -------------------- |
| `/`             | `LandingPage` | Game selector        |
| `/games/tetris` | `TetrisPage`  | Tetris game          |
| `/games/:id`    | _future_      | Dynamic game loading |

---

## Extending — Adding a New Game

1. Create `src/games/<name>/` folder with engine, hook, page files.
2. Add an entry to `src/games/registry.ts` (`GameEntry`).
3. Add a `<Route>` in `src/App.tsx`.
4. Create a feature file in `/feature/` and a plan in `/plan/`.
5. **Wire up the high score system** — see _High Scores_ section below.

---

## High Scores

Every game **must** implement the shared high score system. Scores are persisted in
`localStorage` via `src/lib/highScores.ts` — the single source of truth. No engine or
page should touch `localStorage` directly.

Required steps for each new game:

1. Add `highScore: number` to the engine state; seed from `createInitialState(savedHighScore)`.
2. Update `highScore: Math.max(state.highScore, newScore)` on every game-over branch; carry it through `RESTART`.
3. In the hook, initialise with `() => createInitialState(loadScores(GAME_ID)[0]?.score ?? 0)`.
4. Expose `pendingScore` / `submitInitials` from the hook (copy the pattern from any existing game).
5. Render `<InitialsOverlay>` in the page root when `pendingScore !== null`.
6. Show a `BEST` stat block in the HUD (`statValueAlt` CSS class — neon yellow).

Full implementation details: [`/feature/HIGH_SCORES.md`](../feature/HIGH_SCORES.md)

---

## Design Principles

- **Pixel-perfect**: `image-rendering: pixelated` on all canvases.
- **CRT vibe**: scanline overlay, flicker animation, neon glow text shadows.
- **Accessible font sizes**: labels use rem fractions from `Press Start 2P`.
- **No frameworks inside games**: engines are pure TypeScript, no React deps.
- **Portable game state**: `useReducer` means game state is serializable/testable.

---

## Standard Game Page Layout

**Decision:** Every game page uses the same three-column layout: left stat panel,
`<ArcadeScreen>` canvas in the centre, right info panel. This is a hard convention.

```
┌──────────────┐  ┌────────────────────────────┐  ┌────────────────┐
│ ← BACK      │  │  <ArcadeScreen>          │  │ CONTROLS       │
│ SCORE ###  │  │  <canvas />               │  │ POINTS TABLE   │
│ BEST  ###  │  │  </ArcadeScreen>          │  │ PAUSE / ACTION │
│ WAVE  n    │  └────────────────────────────┘  └────────────────┘
│ LIVES ▲▲▲ │
└──────────────┘
```

**Left panel** — `BACK` button, `SCORE`, `BEST` (hi-score, always cyan), game-specific
stats (wave/level/speed), `LIVES` icons.

**Right panel** — `CONTROLS` key reference, game-specific scoring table, contextual
action button (Pause / Resume / Restart / Next Wave).

**Accent colour** — each game picks one neon CSS variable as its accent and uses it
consistently across: `ArcadeScreen` `accent` prop, stat values, kbd labels, buttons,
and the `GameCard` entry in `registry.ts`.

| Game           | Accent                |
| -------------- | --------------------- |
| Tetris         | `--color-neon-cyan`   |
| Snake          | `--color-neon-green`  |
| Space Invaders | `--color-neon-pink`   |
| Asteroids      | `--color-neon-yellow` |
