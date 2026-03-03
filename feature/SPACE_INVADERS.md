# SPACE INVADERS — Feature Spec

## Summary

Classic fixed-shooter arcade game. The player controls a laser cannon at the
bottom of the screen, defending Earth against rows of descending alien invaders.

## Gameplay

- **Invader grid**: 5 rows × 11 columns (55 invaders total)
- **Movement**: The entire formation moves left/right, dropping down each time
  it reverses direction. Movement speed increases as invaders are destroyed.
- **Enemy fire**: Bottom-most invader in each column fires at random intervals.
- **Mystery ship**: Occasionally a UFO crosses the top of the screen (100 pts).
- **Shields**: Four destructible bunkers protect the player; both player and
  enemy bullets erode them.
- **Lives**: Player starts with 3 lives.
- **Waves**: Clearing all invaders advances to the next wave (faster, higher score).
- **Game over**: Either all lives are lost, or a live invader reaches the floor.

## Scoring

| Invader row       | Points |
| ----------------- | ------ |
| Top (row 0)       | 30     |
| Mid (rows 1–2)    | 20     |
| Bottom (rows 3–4) | 10     |
| Mystery UFO       | 100    |

High score is tracked in component state for the session.

## Controls

| Key   | Action                      |
| ----- | --------------------------- |
| ← / A | Move left                   |
| → / D | Move right                  |
| SPACE | Fire                        |
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
- Shields rendered as blocky arch shapes, fading with damage
