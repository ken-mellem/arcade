# GitHub Copilot Custom Instructions — Arcade Hub

## Project Context

This is a browser-based arcade game hub built with **Vite + React 18 + TypeScript**.
Games render on HTML5 Canvas. Routing is React Router v6. Styling is CSS Modules with
CSS custom properties (no Tailwind, no styled-components).

## Coding Standards

### General

- Always use TypeScript strict mode. No `any` unless absolutely unavoidable.
- Prefer named exports over default exports for components (exception: page-level route components).
- Prefer functional components and hooks. No class components.
- All files in `src/games/<name>/` should be self-contained — engine files must have zero React imports.
- Format imports: React first, then third-party, then local (relative paths).

### Naming

- Components: `PascalCase.tsx`
- Hooks: `useCamelCase.ts`
- CSS Modules: `ComponentName.module.css` (co-located with component)
- Engine/logic: `PascalCaseName.ts` (pure TypeScript)
- Constants: `constants.ts` inside each game folder

### Game Architecture Pattern

Every game MUST follow this pattern:

```
src/games/<gameName>/
├── constants.ts      – board size, piece data, scoring tables
├── <GameName>Engine.ts  – pure reducer logic, zero React
├── use<GameName>.ts  – React hook: RAF loop, keyboard, state wiring
├── <GameName>Page.tsx  – Route component with canvas + HUD
└── <GameName>Page.module.css
```

### Canvas Rendering

- Draw inside `useEffect` gated on relevant state slices.
- Use `image-rendering: pixelated` on all game canvases.
- Never import CSS variables into JS — resolve them at runtime with `getComputedStyle`.

### Adding a New Game

1. Create the game folder under `src/games/<name>/`.
2. Add a `GameEntry` to `src/games/registry.ts`.
3. Add a `<Route>` in `src/App.tsx`.
4. Create feature doc in `/feature/` and update `/feature/INDEX.md`.
5. If the game requires architectural decisions, create a plan doc in `/plan/`.

## CSS / Theming

- All colors MUST reference CSS custom properties from `src/styles/theme.css`.
- Do not hard-code hex colors in component CSS.
- Neon glow effects: use the `--glow-*` and `--border-glow-*` variables.
- Animations: use the keyframes defined in `theme.css` (blink, marquee, pulse-glow, slide-up).

## File & Folder Conventions

- `/plan/` — architecture decision records and feature planning docs.
- `/feature/` — one markdown file per requested feature, plus `INDEX.md` history.
- `src/components/` — shared UI components (ArcadeScreen, GameCard).
- `src/pages/` — top-level route pages (LandingPage).
- `src/games/` — one folder per game + `registry.ts`.
- `src/styles/` — global CSS only (`globals.css`, `theme.css`).

## What to Avoid

- Do NOT add any backend, server, or database tooling.
- Do NOT use Tailwind, MUI, Chakra, or any component library.
- Do NOT use global state managers (Redux, Zustand) — game state lives in hooks.
- Do NOT create markdown summary files unless the user explicitly asks.
