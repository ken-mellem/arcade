# Feature: Landing Page

**Status:** ✅ Implemented  
**Date requested:** 2026-02-22  
**Route:** `/`

## Summary
An arcade-themed landing page listing all available games. Players select a game
card to enter that game's route.

## Visual Design
- Dark background (`#0a0a0f`) with neon color accents.
- Animated pixel marquee ticker at the top (INSERT COIN, HIGH SCORE, …).
- Responsive flex/grid of `GameCard` components.
- Press Start 2P font throughout.
- Scanline overlay via CSS pseudo-element.
- Blinking cursor in footer.

## Components Used
- `LandingPage` (page)
- `GameCard` (component)
- `ArcadeScreen` (util wrapper, available for game pages)

## Data Source
`src/games/registry.ts` — adding a new `GameEntry` automatically shows a new card.

## Future Enhancements
- [ ] Animated pixel art preview/thumbnail per game.
- [ ] High-score display on card from localStorage.
- [ ] Keyboard navigation (arrow keys to select, Enter to enter game).
- [ ] Sound effect on card hover / selection.
