# AGENTS.md — Arcade Hub Agent Instructions

Quick-start reference for AI coding agents. All authoritative rules and conventions are in **`.github/copilot-instructions.md`** — read that file first.

---

## Repository Layout (Critical — Read Before Acting)

```
c:\git\arcade\
├── .github/
│   ├── copilot-instructions.md        ← Authoritative rules & conventions
│   └── prompts/
│       ├── new-game.prompt.md         ← Full checklist for adding a game
│       └── high-score.prompt.md       ← High score wiring guide
├── AGENTS.md                          ← This file (quick-start, non-Copilot agents)
├── plan/
│   └── ARCHITECTURE.md               ← Design decisions, page layout, accent table
├── feature/
│   ├── INDEX.md                       ← Feature history (update when adding features)
│   ├── LANDING_PAGE.md
│   ├── TETRIS.md
│   ├── SNAKE.md
│   ├── SPACE_INVADERS.md
│   ├── ASTEROIDS.md
│   └── HIGH_SCORES.md
├── src/
│   ├── main.tsx                       ← App entry point
│   ├── App.tsx                        ← Route declarations
│   ├── styles/
│   │   ├── globals.css                ← Imported in main.tsx
│   │   └── theme.css                  ← CSS vars — source of truth for all colors
│   ├── components/                    ← Shared UI (ArcadeScreen, GameCard, InitialsOverlay, ScoreTable)
│   ├── pages/                         ← Route-level pages (LandingPage)
│   ├── lib/
│   │   └── highScores.ts             ← Shared high score persistence (localStorage)
│   └── games/
│       ├── registry.ts                ← Add new games here
│       ├── tetris/                    ← Reference: grid-based game
│       ├── snake/                     ← Reference: loop-based game
│       ├── space-invaders/
│       └── asteroids/                 ← Reference: physics/vector game
├── index.html
├── package.json
├── tsconfig.json
└── vite.config.ts
```

---

## Dev Commands

```bash
npm install          # Install dependencies
npm run dev          # Start dev server → http://localhost:5173
npm run build        # Type-check + production build
npm run preview      # Preview production build
```

---

## Adding a New Game

Use the **`.github/prompts/new-game.prompt.md`** prompt — it contains the full ordered checklist, file templates, and build verification steps. High score wiring is in **`.github/prompts/high-score.prompt.md`**.

---

## Feature File Template

Every file in `/feature/` MUST use this header format exactly:

```markdown
# Feature: <Title>

**Status:** ✅ Implemented | 🚧 In Progress | 💤 Planned
**Date requested:** YYYY-MM-DD
**Route:** `/games/<name>`  <!-- use "N/A — <reason>" for cross-cutting features -->

## Summary
One-paragraph description of what the feature is.

## Rules Implemented / What was built
...

## Controls  <!-- omit for non-game features -->
| Key | Action |
| --- | ------ |
| ... | ...    |
```

Do NOT invent alternative title styles (`# GAME NAME — Spec`, `# Game Name`, etc.).
Always use `# Feature: <Title>`.

---

## Rules & Conventions

All coding standards, naming rules, CSS conventions, git commit format, branch naming, and constraints are in **`.github/copilot-instructions.md`**. Do not duplicate them here.
