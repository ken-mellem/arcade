// ============================================================
// Asteroids — Pure Game Logic Engine (no React)
// ============================================================

import {
  CANVAS_W,
  CANVAS_H,
  SHIP_RADIUS,
  ROTATION_SPEED,
  THRUST_ACC,
  MAX_SPEED,
  DRAG_PER_SEC,
  INVUL_MS,
  BULLET_SPEED,
  BULLET_LIFE_MS,
  MAX_BULLETS,
  UFO_SMALL_RADIUS,
  UFO_LARGE_RADIUS,
  UFO_SPEED,
  UFO_BULLET_SPEED,
  UFO_BULLET_LIFE_MS,
  UFO_FIRE_INTERVAL,
  UFO_APPEAR_MS,
  UFO_POINTS_SMALL,
  UFO_POINTS_LARGE,
  ASTEROID_SIZES,
  ASTEROID_POINTS,
  ASTEROID_SPEED_MIN,
  ASTEROID_SPEED_MAX,
  ASTEROID_VERTS,
  ASTEROID_JITTER,
  INITIAL_ASTEROIDS,
  WAVE_ASTEROID_INC,
  MAX_INITIAL_LARGE,
  INITIAL_LIVES,
  EXTRA_LIFE_SCORE,
  SAFE_SPAWN_RADIUS,
} from "./constants";

// ── Types ─────────────────────────────────────────────────────

export type AsteroidSize = "large" | "medium" | "small";
export type GameStatus =
  | "idle"
  | "playing"
  | "paused"
  | "dying"
  | "wave-clear"
  | "game-over";

export interface Ship {
  x: number;
  y: number;
  vx: number;
  vy: number;
  /** Heading angle in radians. 0 = right, -π/2 = up (canvas coords). */
  angle: number;
  thrusting: boolean;
  invulTimer: number; // ms of invulnerability remaining
  dying: boolean;
  deathTimer: number; // ms of death-explosion animation remaining
}

export interface Asteroid {
  id: number;
  x: number;
  y: number;
  vx: number;
  vy: number;
  radius: number;
  size: AsteroidSize;
  /** Current visual rotation angle */
  angle: number;
  /** Spin speed in rad/s */
  spin: number;
  /** Per-vertex radius multipliers — length === ASTEROID_VERTS */
  verts: ReadonlyArray<number>;
}

export interface Bullet {
  x: number;
  y: number;
  vx: number;
  vy: number;
  /** Remaining lifetime in ms */
  life: number;
  /** True if fired by the UFO */
  fromUfo: boolean;
}

export interface Ufo {
  x: number;
  y: number;
  vx: number;
  vy: number;
  radius: number;
  size: "large" | "small";
  /** ms until next shot */
  fireTimer: number;
  /** ms until next random direction change */
  dirChangeTimer: number;
}

export interface AsteroidsState {
  status: GameStatus;
  ship: Ship;
  asteroids: Asteroid[];
  bullets: Bullet[];
  ufo: Ufo | null;
  /** ms countdown until next UFO spawn */
  ufoTimer: number;
  score: number;
  highScore: number;
  lives: number;
  wave: number;
  /** Score at which next extra life is awarded */
  nextExtraLife: number;
  /** ms remaining of wave-clear pause */
  waveTimer: number;
  /** ms remaining of death animation */
  deathAnimTimer: number;
  /** Counter for generating unique asteroid ids */
  nextId: number;
}

export type AsteroidsAction =
  | {
      type: "TICK";
      dt: number;
      rotLeft: boolean;
      rotRight: boolean;
      thrust: boolean;
      shoot: boolean;
    }
  | { type: "START" }
  | { type: "RESTART" }
  | { type: "PAUSE_TOGGLE" };

// ── Constants ──────────────────────────────────────────────────

const WAVE_CLEAR_MS = 2200;
const DEATH_ANIM_MS = 1500;
const RESPAWN_MS = 500; // pause after death anim before spawning

// ── Helpers ────────────────────────────────────────────────────

/** Wrap a coordinate around the playing field boundaries. */
function wrap(v: number, max: number): number {
  if (v < 0) return v + max;
  if (v >= max) return v - max;
  return v;
}

/** Circular distance check (Euclidean). */
function dist(ax: number, ay: number, bx: number, by: number): number {
  const dx = ax - bx;
  const dy = ay - by;
  return Math.sqrt(dx * dx + dy * dy);
}

/** Generate a single asteroid's random vertex radius multipliers. */
function generateVerts(rng: () => number): ReadonlyArray<number> {
  const v: number[] = [];
  for (let i = 0; i < ASTEROID_VERTS; i++) {
    v.push(1 - ASTEROID_JITTER / 2 + rng() * ASTEROID_JITTER);
  }
  return v;
}

/** Create a new asteroid avoiding the safe zone around (safeX, safeY). */
function createAsteroid(
  id: number,
  size: AsteroidSize,
  safeX: number,
  safeY: number,
  rng: () => number,
): Asteroid {
  let x = 0;
  let y = 0;
  let tries = 0;
  do {
    x = rng() * CANVAS_W;
    y = rng() * CANVAS_H;
    tries++;
  } while (dist(x, y, safeX, safeY) < SAFE_SPAWN_RADIUS && tries < 50);

  const angle = rng() * Math.PI * 2;
  const speed =
    ASTEROID_SPEED_MIN + rng() * (ASTEROID_SPEED_MAX - ASTEROID_SPEED_MIN);
  const spinDir = rng() < 0.5 ? 1 : -1;
  const spin = spinDir * (0.3 + rng() * 0.9);

  return {
    id,
    x,
    y,
    vx: Math.cos(angle) * speed,
    vy: Math.sin(angle) * speed,
    radius: ASTEROID_SIZES[size],
    size,
    angle: 0,
    spin,
    verts: generateVerts(rng),
  };
}

/** Spawn child asteroids when a larger one is destroyed. */
function splitAsteroid(
  parent: Asteroid,
  startId: number,
  impactVx: number,
  impactVy: number,
  rng: () => number,
): Asteroid[] {
  const childSize: AsteroidSize | null =
    parent.size === "large"
      ? "medium"
      : parent.size === "medium"
        ? "small"
        : null;
  if (!childSize) return [];

  return [0, 1].map((i) => {
    const spreadAngle =
      Math.atan2(impactVy, impactVx) +
      (i === 0 ? 1 : -1) * (Math.PI / 3 + rng() * 0.4);
    const speed =
      ASTEROID_SPEED_MIN * 1.2 +
      rng() * (ASTEROID_SPEED_MAX - ASTEROID_SPEED_MIN);
    const spinDir = rng() < 0.5 ? 1 : -1;

    return {
      id: startId + i,
      x: parent.x,
      y: parent.y,
      vx: Math.cos(spreadAngle) * speed,
      vy: Math.sin(spreadAngle) * speed,
      radius: ASTEROID_SIZES[childSize],
      size: childSize,
      angle: 0,
      spin: spinDir * (0.4 + rng() * 1.2),
      verts: generateVerts(rng),
    };
  });
}

function createShip(): Ship {
  return {
    x: CANVAS_W / 2,
    y: CANVAS_H / 2,
    vx: 0,
    vy: 0,
    angle: -Math.PI / 2, // pointing up
    thrusting: false,
    invulTimer: INVUL_MS,
    dying: false,
    deathTimer: 0,
  };
}

function createWaveAsteroids(
  wave: number,
  shipX: number,
  shipY: number,
  startId: number,
): { asteroids: Asteroid[]; nextId: number } {
  const count = Math.min(
    INITIAL_ASTEROIDS + (wave - 1) * WAVE_ASTEROID_INC,
    MAX_INITIAL_LARGE,
  );
  const asteroids: Asteroid[] = [];
  let id = startId;
  for (let i = 0; i < count; i++) {
    asteroids.push(createAsteroid(id++, "large", shipX, shipY, Math.random));
  }
  return { asteroids, nextId: id };
}

export function createInitialState(highScore = 0): AsteroidsState {
  const ship = createShip();
  return {
    status: "idle",
    ship,
    asteroids: [],
    bullets: [],
    ufo: null,
    ufoTimer: UFO_APPEAR_MS,
    score: 0,
    highScore,
    lives: INITIAL_LIVES,
    wave: 1,
    nextExtraLife: EXTRA_LIFE_SCORE,
    waveTimer: 0,
    deathAnimTimer: 0,
    nextId: 100,
  };
}

function startGame(state: AsteroidsState): AsteroidsState {
  const ship = createShip();
  const { asteroids, nextId } = createWaveAsteroids(
    1,
    ship.x,
    ship.y,
    state.nextId,
  );
  return {
    ...state,
    status: "playing",
    ship,
    asteroids,
    bullets: [],
    ufo: null,
    ufoTimer: UFO_APPEAR_MS,
    score: 0,
    lives: INITIAL_LIVES,
    wave: 1,
    nextExtraLife: EXTRA_LIFE_SCORE,
    waveTimer: 0,
    deathAnimTimer: 0,
    nextId,
  };
}

// ── UFO helpers ────────────────────────────────────────────────

function spawnUfo(wave: number, state: AsteroidsState): Ufo {
  const fromLeft = Math.random() < 0.5;
  const x = fromLeft ? -UFO_LARGE_RADIUS : CANVAS_W + UFO_LARGE_RADIUS;
  const y = 30 + Math.random() * (CANVAS_H - 60);
  const size: "large" | "small" =
    wave >= 3 || state.score > 10000 ? "small" : "large";
  const radius = size === "small" ? UFO_SMALL_RADIUS : UFO_LARGE_RADIUS;
  const dir = fromLeft ? 1 : -1;

  return {
    x,
    y,
    vx: dir * UFO_SPEED,
    vy: (Math.random() - 0.5) * UFO_SPEED * 0.5,
    radius,
    size,
    fireTimer: UFO_FIRE_INTERVAL,
    dirChangeTimer: 1500 + Math.random() * 1500,
  };
}

function ufoShootAt(
  ufo: Ufo,
  ship: Ship,
  startId: number,
): { bullet: Bullet; nextId: number } {
  let angle: number;
  if (ufo.size === "small") {
    // Small UFO leads the target slightly
    const dx = ship.x - ufo.x;
    const dy = ship.y - ufo.y;
    angle = Math.atan2(dy, dx) + (Math.random() - 0.5) * 0.15;
  } else {
    // Large UFO shoots randomly
    angle = Math.random() * Math.PI * 2;
  }

  return {
    bullet: {
      x: ufo.x,
      y: ufo.y,
      vx: Math.cos(angle) * UFO_BULLET_SPEED,
      vy: Math.sin(angle) * UFO_BULLET_SPEED,
      life: UFO_BULLET_LIFE_MS,
      fromUfo: true,
    },
    nextId: startId + 1,
  };
}

// ── Main Reducer ───────────────────────────────────────────────

export function asteroidsReducer(
  state: AsteroidsState,
  action: AsteroidsAction,
): AsteroidsState {
  switch (action.type) {
    case "START":
      if (state.status === "idle") return startGame(state);
      return state;

    case "RESTART":
      if (state.status === "game-over") {
        return startGame({
          ...state,
          highScore: Math.max(state.highScore, state.score),
        });
      }
      return state;

    case "PAUSE_TOGGLE":
      if (state.status === "playing") return { ...state, status: "paused" };
      if (state.status === "paused") return { ...state, status: "playing" };
      return state;

    case "TICK":
      return tickReducer(
        state,
        action.dt,
        action.rotLeft,
        action.rotRight,
        action.thrust,
        action.shoot,
      );

    default:
      return state;
  }
}

// ── Tick logic ─────────────────────────────────────────────────

function tickReducer(
  state: AsteroidsState,
  dt: number,
  rotLeft: boolean,
  rotRight: boolean,
  thrust: boolean,
  shoot: boolean,
): AsteroidsState {
  if (state.status === "paused") return state;

  const dtS = dt / 1000; // convert ms → seconds

  // ── Handle wave-clear countdown ────────────────────────────
  if (state.status === "wave-clear") {
    const waveTimer = state.waveTimer - dt;
    if (waveTimer <= 0) {
      const nextWave = state.wave + 1;
      const ship = createShip();
      const { asteroids, nextId } = createWaveAsteroids(
        nextWave,
        ship.x,
        ship.y,
        state.nextId,
      );
      return {
        ...state,
        status: "playing",
        wave: nextWave,
        ship,
        asteroids,
        bullets: [],
        ufo: null,
        ufoTimer: UFO_APPEAR_MS,
        waveTimer: 0,
        nextId,
      };
    }
    return { ...state, waveTimer };
  }

  // ── Handle death-animation countdown ──────────────────────
  if (state.status === "dying") {
    const deathAnimTimer = state.deathAnimTimer - dt;
    if (deathAnimTimer <= 0) {
      const lives = state.lives - 1;
      if (lives < 0) {
        return {
          ...state,
          status: "game-over",
          highScore: Math.max(state.highScore, state.score),
          deathAnimTimer: 0,
          bullets: [],
          ufo: null,
        };
      }
      const ship = createShip();
      return {
        ...state,
        status: "playing",
        lives,
        ship,
        bullets: state.bullets.filter((b) => b.fromUfo),
        deathAnimTimer: 0,
      };
    }
    // During death, advance asteroids/bullets but nothing else
    return tickPassive({ ...state, deathAnimTimer });
  }

  if (state.status !== "playing") return state;

  let {
    ship,
    bullets,
    asteroids,
    ufo,
    ufoTimer,
    score,
    lives,
    nextExtraLife,
    nextId,
  } = state;

  // ── Rotate ship ────────────────────────────────────────────
  if (rotLeft) ship = { ...ship, angle: ship.angle - ROTATION_SPEED * dtS };
  if (rotRight) ship = { ...ship, angle: ship.angle + ROTATION_SPEED * dtS };

  // ── Thrust ─────────────────────────────────────────────────
  ship = { ...ship, thrusting: thrust };
  if (thrust) {
    const nvx = ship.vx + Math.cos(ship.angle) * THRUST_ACC * dtS;
    const nvy = ship.vy + Math.sin(ship.angle) * THRUST_ACC * dtS;
    const spd = Math.sqrt(nvx * nvx + nvy * nvy);
    if (spd > MAX_SPEED) {
      const scale = MAX_SPEED / spd;
      ship = { ...ship, vx: nvx * scale, vy: nvy * scale };
    } else {
      ship = { ...ship, vx: nvx, vy: nvy };
    }
  }

  // ── Apply drag ─────────────────────────────────────────────
  const drag = Math.pow(DRAG_PER_SEC, dtS);
  ship = { ...ship, vx: ship.vx * drag, vy: ship.vy * drag };

  // ── Move ship (wrap) ───────────────────────────────────────
  ship = {
    ...ship,
    x: wrap(ship.x + ship.vx * dtS, CANVAS_W),
    y: wrap(ship.y + ship.vy * dtS, CANVAS_H),
    invulTimer: Math.max(0, ship.invulTimer - dt),
  };

  // ── Shoot ──────────────────────────────────────────────────
  const playerBulletCount = bullets.filter((b) => !b.fromUfo).length;
  if (shoot && playerBulletCount < MAX_BULLETS) {
    bullets = [
      ...bullets,
      {
        x: ship.x + Math.cos(ship.angle) * (SHIP_RADIUS + 4),
        y: ship.y + Math.sin(ship.angle) * (SHIP_RADIUS + 4),
        vx: ship.vx + Math.cos(ship.angle) * BULLET_SPEED,
        vy: ship.vy + Math.sin(ship.angle) * BULLET_SPEED,
        life: BULLET_LIFE_MS,
        fromUfo: false,
      },
    ];
  }

  // ── Move bullets (and expire) ──────────────────────────────
  bullets = bullets
    .map((b) => ({
      ...b,
      x: wrap(b.x + b.vx * dtS, CANVAS_W),
      y: wrap(b.y + b.vy * dtS, CANVAS_H),
      life: b.life - dt,
    }))
    .filter((b) => b.life > 0);

  // ── Move asteroids (wrap + rotate) ────────────────────────
  asteroids = asteroids.map((a) => ({
    ...a,
    x: wrap(a.x + a.vx * dtS, CANVAS_W),
    y: wrap(a.y + a.vy * dtS, CANVAS_H),
    angle: a.angle + a.spin * dtS,
  }));

  // ── UFO logic ──────────────────────────────────────────────
  let newUfoTimer = ufoTimer - dt;
  if (!ufo && newUfoTimer <= 0) {
    ufo = spawnUfo(state.wave, state);
    newUfoTimer = UFO_APPEAR_MS + Math.random() * 5000;
  }

  if (ufo) {
    let u = { ...ufo };

    // Random y-drift direction changes
    u.dirChangeTimer -= dt;
    if (u.dirChangeTimer <= 0) {
      u.vy = (Math.random() - 0.5) * UFO_SPEED;
      u.dirChangeTimer = 1000 + Math.random() * 1500;
    }

    u.x = wrap(u.x + u.vx * dtS, CANVAS_W);
    u.y = Math.max(20, Math.min(CANVAS_H - 20, u.y + u.vy * dtS));

    // UFO fires at ship
    u.fireTimer -= dt;
    if (u.fireTimer <= 0) {
      const { bullet } = ufoShootAt(u, ship, nextId);
      bullets = [...bullets, bullet];
      u.fireTimer = UFO_FIRE_INTERVAL;
    }

    // Remove UFO if it exits canvas horizontally (it travels across)
    if (u.x < -u.radius * 3 || u.x > CANVAS_W + u.radius * 3) {
      ufo = null;
      newUfoTimer = UFO_APPEAR_MS + Math.random() * 4000;
    } else {
      ufo = u;
    }
  }

  // ── Bullet ↔ Asteroid collisions ─────────────────────────
  const hitBullets = new Set<number>();
  const hitAsteroids = new Set<number>();
  const newAsteroids: Asteroid[] = [];
  let scoreGain = 0;

  bullets.forEach((b, bi) => {
    if (b.fromUfo) return;
    asteroids.forEach((a) => {
      if (hitAsteroids.has(a.id)) return;
      if (dist(b.x, b.y, a.x, a.y) < a.radius) {
        hitBullets.add(bi);
        hitAsteroids.add(a.id);
        scoreGain += ASTEROID_POINTS[a.size];
        const children = splitAsteroid(a, nextId, b.vx, b.vy, Math.random);
        newAsteroids.push(...children);
        nextId += children.length;
      }
    });
  });

  // ── Bullet ↔ UFO collisions ───────────────────────────────
  if (ufo) {
    bullets.forEach((b, bi) => {
      if (b.fromUfo || !ufo) return;
      if (dist(b.x, b.y, ufo.x, ufo.y) < ufo.radius) {
        hitBullets.add(bi);
        scoreGain += ufo.size === "small" ? UFO_POINTS_SMALL : UFO_POINTS_LARGE;
        ufo = null;
        newUfoTimer = UFO_APPEAR_MS + Math.random() * 5000;
      }
    });
  }

  score += scoreGain;

  // Award bonus life
  let newNextExtraLife = nextExtraLife;
  if (score >= nextExtraLife) {
    lives += 1;
    newNextExtraLife += EXTRA_LIFE_SCORE;
  }

  bullets = bullets.filter((_, i) => !hitBullets.has(i));
  asteroids = [
    ...asteroids.filter((a) => !hitAsteroids.has(a.id)),
    ...newAsteroids,
  ];

  // ── Ship ↔ Asteroid / Bullet collision ────────────────────
  let shipHit = false;
  if (ship.invulTimer <= 0) {
    for (const a of asteroids) {
      if (dist(ship.x, ship.y, a.x, a.y) < SHIP_RADIUS + a.radius * 0.75) {
        shipHit = true;
        break;
      }
    }
    if (!shipHit && ufo) {
      if (dist(ship.x, ship.y, ufo.x, ufo.y) < SHIP_RADIUS + ufo.radius) {
        shipHit = true;
      }
    }
    if (!shipHit) {
      for (const b of bullets) {
        if (b.fromUfo && dist(b.x, b.y, ship.x, ship.y) < SHIP_RADIUS) {
          shipHit = true;
          break;
        }
      }
    }
  }

  if (shipHit) {
    return {
      ...state,
      status: "dying",
      ship: { ...ship, dying: true, thrusting: false },
      asteroids,
      bullets,
      ufo,
      ufoTimer: newUfoTimer,
      score,
      lives,
      nextExtraLife: newNextExtraLife,
      deathAnimTimer: DEATH_ANIM_MS + RESPAWN_MS,
      nextId,
      highScore: Math.max(state.highScore, score),
    };
  }

  // ── Wave clear ─────────────────────────────────────────────
  if (asteroids.length === 0 && ufo === null) {
    return {
      ...state,
      status: "wave-clear",
      ship,
      asteroids: [],
      bullets,
      ufo: null,
      ufoTimer: UFO_APPEAR_MS,
      score,
      lives,
      nextExtraLife: newNextExtraLife,
      waveTimer: WAVE_CLEAR_MS,
      nextId,
      highScore: Math.max(state.highScore, score),
    };
  }

  return {
    ...state,
    status: "playing",
    ship,
    asteroids,
    bullets,
    ufo,
    ufoTimer: newUfoTimer,
    score,
    lives,
    nextExtraLife: newNextExtraLife,
    nextId,
    highScore: Math.max(state.highScore, score),
  };
}

/** Advance only passive elements (asteroids + bullets) — used during death anim. */
function tickPassive(state: AsteroidsState): AsteroidsState {
  const dtS = 16 / 1000; // assume ~16 ms frame during passive tick (rough)
  return {
    ...state,
    asteroids: state.asteroids.map((a) => ({
      ...a,
      x: wrap(a.x + a.vx * dtS, CANVAS_W),
      y: wrap(a.y + a.vy * dtS, CANVAS_H),
      angle: a.angle + a.spin * dtS,
    })),
    bullets: state.bullets
      .map((b) => ({
        ...b,
        x: wrap(b.x + b.vx * dtS, CANVAS_W),
        y: wrap(b.y + b.vy * dtS, CANVAS_H),
        life: b.life - 16,
      }))
      .filter((b) => b.life > 0),
  };
}
