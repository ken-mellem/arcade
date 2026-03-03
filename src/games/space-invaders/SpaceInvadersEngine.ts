// ============================================================
// Space Invaders — Pure Game Logic Engine (no React)
// ============================================================

import {
  CANVAS_W,
  CANVAS_H,
  PLAYER_SPEED,
  PLAYER_MIN_X,
  PLAYER_MAX_X,
  PLAYER_Y,
  PLAYER_W,
  PLAYER_H,
  PLAYER_BULLET_W,
  PLAYER_BULLET_H,
  PLAYER_BULLET_SPEED,
  ENEMY_BULLET_SPEED,
  ENEMY_BULLET_H,
  MAX_PLAYER_BULLETS,
  INVADER_COLS,
  INVADER_ROWS,
  INVADER_W,
  INVADER_H,
  INVADER_STEP_X,
  INVADER_STEP_Y,
  INVADER_START_X,
  INVADER_START_Y,
  INVADER_MOVE_PX,
  INVADER_DROP_PX,
  INVADER_WALL_MARGIN,
  INVADER_MOVE_BASE_MS,
  INVADER_MOVE_MIN_MS,
  INVADER_FLOOR_Y,
  INVADER_POINTS,
  ENEMY_FIRE_MIN_MS,
  ENEMY_FIRE_MAX_MS,
  SHIELD_COUNT,
  SHIELD_W,
  SHIELD_H,
  SHIELD_Y,
  SHIELD_TILE,
  SHIELD_COLS,
  SHIELD_ROWS,
  SHIELD_SHAPE,
  MYSTERY_W,
  MYSTERY_H,
  MYSTERY_Y,
  MYSTERY_SPEED,
  MYSTERY_POINTS,
  MYSTERY_INTERVAL_MIN_MS,
  MYSTERY_INTERVAL_MAX_MS,
  MYSTERY_HIT_MS,
  BONUS_LIFE_SCORE,
  DEATH_ANIM_MS,
  INVADER_WAVE_EXTRA_Y,
  INVADER_WAVE_MAX_EXTRA,
} from "./constants";

// ── Types ─────────────────────────────────────────────────

export interface Bullet {
  x: number;
  y: number;
}

export interface Invader {
  row: number;
  col: number;
  alive: boolean;
}

export interface Shield {
  x: number;
  y: number;
  /** Tile occupancy grid [row][col] — false = destroyed */
  cells: boolean[][];
}

export interface MysteryShip {
  x: number;
  /** +1 = right, -1 = left */
  dir: 1 | -1;
  active: boolean;
}

export interface MysteryHit {
  /** Centre-x of the ship when it was destroyed */
  x: number;
  score: number;
  /** Remaining display time in ms */
  timer: number;
}

export interface SpaceInvadersState {
  playerX: number;
  playerBullets: Bullet[];
  enemyBullets: Bullet[];
  /** [row][col] flat array — row-major */
  invaders: Invader[][];
  invaderOffsetX: number;
  invaderOffsetY: number;
  invaderDir: 1 | -1;
  /** Accumulated ms since last invader move */
  invaderMoveAcc: number;
  /** Accumulated ms since last enemy fire */
  enemyFireAcc: number;
  /** ms until next enemy fire event */
  enemyFireInterval: number;
  /** Accumulated ms until next mystery ship spawn */
  mysteryAcc: number;
  mysteryInterval: number;
  mysteryShip: MysteryShip | null;
  /** Non-null while the UFO hit score popup is visible */
  mysteryHit: MysteryHit | null;
  shields: Shield[];
  score: number;
  highScore: number;
  lives: number;
  level: number;
  /** Sprite animation frame — toggles each move step */
  invaderFrame: 0 | 1;
  /** True once the 1,500-point bonus life has been awarded */
  bonusLifeAwarded: boolean;
  /** ms remaining in death animation; 0 when not dying */
  deathTimer: number;
  status: "idle" | "playing" | "paused" | "game-over" | "level-clear" | "dying";
}

// ── Factory helpers ───────────────────────────────────────

function buildInvaders(): Invader[][] {
  return Array.from({ length: INVADER_ROWS }, (_, row) =>
    Array.from({ length: INVADER_COLS }, (_, col) => ({
      row,
      col,
      alive: true,
    })),
  );
}

function buildShields(): Shield[] {
  const totalW = SHIELD_COUNT * SHIELD_W;
  const gap = Math.floor((CANVAS_W - totalW) / (SHIELD_COUNT + 1));
  return Array.from({ length: SHIELD_COUNT }, (_, i) => ({
    x: gap + i * (SHIELD_W + gap),
    y: SHIELD_Y,
    cells: SHIELD_SHAPE.map((row) => row.map((v) => v === 1)),
  }));
}

function randomEnemyFireInterval(): number {
  return (
    ENEMY_FIRE_MIN_MS + Math.random() * (ENEMY_FIRE_MAX_MS - ENEMY_FIRE_MIN_MS)
  );
}

function randomMysteryInterval(): number {
  return (
    MYSTERY_INTERVAL_MIN_MS +
    Math.random() * (MYSTERY_INTERVAL_MAX_MS - MYSTERY_INTERVAL_MIN_MS)
  );
}

export function createInitialState(level = 1): SpaceInvadersState {
  const waveExtraY = Math.min(
    INVADER_WAVE_MAX_EXTRA,
    (level - 1) * INVADER_WAVE_EXTRA_Y,
  );
  return {
    playerX: CANVAS_W / 2,
    playerBullets: [],
    enemyBullets: [],
    invaders: buildInvaders(),
    invaderOffsetX: INVADER_START_X,
    invaderOffsetY: INVADER_START_Y + waveExtraY,
    invaderDir: 1,
    invaderFrame: 0,
    invaderMoveAcc: 0,
    enemyFireAcc: 0,
    enemyFireInterval: randomEnemyFireInterval(),
    mysteryAcc: 0,
    mysteryInterval: randomMysteryInterval(),
    mysteryShip: null,
    mysteryHit: null,
    shields: buildShields(),
    score: 0,
    highScore: 0,
    lives: 3,
    level,
    bonusLifeAwarded: false,
    deathTimer: 0,
    status: "idle",
  };
}

// ── Utility ───────────────────────────────────────────────

export function getAliveCount(invaders: Invader[][]): number {
  let count = 0;
  for (const row of invaders) for (const inv of row) if (inv.alive) count++;
  return count;
}

export function getInvaderMoveInterval(alive: number, level: number): number {
  const ratio = alive / (INVADER_ROWS * INVADER_COLS);
  const levelMult = Math.pow(0.75, level - 1);
  return Math.max(
    INVADER_MOVE_MIN_MS,
    Math.round(INVADER_MOVE_BASE_MS * ratio * levelMult),
  );
}

/** Returns pixel rect {x, y} for an invader (top-left of sprite) */
export function invaderRect(inv: Invader, offsetX: number, offsetY: number) {
  return {
    x: offsetX + inv.col * INVADER_STEP_X,
    y: offsetY + inv.row * INVADER_STEP_Y,
    w: INVADER_W,
    h: INVADER_H,
  };
}

// ── Actions ───────────────────────────────────────────────

export type SpaceInvadersAction =
  | { type: "START" }
  | { type: "RESTART" }
  | { type: "NEXT_LEVEL" }
  | { type: "PAUSE_TOGGLE" }
  | {
      type: "TICK";
      dt: number;
      moveLeft: boolean;
      moveRight: boolean;
      shoot: boolean;
    };

// ── Reducer ───────────────────────────────────────────────

export function spaceInvadersReducer(
  state: SpaceInvadersState,
  action: SpaceInvadersAction,
): SpaceInvadersState {
  switch (action.type) {
    case "START":
      return { ...state, status: "playing" };

    case "RESTART": {
      const fresh = createInitialState();
      return { ...fresh, highScore: state.highScore, status: "playing" };
    }

    case "NEXT_LEVEL": {
      const nextLevel = state.level + 1;
      const fresh = createInitialState(nextLevel);
      return {
        ...fresh,
        score: state.score,
        highScore: state.highScore,
        lives: state.lives,
        bonusLifeAwarded: state.bonusLifeAwarded,
        level: nextLevel,
        status: "playing",
      };
    }

    case "PAUSE_TOGGLE":
      if (state.status === "playing") return { ...state, status: "paused" };
      if (state.status === "paused") return { ...state, status: "playing" };
      return state;

    case "TICK": {
      // ── Always tick mystery hit popup (regardless of game status) ──
      let mysteryHit = state.mysteryHit;
      if (mysteryHit) {
        const mhRemaining = mysteryHit.timer - action.dt;
        mysteryHit =
          mhRemaining <= 0 ? null : { ...mysteryHit, timer: mhRemaining };
      }

      // ── Death animation countdown ──────────────────────
      if (state.status === "dying") {
        const remaining = state.deathTimer - action.dt;
        if (remaining <= 0) {
          return {
            ...state,
            mysteryHit,
            deathTimer: 0,
            status: "playing",
            playerBullets: [],
            enemyBullets: [],
          };
        }
        return { ...state, mysteryHit, deathTimer: remaining };
      }

      if (state.status !== "playing") return { ...state, mysteryHit };

      const { dt, moveLeft, moveRight, shoot } = action;

      // ── Clone mutable working vars ─────────────────────
      let playerX = state.playerX;
      let playerBullets = state.playerBullets;
      let enemyBullets = state.enemyBullets;
      let invaders = state.invaders;
      let invaderOffsetX = state.invaderOffsetX;
      let invaderOffsetY = state.invaderOffsetY;
      let invaderDir = state.invaderDir;
      let invaderMoveAcc = state.invaderMoveAcc + dt;
      let enemyFireAcc = state.enemyFireAcc + dt;
      let enemyFireInterval = state.enemyFireInterval;
      let mysteryAcc = state.mysteryAcc + dt;
      let mysteryInterval = state.mysteryInterval;
      let mysteryShip = state.mysteryShip;
      let shields = state.shields;
      let score = state.score;
      let lives = state.lives;
      let invaderFrame = state.invaderFrame;
      let bonusLifeAwarded = state.bonusLifeAwarded;

      // ── Move player ────────────────────────────────────
      if (moveLeft) playerX = Math.max(PLAYER_MIN_X, playerX - PLAYER_SPEED);
      if (moveRight) playerX = Math.min(PLAYER_MAX_X, playerX + PLAYER_SPEED);

      // ── Player shoot ───────────────────────────────────
      if (shoot && playerBullets.length < MAX_PLAYER_BULLETS) {
        playerBullets = [
          ...playerBullets,
          { x: playerX, y: PLAYER_Y - PLAYER_H },
        ];
      }

      // ── Move player bullets ────────────────────────────
      playerBullets = playerBullets
        .map((b) => ({ ...b, y: b.y - PLAYER_BULLET_SPEED }))
        .filter((b) => b.y + PLAYER_BULLET_H > 0);

      // ── Move enemy bullets ─────────────────────────────
      enemyBullets = enemyBullets
        .map((b) => ({ ...b, y: b.y + ENEMY_BULLET_SPEED }))
        .filter((b) => b.y < CANVAS_H + ENEMY_BULLET_H);

      // ── Move invaders ──────────────────────────────────
      const aliveInvaders = invaders.flat().filter((inv) => inv.alive);
      const aliveCount = aliveInvaders.length;
      const moveInterval = getInvaderMoveInterval(aliveCount, state.level);

      if (invaderMoveAcc >= moveInterval) {
        invaderMoveAcc -= moveInterval;
        invaderFrame = invaderFrame === 0 ? 1 : 0;
        const cols = aliveInvaders.map((inv) => inv.col);
        const minCol = Math.min(...cols);
        const maxCol = Math.max(...cols);
        const nextX = invaderOffsetX + invaderDir * INVADER_MOVE_PX;
        const leftEdge = nextX + minCol * INVADER_STEP_X;
        const rightEdge = nextX + maxCol * INVADER_STEP_X + INVADER_W;

        if (
          leftEdge < INVADER_WALL_MARGIN ||
          rightEdge > CANVAS_W - INVADER_WALL_MARGIN
        ) {
          // Reverse direction + drop
          invaderDir = (invaderDir * -1) as 1 | -1;
          invaderOffsetY += INVADER_DROP_PX;
        } else {
          invaderOffsetX = nextX;
        }

        // ── Invaders erode shield tiles they overlap ──────
        // Clone shield cell grids once; mark destroyed tiles
        const shieldCellsWorking = shields.map((sh) =>
          sh.cells.map((row) => [...row]),
        );
        let shieldsDirty = false;

        for (const inv of aliveInvaders) {
          const ir = invaderRect(inv, invaderOffsetX, invaderOffsetY);
          for (let si = 0; si < shields.length; si++) {
            const sh = shields[si];
            // Quick AABB reject
            if (
              ir.x + ir.w <= sh.x ||
              ir.x >= sh.x + SHIELD_W ||
              ir.y + ir.h <= sh.y ||
              ir.y >= sh.y + SHIELD_H
            )
              continue;

            // Erase every tile the invader body overlaps
            const cMin = Math.max(0, Math.floor((ir.x - sh.x) / SHIELD_TILE));
            const cMax = Math.min(
              SHIELD_COLS - 1,
              Math.floor((ir.x + ir.w - sh.x - 1) / SHIELD_TILE),
            );
            const rMin = Math.max(0, Math.floor((ir.y - sh.y) / SHIELD_TILE));
            const rMax = Math.min(
              SHIELD_ROWS - 1,
              Math.floor((ir.y + ir.h - sh.y - 1) / SHIELD_TILE),
            );

            for (let r = rMin; r <= rMax; r++) {
              for (let c = cMin; c <= cMax; c++) {
                if (shieldCellsWorking[si][r][c]) {
                  shieldCellsWorking[si][r][c] = false;
                  shieldsDirty = true;
                }
              }
            }
          }
        }

        if (shieldsDirty) {
          shields = shields.map((sh, si) => ({
            ...sh,
            cells: shieldCellsWorking[si],
          }));
        }
      }

      // ── Per-tick floor check ────────────────────────────
      // Game over the moment any invader's bottom edge touches the player
      const invaderAtFloor = aliveInvaders.some(
        (inv) =>
          invaderOffsetY + inv.row * INVADER_STEP_Y + INVADER_H >=
          INVADER_FLOOR_Y,
      );
      if (invaderAtFloor) {
        return { ...state, mysteryHit, status: "game-over" };
      }

      // ── Enemy fire ─────────────────────────────────────
      if (enemyFireAcc >= enemyFireInterval) {
        enemyFireAcc -= enemyFireInterval;
        enemyFireInterval = randomEnemyFireInterval();

        // Pick bottom-most alive invader per column, then choose random one
        const shooterMap = new Map<number, Invader>();
        for (const inv of aliveInvaders) {
          const existing = shooterMap.get(inv.col);
          if (!existing || inv.row > existing.row) shooterMap.set(inv.col, inv);
        }
        const shooters = Array.from(shooterMap.values());
        if (shooters.length > 0) {
          const shooter = shooters[Math.floor(Math.random() * shooters.length)];
          const rect = invaderRect(shooter, invaderOffsetX, invaderOffsetY);
          enemyBullets = [
            ...enemyBullets,
            { x: rect.x + INVADER_W / 2, y: rect.y + INVADER_H },
          ];
        }
      }

      // ── Mystery ship ───────────────────────────────────
      if (!mysteryShip) {
        if (mysteryAcc >= mysteryInterval) {
          mysteryAcc = 0;
          mysteryInterval = randomMysteryInterval();
          const dir: 1 | -1 = Math.random() < 0.5 ? 1 : -1;
          mysteryShip = {
            x: dir === 1 ? -MYSTERY_W : CANVAS_W,
            dir,
            active: true,
          };
        }
      } else {
        const newMX =
          mysteryShip.x + mysteryShip.dir * MYSTERY_SPEED * (dt / 16);
        if (newMX > CANVAS_W + MYSTERY_W || newMX < -MYSTERY_W * 2) {
          mysteryShip = null;
        } else {
          mysteryShip = { ...mysteryShip, x: newMX };
        }
      }

      // ── Collision detection ────────────────────────────
      // Tile-based shield hits: record { shieldIdx, tileRow, tileCol } per bullet
      interface ShieldHit {
        idx: number;
        r: number;
        c: number;
      }
      const shieldHits: ShieldHit[] = [];

      /**
       * Check if pixel (bx, by) overlaps a live shield tile.
       * On hit, records the tile coordinates for a 3×3 blast and returns true.
       */
      const recordShieldHit = (bx: number, by: number): boolean => {
        for (let i = 0; i < shields.length; i++) {
          const sh = shields[i];
          // Quick bounding-box pre-check (expanded by one tile for edge tolerance)
          if (
            bx < sh.x - SHIELD_TILE ||
            bx > sh.x + SHIELD_W + SHIELD_TILE ||
            by < sh.y - SHIELD_TILE ||
            by > sh.y + SHIELD_H + SHIELD_TILE
          )
            continue;

          const tc = Math.floor((bx - sh.x) / SHIELD_TILE);
          const tr = Math.floor((by - sh.y) / SHIELD_TILE);

          // Check hit tile and its immediate neighbours for any live tile
          for (let dr = -1; dr <= 1; dr++) {
            for (let dc = -1; dc <= 1; dc++) {
              const r = tr + dr;
              const c = tc + dc;
              if (
                r >= 0 &&
                r < SHIELD_ROWS &&
                c >= 0 &&
                c < SHIELD_COLS &&
                sh.cells[r][c]
              ) {
                shieldHits.push({ idx: i, r: tr, c: tc });
                return true;
              }
            }
          }
        }
        return false;
      };

      // Player bullets vs invaders + shields
      let scoreGain = 0;
      const killedInvaderKeys = new Set<string>();
      const survivingPlayerBullets: Bullet[] = [];

      for (const bullet of playerBullets) {
        let hit = false;

        // vs shields
        if (!hit) hit = recordShieldHit(bullet.x, bullet.y);

        // vs mystery ship
        if (!hit && mysteryShip) {
          const mx = mysteryShip.x;
          // Full AABB — bullet rect vs saucer rect
          // bullet occupies x: [bullet.x - PLAYER_BULLET_W/2, bullet.x + PLAYER_BULLET_W/2]
          //                  y: [bullet.y, bullet.y + PLAYER_BULLET_H]
          const bLeft = bullet.x - PLAYER_BULLET_W / 2;
          const bRight = bullet.x + PLAYER_BULLET_W / 2;
          if (
            bRight >= mx &&
            bLeft <= mx + MYSTERY_W &&
            bullet.y + PLAYER_BULLET_H >= MYSTERY_Y &&
            bullet.y <= MYSTERY_Y + MYSTERY_H
          ) {
            score += MYSTERY_POINTS;
            mysteryHit = {
              x: mysteryShip.x + MYSTERY_W / 2,
              score: MYSTERY_POINTS,
              timer: MYSTERY_HIT_MS,
            };
            mysteryShip = null;
            hit = true;
          }
        }

        // vs invaders
        if (!hit) {
          for (const inv of aliveInvaders) {
            const rect = invaderRect(inv, invaderOffsetX, invaderOffsetY);
            if (
              bullet.x >= rect.x &&
              bullet.x <= rect.x + INVADER_W &&
              bullet.y >= rect.y &&
              bullet.y <= rect.y + INVADER_H
            ) {
              killedInvaderKeys.add(`${inv.row},${inv.col}`);
              scoreGain += INVADER_POINTS[inv.row];
              hit = true;
              break;
            }
          }
        }

        if (!hit) survivingPlayerBullets.push(bullet);
      }

      playerBullets = survivingPlayerBullets;

      if (killedInvaderKeys.size > 0) {
        score += scoreGain;
        invaders = invaders.map((row) =>
          row.map((inv) =>
            killedInvaderKeys.has(`${inv.row},${inv.col}`)
              ? { ...inv, alive: false }
              : inv,
          ),
        );
      }

      // Enemy bullets vs shields + player
      const survivingEnemyBullets: Bullet[] = [];
      let playerHit = false;

      for (const bullet of enemyBullets) {
        let hit = false;

        // vs shields
        if (!hit) hit = recordShieldHit(bullet.x, bullet.y);

        // vs player
        if (!hit) {
          const px = playerX - PLAYER_W / 2;
          const py = PLAYER_Y - PLAYER_H;
          if (
            bullet.x >= px &&
            bullet.x <= px + PLAYER_W &&
            bullet.y >= py &&
            bullet.y <= py + PLAYER_H
          ) {
            playerHit = true;
            hit = true;
          }
        }

        if (!hit) survivingEnemyBullets.push(bullet);
      }
      enemyBullets = survivingEnemyBullets;

      // Apply tile destruction immutably — 3×3 block per hit
      if (shieldHits.length > 0) {
        shields = shields.map((sh, i) => {
          const hits = shieldHits.filter((h) => h.idx === i);
          if (hits.length === 0) return sh;
          // Clone the cell grid
          const newCells = sh.cells.map((row) => [...row]);
          for (const hit of hits) {
            for (let dr = -1; dr <= 1; dr++) {
              for (let dc = -1; dc <= 1; dc++) {
                const r = hit.r + dr;
                const c = hit.c + dc;
                if (r >= 0 && r < SHIELD_ROWS && c >= 0 && c < SHIELD_COLS) {
                  newCells[r][c] = false;
                }
              }
            }
          }
          return { ...sh, cells: newCells };
        });
      }

      // ── Bonus life ──────────────────────────────────────────
      if (!bonusLifeAwarded && score >= BONUS_LIFE_SCORE) {
        lives = Math.min(lives + 1, 6);
        bonusLifeAwarded = true;
      }

      // ── Check level clear ────────────────────────────────
      const newAliveCount = invaders.flat().filter((inv) => inv.alive).length;
      if (newAliveCount === 0) {
        const newHighScore = Math.max(score, state.highScore);
        return {
          ...state,
          playerX,
          playerBullets: [],
          enemyBullets: [],
          invaders,
          invaderOffsetX,
          invaderOffsetY,
          invaderDir,
          invaderFrame,
          invaderMoveAcc,
          enemyFireAcc,
          enemyFireInterval,
          mysteryAcc,
          mysteryInterval,
          mysteryShip: null,
          mysteryHit,
          shields,
          score,
          highScore: newHighScore,
          bonusLifeAwarded,
          lives,
          status: "level-clear",
        };
      }

      // ── Handle player hit ───────────────────────────────
      if (playerHit) {
        lives -= 1;
        const newHighScore = Math.max(score, state.highScore);
        if (lives <= 0) {
          return {
            ...state,
            playerX,
            playerBullets: [],
            enemyBullets: [],
            invaders,
            invaderOffsetX,
            invaderOffsetY,
            invaderDir,
            invaderFrame,
            invaderMoveAcc,
            enemyFireAcc,
            enemyFireInterval,
            mysteryAcc,
            mysteryInterval,
            mysteryShip,
            mysteryHit: null,
            shields,
            score,
            highScore: newHighScore,
            bonusLifeAwarded,
            lives: 0,
            status: "game-over",
          };
        }
        // Start death animation
        return {
          ...state,
          playerX,
          playerBullets: [],
          enemyBullets: [],
          invaders,
          invaderOffsetX,
          invaderOffsetY,
          invaderDir,
          invaderFrame,
          invaderMoveAcc,
          enemyFireAcc,
          enemyFireInterval,
          mysteryAcc,
          mysteryInterval,
          mysteryShip,
          mysteryHit,
          shields,
          score,
          highScore: newHighScore,
          bonusLifeAwarded,
          lives,
          deathTimer: DEATH_ANIM_MS,
          status: "dying",
        };
      }

      const finalHighScore = Math.max(score, state.highScore);
      return {
        ...state,
        playerX,
        playerBullets,
        enemyBullets,
        invaders,
        invaderOffsetX,
        invaderOffsetY,
        invaderDir,
        invaderFrame,
        invaderMoveAcc,
        enemyFireAcc,
        enemyFireInterval,
        mysteryAcc,
        mysteryInterval,
        mysteryShip,
        mysteryHit,
        shields,
        score,
        highScore: finalHighScore,
        bonusLifeAwarded,
        lives,
      };
    }

    default:
      return state;
  }
}
