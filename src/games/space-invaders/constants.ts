// ============================================================
// Space Invaders — Game Constants
// ============================================================

export const CANVAS_W = 560;
export const CANVAS_H = 480;

// ── Player ──────────────────────────────────────────────────
export const PLAYER_W = 40;
export const PLAYER_H = 24;
export const PLAYER_SPEED = 4; // px per tick at 60fps
export const PLAYER_Y = CANVAS_H - 44;
export const PLAYER_MIN_X = PLAYER_W / 2 + 8;
export const PLAYER_MAX_X = CANVAS_W - PLAYER_W / 2 - 8;

// ── Bullets ──────────────────────────────────────────────────
export const PLAYER_BULLET_W = 3;
export const PLAYER_BULLET_H = 12;
export const PLAYER_BULLET_SPEED = 10; // px per tick
export const ENEMY_BULLET_W = 3;
export const ENEMY_BULLET_H = 10;
export const ENEMY_BULLET_SPEED = 3; // px per tick
export const MAX_PLAYER_BULLETS = 1;

// ── Invader grid ─────────────────────────────────────────────
export const INVADER_COLS = 11;
export const INVADER_ROWS = 5;
export const INVADER_W = 26;
export const INVADER_H = 18;
export const INVADER_COL_GAP = 18; // gap between invaders (horizontal)
export const INVADER_ROW_GAP = 12; // gap between rows (vertical)
export const INVADER_STEP_X = INVADER_W + INVADER_COL_GAP; // 44
export const INVADER_STEP_Y = INVADER_H + INVADER_ROW_GAP; // 30
export const INVADER_GRID_W = (INVADER_COLS - 1) * INVADER_STEP_X + INVADER_W; // 466
export const INVADER_GRID_H = (INVADER_ROWS - 1) * INVADER_STEP_Y + INVADER_H; // 138
export const INVADER_START_X = Math.floor((CANVAS_W - INVADER_GRID_W) / 2); // 47
export const INVADER_START_Y = 50;
export const INVADER_MOVE_PX = 8; // px per move step
export const INVADER_DROP_PX = 20; // px to drop when reversing direction
export const INVADER_WALL_MARGIN = 8;
/** ms between move steps — scales with alive count and level */
export const INVADER_MOVE_BASE_MS = 700;
export const INVADER_MOVE_MIN_MS = 40;
/** Y threshold — if invaders reach the player's top edge, game over */
export const INVADER_FLOOR_Y = PLAYER_Y - PLAYER_H;
/** Additional Y offset per wave for invader formation start */
export const INVADER_WAVE_EXTRA_Y = INVADER_STEP_Y; // 30 px per wave
/** Maximum additional Y — caps how far down the formation can start */
export const INVADER_WAVE_MAX_EXTRA = INVADER_STEP_Y * 4; // 120 px

// Points per invader row (row 0 = top)
export const INVADER_POINTS: readonly number[] = [30, 20, 20, 10, 10];

// ── Enemy fire ───────────────────────────────────────────────
export const ENEMY_FIRE_MIN_MS = 500;
export const ENEMY_FIRE_MAX_MS = 1400;

// ── Progression ──────────────────────────────────────────────
/** Score threshold at which the player earns a bonus life (once per game) */
export const BONUS_LIFE_SCORE = 1500;
/** Duration of the player death animation in ms */
export const DEATH_ANIM_MS = 1200;

// ── Shields ──────────────────────────────────────────────────
export const SHIELD_COUNT = 4;
/** Size of each destructible tile in pixels */
export const SHIELD_TILE = 4;
export const SHIELD_COLS = 11; // SHIELD_W / SHIELD_TILE
export const SHIELD_ROWS = 7; // SHIELD_H / SHIELD_TILE
export const SHIELD_W = SHIELD_COLS * SHIELD_TILE; // 44
export const SHIELD_H = SHIELD_ROWS * SHIELD_TILE; // 28
/** Top y of shields — sits well above the player cannon tip */
export const SHIELD_Y = CANVAS_H - 110;

/**
 * Initial tile occupancy for each shield — 11 cols × 7 rows.
 * Rook / fortress silhouette: raised corner battlements, open arch at bottom.
 * 1 = solid tile, 0 = open.
 */
export const SHIELD_SHAPE: ReadonlyArray<ReadonlyArray<0 | 1>> = [
  [1, 1, 0, 0, 0, 0, 0, 0, 0, 1, 1], // battlements — raised corner towers
  [1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1], // solid wall top
  [1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1],
  [1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1],
  [1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1],
  [1, 1, 0, 0, 0, 0, 0, 0, 0, 1, 1], // arch gap
  [1, 1, 0, 0, 0, 0, 0, 0, 0, 1, 1],
];

// ── Mystery ship ─────────────────────────────────────────────
export const MYSTERY_W = 36;
export const MYSTERY_H = 14;
export const MYSTERY_Y = 28;
export const MYSTERY_SPEED = 1.5;
export const MYSTERY_POINTS = 100;
export const MYSTERY_INTERVAL_MIN_MS = 15_000;
export const MYSTERY_INTERVAL_MAX_MS = 30_000;
/** Duration the UFO hit score popup / flash stays on screen in ms */
export const MYSTERY_HIT_MS = 1500;

// ── Colors (CSS var references for JS resolution) ────────────
export const COLOR_PLAYER = "var(--color-neon-green)";
export const COLOR_PLAYER_BULLET = "var(--color-neon-green)";
export const COLOR_ENEMY_BULLET = "var(--color-neon-red)";
export const COLOR_MYSTERY = "var(--color-neon-pink)";
export const COLOR_SHIELD = "var(--color-neon-green)";
export const COLOR_BG = "#04040d";

// Invader colors per row
export const INVADER_ROW_COLORS: readonly string[] = [
  "var(--color-neon-pink)",
  "var(--color-neon-cyan)",
  "var(--color-neon-cyan)",
  "var(--color-neon-yellow)",
  "var(--color-neon-yellow)",
];
