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
  SHIELD_HP_MAX,
  MYSTERY_W,
  MYSTERY_Y,
  MYSTERY_SPEED,
  MYSTERY_POINTS,
  MYSTERY_INTERVAL_MIN_MS,
  MYSTERY_INTERVAL_MAX_MS,
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
  hp: number;
}

export interface MysteryShip {
  x: number;
  /** +1 = right, -1 = left */
  dir: 1 | -1;
  active: boolean;
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
  shields: Shield[];
  score: number;
  highScore: number;
  lives: number;
  level: number;
  status: "idle" | "playing" | "paused" | "game-over" | "level-clear";
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
    hp: SHIELD_HP_MAX,
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

export function createInitialState(): SpaceInvadersState {
  return {
    playerX: CANVAS_W / 2,
    playerBullets: [],
    enemyBullets: [],
    invaders: buildInvaders(),
    invaderOffsetX: INVADER_START_X,
    invaderOffsetY: INVADER_START_Y,
    invaderDir: 1,
    invaderMoveAcc: 0,
    enemyFireAcc: 0,
    enemyFireInterval: randomEnemyFireInterval(),
    mysteryAcc: 0,
    mysteryInterval: randomMysteryInterval(),
    mysteryShip: null,
    shields: buildShields(),
    score: 0,
    highScore: 0,
    lives: 3,
    level: 1,
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
      const fresh = createInitialState();
      return {
        ...fresh,
        score: state.score,
        highScore: state.highScore,
        lives: state.lives,
        level: nextLevel,
        status: "playing",
      };
    }

    case "PAUSE_TOGGLE":
      if (state.status === "playing") return { ...state, status: "paused" };
      if (state.status === "paused") return { ...state, status: "playing" };
      return state;

    case "TICK": {
      if (state.status !== "playing") return state;

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

        // Check if any invader has reached the floor
        const rows = aliveInvaders.map((inv) => inv.row);
        const maxRow = Math.max(...rows);
        if (
          invaderOffsetY + maxRow * INVADER_STEP_Y + INVADER_H >=
          INVADER_FLOOR_Y
        ) {
          return { ...state, status: "game-over" };
        }
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
      // Track shield damage indexed by shield index
      const shieldDamage = new Map<number, number>();

      const recordShieldHit = (bx: number, by: number): boolean => {
        for (let i = 0; i < shields.length; i++) {
          const sh = shields[i];
          if (sh.hp <= 0) continue;
          if (
            bx >= sh.x &&
            bx <= sh.x + SHIELD_W &&
            by >= sh.y &&
            by <= sh.y + SHIELD_H
          ) {
            shieldDamage.set(i, (shieldDamage.get(i) ?? 0) + 1);
            return true;
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
          if (
            bullet.x >= mx &&
            bullet.x <= mx + MYSTERY_W &&
            bullet.y >= MYSTERY_Y &&
            bullet.y <= MYSTERY_Y + 14
          ) {
            score += MYSTERY_POINTS;
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

      // Apply shield damage immutably
      if (shieldDamage.size > 0) {
        shields = shields.map((sh, i) => {
          const dmg = shieldDamage.get(i);
          return dmg ? { ...sh, hp: Math.max(0, sh.hp - dmg) } : sh;
        });
      }

      // Check level clear
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
          invaderMoveAcc,
          enemyFireAcc,
          enemyFireInterval,
          mysteryAcc,
          mysteryInterval,
          mysteryShip: null,
          shields,
          score,
          highScore: newHighScore,
          lives,
          status: "level-clear",
        };
      }

      // Handle player hit
      if (playerHit) {
        lives -= 1;
        const newHighScore = Math.max(score, state.highScore);
        if (lives <= 0) {
          return {
            ...state,
            playerX,
            playerBullets: [],
            enemyBullets: survivingEnemyBullets,
            invaders,
            invaderOffsetX,
            invaderOffsetY,
            invaderDir,
            invaderMoveAcc,
            enemyFireAcc,
            enemyFireInterval,
            mysteryAcc,
            mysteryInterval,
            mysteryShip,
            shields,
            score,
            highScore: newHighScore,
            lives: 0,
            status: "game-over",
          };
        }
        // Lost a life — clear bullets, keep playing
        playerBullets = [];
        enemyBullets = [];
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
        invaderMoveAcc,
        enemyFireAcc,
        enemyFireInterval,
        mysteryAcc,
        mysteryInterval,
        mysteryShip,
        shields,
        score,
        highScore: finalHighScore,
        lives,
      };
    }

    default:
      return state;
  }
}
