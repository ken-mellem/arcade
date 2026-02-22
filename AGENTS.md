# AGENTS.md — Arcade Hub Agent Instructions

This file provides instructions for AI coding agents working on the Arcade Hub project.
It complements `.github/copilot-instructions.md`.

---

## Repository Layout (Critical — Read Before Acting)

```
c:\git\arcade\
├── .github/copilot-instructions.md   ← Copilot custom instructions
├── AGENTS.md                          ← This file
├── plan/
│   └── ARCHITECTURE.md               ← Tech decisions, structure, extension guide
├── feature/
│   ├── INDEX.md                       ← Feature history (update when adding features)  
│   ├── LANDING_PAGE.md
│   └── TETRIS.md
├── src/
│   ├── main.tsx                       ← App entry point
│   ├── App.tsx                        ← Route declarations
│   ├── styles/
│   │   ├── globals.css                ← Imported in main.tsx
│   │   └── theme.css                  ← CSS vars — source of truth for all colors
│   ├── components/                    ← Shared UI
│   ├── pages/                         ← Route-level pages
│   └── games/
│       ├── registry.ts                ← Add new games here
│       └── tetris/                    ← Example game to reference
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

## Task Checklist for Adding a New Game

- [ ] Create `src/games/<name>/constants.ts`
- [ ] Create `src/games/<name>/<Name>Engine.ts` (pure TS, no React)
- [ ] Create `src/games/<name>/use<Name>.ts` (React hook)
- [ ] Create `src/games/<name>/<Name>Page.tsx` + `.module.css`
- [ ] Register in `src/games/registry.ts`
- [ ] Add `<Route>` in `src/App.tsx`
- [ ] Create `feature/<NAME>.md` doc
- [ ] Update `feature/INDEX.md`

---

## Important Constraints

1. **No backend** — this is a pure client-side app.
2. **TypeScript strict mode** — no `any` without justification.
3. **CSS Modules only** — no inline styles except for CSS custom property overrides via `style` prop.
4. **Pure game engines** — files in `src/games/<name>/` except the Page and hook must import nothing from React.
5. **Colors via CSS vars** — always use variables from `theme.css`.
6. **Run `npm run build` after making changes** to verify no TypeScript or build errors.
7. **Update `/feature/INDEX.md`** whenever a new feature is added.

---

## Code Style Quick Reference

```typescript
// ✅ Good
import type { FC } from 'react'
const MyComponent: FC<Props> = ({ value }) => { ... }

// ✅ Good — engine function
export function isValidPosition(board: Board, piece: Piece): boolean { ... }

// ❌ Bad — React inside engine
import { useEffect } from 'react' // never in *Engine.ts files

// ✅ Good — CSS custom property override
<div style={{ '--accent': 'var(--color-neon-pink)' } as React.CSSProperties}>
```
