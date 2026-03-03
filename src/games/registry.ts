export interface GameEntry {
  id: string;
  title: string;
  description: string;
  route: string;
  /** CSS color used for the card accent / preview background */
  accentColor: string;
  /** Neon CSS var name for border glow matching the accent */
  glowVar: string;
  status: "available" | "coming-soon";
  /** Short comma-separated list of controls shown on the card */
  controls: string;
}

export const GAMES: GameEntry[] = [
  {
    id: "tetris",
    title: "TETRIS",
    description: "Stack falling tetrominoes, clear lines, survive the speed.",
    route: "/games/tetris",
    accentColor: "var(--color-neon-cyan)",
    glowVar: "--border-glow-cyan",
    status: "available",
    controls: "← → rotate ↑  drop ↓  pause P",
  },
  {
    id: "snake",
    title: "SNAKE",
    description:
      "Eat, grow, and don't bite yourself. Speed up with every meal.",
    route: "/games/snake",
    accentColor: "var(--color-neon-green)",
    glowVar: "--border-glow-green",
    status: "available",
    controls: "← → ↑ ↓  or  WASD  pause P",
  },
  {
    id: "space-invaders",
    title: "SPACE INVADERS",
    description:
      "Defend Earth from waves of alien invaders. Shoot fast, dodge faster.",
    route: "/games/space-invaders",
    accentColor: "var(--color-neon-pink)",
    glowVar: "--border-glow-pink",
    status: "available",
    controls: "← →  or  A D  move  SPACE fire  P pause",
  },
  {
    id: "asteroids",
    title: "ASTEROIDS",
    description:
      "Blast rocks to rubble. Survive the fragments. Dodge the saucer.",
    route: "/games/asteroids",
    accentColor: "var(--color-neon-yellow)",
    glowVar: "--border-glow-yellow",
    status: "available",
    controls: "← → rotate  ↑ thrust  SPACE fire  P pause",
  },
];
