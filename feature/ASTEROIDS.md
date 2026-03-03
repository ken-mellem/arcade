# Feature: Asteroids

**Status:** ✅ Implemented
**Date requested:** 2026-03-03
**Route:** `/games/asteroids`

## Summary

Classic vector-arcade Asteroids. The player pilots a triangular spaceship through
a field of tumbling rocks, blasting them apart until the sector is clear. Large
asteroids split into two medium ones; medium into two small. A flying saucer
occasionally crosses the screen and opens fire. Faithful to the 1979 Atari
original: white-on-black vector look, wrap-around edges, momentum-based thrust,
and no fancy UI chrome.

## Rules Implemented / What was built

- **Ship physics** — rotational thrust, velocity with gentle drag, MAX_SPEED cap,
  wrapping screen edges.
- **Bullets** — up to 4 simultaneous player bullets; limited lifetime so you can't
  fill the screen.
- **Asteroid cascade** — Large → 2 Medium → 2 Small → destroyed. Each tier is
  faster and worth more points (20 / 50 / 100).
- **Wave progression** — wave 1 starts with 4 large rocks; each subsequent wave
  adds one more, capped at 11. New wave spawns with a fresh ship at center.
- **UFO (Saucer)** — spawns periodically; large saucer shoots randomly, small
  saucer aims at the player. 200 / 1000 points respectively.
- **Lives & extra life** — 3 lives at start; bonus life every 10 000 points.
- **Invulnerability** — 3 s blinking grace period after each respawn.
- **Death animation** — expanding debris lines play for ~1.5 s before respawning.
- **High-score integration** — uses the shared `highScores.ts` lib; prompts for
  initials on a top-10 entry.
- **Wrap-around ghost rendering** — objects crossing an edge are drawn on both
  sides simultaneously.
- **Vector aesthetic** — pure white strokes on black, irregular asteroid polygons,
  thrust flame in orange, UFO saucer outline.

## Controls

| Key    | Action          |
| ------ | --------------- |
| ← / →  | Rotate ship     |
| ↑      | Thrust          |
| Space  | Fire            |
| P      | Pause / Resume  |
| Enter  | Start / Restart |
| Escape | Return to hub   |
