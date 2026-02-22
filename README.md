# 🕹️ Arcade Hub

A browser-based retro arcade game hub built with **Vite + React 18 + TypeScript**.
Pick a game from the neon-lit landing page and play it in a CRT-framed canvas — no backend, runs entirely in the browser.

---

## Games

| Game   | Status      | Controls                                                                                           |
| ------ | ----------- | -------------------------------------------------------------------------------------------------- |
| Tetris | ✅ Available | `← →` move · `↑` rotate · `↓` soft drop · `Space` hard drop · `C` hold · `P` pause · `Enter` start |
| Snake  | ✅ Available | `← → ↑ ↓` or `WASD` move · `P` pause · `Enter` start                                               |

---

## Getting Started

**Prerequisites:** Node.js 18+, npm

```bash
# Clone the repo
git clone <repo-url>
cd arcade

# Install dependencies
npm install

# Start the dev server
npm run dev
```

Open [http://localhost:5173](http://localhost:5173) in your browser.

### Other commands

```bash
npm run build      # Type-check + production build  (output: dist/)
npm run preview    # Serve the production build locally
```

---

## Tech Stack

| Layer              | Choice                              |
| ------------------ | ----------------------------------- |
| Build / Dev server | Vite 5                              |
| UI Framework       | React 18 + TypeScript               |
| Routing            | React Router v6                     |
| Game rendering     | HTML5 Canvas API                    |
| Styling            | CSS Modules + CSS custom properties |
| Font               | Press Start 2P (Google Fonts)       |

---

## Project Structure

```
src/
├── main.tsx                  # App entry point
├── App.tsx                   # Route declarations
├── styles/
│   ├── globals.css           # Reset + base styles
│   └── theme.css             # CSS vars: neon palette, animations, CRT effects
├── components/
│   ├── ArcadeScreen          # CRT bezel wrapper component
│   └── GameCard              # Landing page game card
├── pages/
│   └── LandingPage           # Game selector page
└── games/
    ├── registry.ts           # Central list of all games
    └── tetris/               # Tetris implementation
        ├── constants.ts
        ├── TetrisEngine.ts   # Pure game logic (no React)
        ├── useTetris.ts      # React hook: game loop + input
        ├── TetrisPage.tsx    # Canvas + HUD layout
        └── TetrisPage.module.css
```

See [plan/ARCHITECTURE.md](plan/ARCHITECTURE.md) for the full architecture decision record.

---

## Adding a New Game

1. Create `src/games/<name>/` with engine, hook, page, and constants files.
2. Add a `GameEntry` to `src/games/registry.ts` — the card appears automatically.
3. Add a `<Route>` in `src/App.tsx`.
4. Create `feature/<NAME>.md` and update `feature/INDEX.md`.

Full checklist in [AGENTS.md](AGENTS.md).

---

## Contributing

### Commit Messages — [Conventional Commits](https://www.conventionalcommits.org/)

```
<type>(<optional scope>): <short description>
```

| Type       | When to use                           |
| ---------- | ------------------------------------- |
| `feat`     | New feature or game                   |
| `fix`      | Bug fix                               |
| `chore`    | Tooling, deps, config, cleanup        |
| `style`    | CSS / visual-only changes             |
| `refactor` | Code restructure, no behaviour change |
| `docs`     | Documentation only                    |
| `perf`     | Performance improvement               |
| `test`     | Adding or fixing tests                |

### Branch Naming

```
<type>/<short-kebab-description>
```

Examples: `feat/snake-game` · `fix/tetris-rotation-wallkick` · `chore/upgrade-dependencies`

---

## Feature History

See [feature/INDEX.md](feature/INDEX.md) for a log of all implemented features.
