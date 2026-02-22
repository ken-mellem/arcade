# Feature: Tetris

**Status:** ✅ Implemented  
**Date requested:** 2026-02-22  
**Route:** `/games/tetris`

## Summary
Classic Tetris with all 7 tetrominoes, line clearing, progressive speed levels,
hold piece, ghost piece, and a game-over screen.

## Rules Implemented
- 10×20 board (standard Guideline dimensions).
- 7 tetrominoes: I, O, T, S, Z, J, L — each with unique neon color.
- Rotation with basic wall-kick offsets (±1, ±2 columns).
- Ghost piece shows where the active piece will land.
- Soft drop (+1 score/row) and hard drop (+2 score/row).
- Hold piece (one hold per piece; refreshed on lock).
- Line-clear scoring: 100 / 300 / 500 / 800 × (level+1) for 1/2/3/4 lines.
- Level increases every 10 lines; drop speed follows standard speed curve.
- Pause / resume.
- Game-over detection on spawn collision.

## Controls
| Key   | Action           |
| ----- | ---------------- |
| ← / → | Move left/right  |
| ↑     | Rotate clockwise |
| ↓     | Soft drop        |
| Space | Hard drop        |
| C     | Hold piece       |
| P     | Pause / Resume   |
| Enter | Start / Restart  |

## Architecture
| File                    | Role                                                               |
| ----------------------- | ------------------------------------------------------------------ |
| `constants.ts`          | All game constants: board dims, piece shapes & colors, speed table |
| `TetrisEngine.ts`       | Pure reducer: board state, collision, line clear, scoring          |
| `useTetris.ts`          | React hook: RAF loop, keyboard listeners, dispatches actions       |
| `TetrisPage.tsx`        | Canvas renderer + HUD layout (score, level, lines, next, held)     |
| `TetrisPage.module.css` | Layout + all Tetris-specific styles                                |

## Future Enhancements
- [ ] Persistent high score in `localStorage`.
- [ ] Sound effects (line clear, hard drop, game over).
- [ ] 7-bag random piece generator (reduces unlucky streaks).
- [ ] T-spin detection and bonus scoring.
- [ ] Mobile touch controls (swipe/tap).
- [ ] Move history / replay.
