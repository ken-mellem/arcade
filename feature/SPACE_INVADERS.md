# Feature: Space Invaders

**Status:** ✅ Implemented  
**Date requested:** 2026-03-03  
**Route:** `/games/space-invaders`

## Summary

Classic fixed-shooter arcade game. The player controls a laser cannon at the
bottom of the screen, defending Earth against rows of descending alien invaders.

## Gameplay

- **Invader sprites**: Each type has two animation frames that alternate on every
  movement step, giving the classic "walking" look.
- **Invader grid**: 5 rows × 11 columns (55 invaders total)
- **Movement**: The entire formation moves left/right, dropping down each time
  it reverses direction. Movement speed increases as invaders are destroyed.
- **Enemy fire**: Bottom-most invader in each column fires at random intervals.
- **Mystery ship**: Occasionally a UFO crosses the top of the screen (100 pts).
- **Shields**: Four destructible bunkers protect the player. Each bunker is a
  13×8 grid of 4×4 px tiles arranged in a classic arch shape. Bullets knock
  out a 3×3 tile block on impact, creating visible holes; sustained fire
  eventually opens a corridor through the bunker.
- **Lives**: Player starts with 3 lives.
- **Bonus life**: One extra life is awarded when the player first reaches 1,500 points.
- **Player death**: Hitting the player triggers a 1.2 s explosion animation before
  the cannon respawns; bullets are cleared during the animation.
- **Waves**: Clearing all invaders advances to the next wave (faster, higher score).
  Each wave the formation starts one row lower, escalating pressure on later waves.
- **Game over**: Either all lives are lost, or a live invader reaches the floor.

## Scoring

| Invader row       | Points |
| ----------------- | ------ |
| Top (row 0)       | 30     |
| Mid (rows 1–2)    | 20     |
| Bottom (rows 3–4) | 10     |
| Mystery UFO       | 100    |

High score is persisted in `localStorage` via the shared high score system (see `HIGH_SCORES.md`).

## Controls

| Key   | Action                      |
| ----- | --------------------------- |
| ← / A | Move left                   |
| → / D | Move right                  |
| SPACE | Fire (single shot)          |
| P     | Pause / Resume              |
| ENTER | Start / Next wave / Restart |

## Architecture

Follows the standard Arcade Hub game pattern:

```
src/games/space-invaders/
├── constants.ts              – canvas size, speeds, invader grid config
├── SpaceInvadersEngine.ts    – pure reducer (no React)
├── useSpaceInvaders.ts       – RAF loop + keyboard wiring
├── SpaceInvadersPage.tsx     – route component, canvas rendering
└── SpaceInvadersPage.module.css
```

## Visual Style

- Dark space background with procedurally seeded static stars
- Pixel-art sprites for three invader types (distinct shape + neon colour per row)
- Neon pink accent (matching `--color-neon-pink`)
- Mystery ship in neon pink with glow
- Shields rendered as 4×4 px tile grids; individual tiles are erased on bullet impact, leaving visible holes
