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

## Routing

| Path            | Component     | Notes                |
| --------------- | ------------- | -------------------- |
| `/`             | `LandingPage` | Game selector        |
| `/games/tetris` | `TetrisPage`  | Tetris game          |
| `/games/:id`    | _future_      | Dynamic game loading |

---

## Extending — Adding a New Game

Follow **`.github/prompts/new-game.prompt.md`** for the full ordered checklist, file templates, and build verification. High score wiring is in **`.github/prompts/high-score.prompt.md`**.

---

## High Scores

Every game must implement the shared high score system. The API is in `src/lib/highScores.ts`.
For full integration steps and code patterns, follow **`.github/prompts/high-score.prompt.md`**.
For context on what was built and the storage format, see [`/feature/HIGH_SCORES.md`](../feature/HIGH_SCORES.md).

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
