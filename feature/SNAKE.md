# Feature: Snake

**Status:** ✅ Implemented  
**Date requested:** 2026-02-22  
**Route:** `/games/snake`

## Summary
Classic Snake — guide the snake to eat food, grow longer, and avoid running into
walls or your own tail. Speed increases with every 5 foods eaten.

## Rules Implemented
- 25×20 grid board.
- Snake starts at length 4, moving right.
- Arrow keys or WASD steer the snake; 180° reversals are blocked.
- Eating food grows the snake by one cell and spawns new food at a random empty cell.
- Scoring: `10 × (level + 1)` points per food eaten.
- Level increases every 5 foods; tick interval decreases by 12 ms per level (floor: 60 ms).
- Wall collision or self-collision ends the game.
- Ghost-fade body: tail cells fade in opacity from head to tip.
- Directional eyes on the head cell.
- Pause / resume.

## Controls

| Key | Action |
|---|---|
| `← → ↑ ↓` | Change direction |
| `W A S D` | Change direction (alternative) |
| `P` | Pause / Resume |
| `Enter` | Start / Restart |

## Architecture

| File | Role |
|---|---|
| `constants.ts` | Board size, speeds, colors, direction types |
| `SnakeEngine.ts` | Pure reducer: snake movement, collision, food, scoring |
| `useSnake.ts` | React hook: RAF loop, keyboard, dispatches actions |
| `SnakePage.tsx` | Canvas renderer + HUD layout (score, level, length) |
| `SnakePage.module.css` | Layout + all Snake-specific styles |

## Future Enhancements
- [ ] Persistent high score in `localStorage`.
- [ ] Sound effects (eat, game over).
- [ ] Wraparound wall mode (snake passes through walls).
- [ ] Mobile swipe controls.
- [ ] Obstacles / maze mode at higher levels.
