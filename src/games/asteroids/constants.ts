// ============================================================
// Asteroids — Game Constants
// ============================================================

export const CANVAS_W = 600;
export const CANVAS_H = 600;

// ── Ship ─────────────────────────────────────────────────────
export const SHIP_RADIUS = 12; // collision radius (px)
export const SHIP_SIZE = 16; // nose-to-rear length halved (px), used for rendering
export const ROTATION_SPEED = 3.6; // radians per second
export const THRUST_ACC = 180; // px / s²
export const MAX_SPEED = 350; // px / s — velocity cap
/** Velocity multiplier retained per second (gentle drift like the original). */
export const DRAG_PER_SEC = 0.9;
export const INVUL_MS = 3000; // invulnerability after respawn

// ── Bullets ──────────────────────────────────────────────────
export const BULLET_SPEED = 480; // px / s
export const BULLET_LIFE_MS = 880; // ms before a bullet expires
export const MAX_BULLETS = 4;
export const BULLET_RADIUS = 2;

// ── Asteroids ────────────────────────────────────────────────
export const ASTEROID_SIZES = {
  large: 44,
  medium: 22,
  small: 11,
} as const;

export const ASTEROID_POINTS = {
  large: 20,
  medium: 50,
  small: 100,
} as const;

export const ASTEROID_SPEED_MIN = 35; // px / s
export const ASTEROID_SPEED_MAX = 90; // px / s
/** Number of polygon vertices per asteroid */
export const ASTEROID_VERTS = 12;
/** Fractional variation in vertex radius (0 = perfect circle, 1 = very jagged) */
export const ASTEROID_JITTER = 0.38;

// ── Wave / Life progression ───────────────────────────────────
export const INITIAL_ASTEROIDS = 4; // large asteroids on wave 1
export const WAVE_ASTEROID_INC = 1; // extra large asteroid per wave
export const MAX_INITIAL_LARGE = 11;
export const INITIAL_LIVES = 3;
export const EXTRA_LIFE_SCORE = 10_000; // bonus life every N points
/** Safe spawn distance from ship for new asteroids */
export const SAFE_SPAWN_RADIUS = 120;

// ── UFO (Saucer) ──────────────────────────────────────────────
export const UFO_SMALL_RADIUS = 10;
export const UFO_LARGE_RADIUS = 20;
export const UFO_SPEED = 100; // px / s
export const UFO_BULLET_SPEED = 250;
export const UFO_BULLET_LIFE_MS = 1400;
export const UFO_FIRE_INTERVAL = 1800; // ms between ufo shots
export const UFO_APPEAR_MS = 12_000; // ms between ufo spawns
export const UFO_POINTS_SMALL = 1000;
export const UFO_POINTS_LARGE = 200;

// ── Colors ────────────────────────────────────────────────────
// All canvas drawing uses white-on-black — pure vector style.
export const COLOR_BG = "#000000";
export const COLOR_FG = "#ffffff";
export const COLOR_THRUST = "#ff6600";
export const COLOR_INVUL = "#888888"; // dim ship color during invulnerability
export const COLOR_UFO = "#ffffff";
