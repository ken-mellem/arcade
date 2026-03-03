// ============================================================
// Space Invaders — Route Page Component
// ============================================================

import { useEffect, useRef, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { useSpaceInvaders } from "./useSpaceInvaders";
import { invaderRect } from "./SpaceInvadersEngine";
import {
  CANVAS_W,
  CANVAS_H,
  PLAYER_H,
  PLAYER_Y,
  PLAYER_BULLET_W,
  PLAYER_BULLET_H,
  ENEMY_BULLET_W,
  ENEMY_BULLET_H,
  INVADER_W,
  INVADER_H,
  SHIELD_TILE,
  SHIELD_COLS,
  SHIELD_ROWS,
  MYSTERY_W,
  MYSTERY_H,
  MYSTERY_Y,
  COLOR_BG,
  COLOR_PLAYER,
  COLOR_PLAYER_BULLET,
  COLOR_ENEMY_BULLET,
  COLOR_MYSTERY,
  COLOR_SHIELD,
  INVADER_ROW_COLORS,
  DEATH_ANIM_MS,
  MYSTERY_HIT_MS,
} from "./constants";
import ArcadeScreen from "../../components/ArcadeScreen";
import InitialsOverlay from "../../components/InitialsOverlay";
import styles from "./SpaceInvadersPage.module.css";

// ── CSS var resolver ──────────────────────────────────────
function resolveVar(v: string): string {
  if (!v.startsWith("var(")) return v;
  return getComputedStyle(document.documentElement)
    .getPropertyValue(v.slice(4, -1))
    .trim();
}

// ── Pixel art sprite definitions (1 = filled, 0 = transparent) ──
// 8×6 pixel art for each invader type (rows 0, 1–2, 3–4)
const SPRITE_TOP: ReadonlyArray<ReadonlyArray<0 | 1>> = [
  [0, 0, 1, 0, 0, 0, 1, 0],
  [0, 0, 0, 1, 1, 1, 0, 0],
  [0, 1, 1, 1, 1, 1, 1, 0],
  [1, 1, 0, 1, 1, 0, 1, 1],
  [1, 1, 1, 1, 1, 1, 1, 1],
  [0, 1, 0, 1, 1, 0, 1, 0],
];

const SPRITE_TOP_B: ReadonlyArray<ReadonlyArray<0 | 1>> = [
  [0, 1, 0, 0, 0, 0, 1, 0],
  [0, 0, 1, 0, 0, 1, 0, 0],
  [0, 1, 1, 1, 1, 1, 1, 0],
  [1, 1, 0, 1, 1, 0, 1, 1],
  [1, 1, 1, 1, 1, 1, 1, 1],
  [1, 0, 1, 0, 0, 1, 0, 1],
];

const SPRITE_MID: ReadonlyArray<ReadonlyArray<0 | 1>> = [
  [0, 1, 0, 0, 0, 0, 1, 0],
  [1, 0, 1, 1, 1, 1, 0, 1],
  [1, 1, 1, 1, 1, 1, 1, 1],
  [1, 1, 0, 0, 0, 0, 1, 1],
  [0, 1, 0, 0, 0, 0, 1, 0],
  [1, 0, 0, 0, 0, 0, 0, 1],
];

const SPRITE_MID_B: ReadonlyArray<ReadonlyArray<0 | 1>> = [
  [1, 0, 0, 0, 0, 0, 0, 1],
  [0, 1, 0, 1, 1, 0, 1, 0],
  [1, 1, 1, 1, 1, 1, 1, 1],
  [1, 1, 0, 0, 0, 0, 1, 1],
  [0, 0, 1, 0, 0, 1, 0, 0],
  [0, 1, 0, 0, 0, 0, 1, 0],
];

const SPRITE_BOT: ReadonlyArray<ReadonlyArray<0 | 1>> = [
  [0, 0, 1, 1, 1, 1, 0, 0],
  [1, 1, 1, 1, 1, 1, 1, 1],
  [1, 0, 0, 1, 1, 0, 0, 1],
  [0, 1, 1, 0, 0, 1, 1, 0],
  [0, 1, 0, 0, 0, 0, 1, 0],
  [1, 0, 0, 0, 0, 0, 0, 1],
];

const SPRITE_BOT_B: ReadonlyArray<ReadonlyArray<0 | 1>> = [
  [0, 0, 1, 1, 1, 1, 0, 0],
  [1, 1, 1, 1, 1, 1, 1, 1],
  [1, 0, 0, 1, 1, 0, 0, 1],
  [1, 0, 1, 0, 0, 1, 0, 1],
  [0, 0, 1, 0, 0, 1, 0, 0],
  [0, 1, 0, 0, 0, 0, 1, 0],
];

function drawSprite(
  ctx: CanvasRenderingContext2D,
  sprite: ReadonlyArray<ReadonlyArray<0 | 1>>,
  x: number,
  y: number,
  w: number,
  h: number,
  color: string,
): void {
  const cols = sprite[0].length;
  const rows = sprite.length;
  const pw = w / cols;
  const ph = h / rows;

  ctx.fillStyle = color;

  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      if (sprite[r][c]) {
        ctx.fillRect(
          Math.round(x + c * pw),
          Math.round(y + r * ph),
          Math.ceil(pw),
          Math.ceil(ph),
        );
      }
    }
  }
}

function drawPlayerShip(
  ctx: CanvasRenderingContext2D,
  cx: number,
  y: number,
  color: string,
): void {
  ctx.fillStyle = color;
  // Cannon tip (3 px wide, 4 px tall)
  ctx.fillRect(cx - 2, y, 4, 4);
  // Narrow body
  ctx.fillRect(cx - 8, y + 4, 16, 6);
  // Wide base (28 px)
  ctx.fillRect(cx - 14, y + 10, 28, 6);
}

// ── Component ─────────────────────────────────────────────

export default function SpaceInvadersPage() {
  const navigate = useNavigate();
  const {
    state,
    start,
    restart,
    nextLevel,
    pauseToggle,
    pendingScore,
    submitInitials,
  } = useSpaceInvaders();
  const canvasRef = useRef<HTMLCanvasElement>(null);

  // Pre-generate fixed star positions (seeded via Array index for stable output)
  const stars = useMemo(() => {
    // Deterministic-ish placement using a simple LCG so stars never change
    const arr: Array<{ x: number; y: number; r: number; a: number }> = [];
    let seed = 42;
    const rng = () => {
      seed = (seed * 1664525 + 1013904223) & 0xffffffff;
      return (seed >>> 0) / 0x100000000;
    };
    for (let i = 0; i < 80; i++) {
      arr.push({
        x: rng() * CANVAS_W,
        y: rng() * CANVAS_H,
        r: rng() * 1.2 + 0.3,
        a: rng() * 0.6 + 0.2,
      });
    }
    return arr;
  }, []);

  // ── Canvas draw ──────────────────────────────────────────
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    // Resolve CSS vars once per draw
    const playerColor = resolveVar(COLOR_PLAYER);
    const playerBulletColor = resolveVar(COLOR_PLAYER_BULLET);
    const enemyBulletColor = resolveVar(COLOR_ENEMY_BULLET);
    const mysteryColor = resolveVar(COLOR_MYSTERY);
    const shieldColor = resolveVar(COLOR_SHIELD);
    const invaderColors = INVADER_ROW_COLORS.map(resolveVar);

    // Background
    ctx.fillStyle = COLOR_BG;
    ctx.fillRect(0, 0, CANVAS_W, CANVAS_H);

    // Stars
    for (const s of stars) {
      ctx.globalAlpha = s.a;
      ctx.fillStyle = "#ffffff";
      ctx.beginPath();
      ctx.arc(s.x, s.y, s.r, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.globalAlpha = 1;

    // Ground line
    ctx.strokeStyle = playerColor;
    ctx.globalAlpha = 0.3;
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(0, PLAYER_Y + PLAYER_H + 4);
    ctx.lineTo(CANVAS_W, PLAYER_Y + PLAYER_H + 4);
    ctx.stroke();
    ctx.globalAlpha = 1;

    // ── Shields — tile-by-tile rendering ─────────────────
    ctx.fillStyle = shieldColor;
    ctx.shadowColor = shieldColor;
    ctx.shadowBlur = 5;
    for (const sh of state.shields) {
      for (let r = 0; r < SHIELD_ROWS; r++) {
        for (let c = 0; c < SHIELD_COLS; c++) {
          if (sh.cells[r][c]) {
            ctx.fillRect(
              sh.x + c * SHIELD_TILE,
              sh.y + r * SHIELD_TILE,
              SHIELD_TILE,
              SHIELD_TILE,
            );
          }
        }
      }
    }
    ctx.shadowBlur = 0;

    // ── Player bullets ────────────────────────────────────
    ctx.fillStyle = playerBulletColor;
    ctx.shadowColor = playerBulletColor;
    ctx.shadowBlur = 8;
    for (const b of state.playerBullets) {
      ctx.fillRect(
        Math.round(b.x - PLAYER_BULLET_W / 2),
        Math.round(b.y),
        PLAYER_BULLET_W,
        PLAYER_BULLET_H,
      );
    }
    ctx.shadowBlur = 0;

    // ── Enemy bullets ─────────────────────────────────────
    ctx.fillStyle = enemyBulletColor;
    ctx.shadowColor = enemyBulletColor;
    ctx.shadowBlur = 8;
    for (const b of state.enemyBullets) {
      ctx.fillRect(
        Math.round(b.x - ENEMY_BULLET_W / 2),
        Math.round(b.y),
        ENEMY_BULLET_W,
        ENEMY_BULLET_H,
      );
    }
    ctx.shadowBlur = 0;

    // ── Mystery ship ──────────────────────────────────────
    if (state.mysteryShip) {
      const mx = Math.round(state.mysteryShip.x);
      ctx.fillStyle = mysteryColor;
      // Simple saucer shape — no glow
      ctx.fillRect(mx + 6, MYSTERY_Y + 2, MYSTERY_W - 12, MYSTERY_H - 4);
      ctx.fillRect(mx, MYSTERY_Y + 6, MYSTERY_W, MYSTERY_H - 8);
      ctx.fillRect(mx + 10, MYSTERY_Y, MYSTERY_W - 20, 6);
    }
    // ── Mystery ship hit flash + score popup ───────────────────────
    if (state.mysteryHit) {
      const { x: hx, score: hScore, timer } = state.mysteryHit;
      const progress = 1 - timer / MYSTERY_HIT_MS; // 0 → 1 as popup ages
      const alpha = progress < 0.7 ? 1 : 1 - (progress - 0.7) / 0.3; // fade last 30%
      const floatY = MYSTERY_Y - progress * 20; // float upward

      // Starburst flash (only in first ~35% of duration)
      if (progress < 0.35) {
        const flashAlpha = (1 - progress / 0.35) * 0.9;
        const r = 4 + progress * 40;
        ctx.globalAlpha = flashAlpha;
        ctx.strokeStyle = mysteryColor;
        ctx.shadowColor = mysteryColor;
        ctx.shadowBlur = 18;
        ctx.lineWidth = 2;
        for (let a = 0; a < 8; a++) {
          const angle = (a / 8) * Math.PI * 2;
          ctx.beginPath();
          ctx.moveTo(
            hx + Math.cos(angle) * r * 0.25,
            MYSTERY_Y + 7 + Math.sin(angle) * r * 0.25,
          );
          ctx.lineTo(
            hx + Math.cos(angle) * r,
            MYSTERY_Y + 7 + Math.sin(angle) * r,
          );
          ctx.stroke();
        }
        ctx.shadowBlur = 0;
        ctx.lineWidth = 1;
        ctx.globalAlpha = 1;
      }

      // Score label
      ctx.globalAlpha = alpha;
      ctx.fillStyle = mysteryColor;
      ctx.shadowColor = mysteryColor;
      ctx.shadowBlur = 12;
      ctx.font = '8px "Press Start 2P"';
      ctx.textAlign = "center";
      ctx.fillText(`${hScore}`, hx, floatY);
      ctx.shadowBlur = 0;
      ctx.globalAlpha = 1;
    }
    // ── Invaders ──────────────────────────────────────────
    for (const row of state.invaders) {
      for (const inv of row) {
        if (!inv.alive) continue;
        const rect = invaderRect(
          inv,
          state.invaderOffsetX,
          state.invaderOffsetY,
        );
        const color = invaderColors[inv.row];
        const sprite =
          inv.row === 0
            ? state.invaderFrame === 0
              ? SPRITE_TOP
              : SPRITE_TOP_B
            : inv.row <= 2
              ? state.invaderFrame === 0
                ? SPRITE_MID
                : SPRITE_MID_B
              : state.invaderFrame === 0
                ? SPRITE_BOT
                : SPRITE_BOT_B;
        drawSprite(ctx, sprite, rect.x, rect.y, INVADER_W, INVADER_H, color);
      }
    }

    // ── Player ship ───────────────────────────────────────
    if (state.status !== "game-over" && state.status !== "dying") {
      drawPlayerShip(ctx, state.playerX, PLAYER_Y - PLAYER_H, playerColor);
    }

    // ── Death explosion ────────────────────────────────────────
    if (state.status === "dying") {
      const phase = 1 - state.deathTimer / DEATH_ANIM_MS;
      const cx = state.playerX;
      const cy = PLAYER_Y - PLAYER_H / 2;
      const r = 6 + phase * 26;
      const explosionColor = phase < 0.5 ? "#ff6600" : "#ff0040";
      ctx.strokeStyle = explosionColor;
      ctx.shadowColor = explosionColor;
      ctx.shadowBlur = 14;
      ctx.lineWidth = 2;
      // 8 main spokes
      for (let a = 0; a < 8; a++) {
        const angle = (a / 8) * Math.PI * 2;
        ctx.beginPath();
        ctx.moveTo(
          cx + Math.cos(angle) * r * 0.25,
          cy + Math.sin(angle) * r * 0.25,
        );
        ctx.lineTo(cx + Math.cos(angle) * r, cy + Math.sin(angle) * r);
        ctx.stroke();
      }
      // 8 shorter secondary spokes offset by half a step
      for (let a = 0; a < 8; a++) {
        const angle = ((a + 0.5) / 8) * Math.PI * 2;
        ctx.beginPath();
        ctx.moveTo(
          cx + Math.cos(angle) * r * 0.5,
          cy + Math.sin(angle) * r * 0.5,
        );
        ctx.lineTo(
          cx + Math.cos(angle) * r * 0.75,
          cy + Math.sin(angle) * r * 0.75,
        );
        ctx.stroke();
      }
      ctx.shadowBlur = 0;
      ctx.lineWidth = 1;
    }

    // ── Pause overlay ─────────────────────────────────────
    if (state.status === "paused") {
      ctx.fillStyle = "rgba(0,0,0,0.7)";
      ctx.fillRect(0, 0, CANVAS_W, CANVAS_H);
      ctx.fillStyle = "#00ffff";
      ctx.font = '14px "Press Start 2P"';
      ctx.textAlign = "center";
      ctx.fillText("PAUSED", CANVAS_W / 2, CANVAS_H / 2 - 10);
      ctx.font = '7px "Press Start 2P"';
      ctx.fillStyle = "#aaaacc";
      ctx.fillText("PRESS P TO RESUME", CANVAS_W / 2, CANVAS_H / 2 + 16);
    }

    // ── Level clear overlay ───────────────────────────────
    if (state.status === "level-clear") {
      ctx.fillStyle = "rgba(0,0,0,0.72)";
      ctx.fillRect(0, 0, CANVAS_W, CANVAS_H);
      ctx.fillStyle = "#39ff14";
      ctx.font = '14px "Press Start 2P"';
      ctx.textAlign = "center";
      ctx.fillText("WAVE CLEAR!", CANVAS_W / 2, CANVAS_H / 2 - 28);
      ctx.font = '7px "Press Start 2P"';
      ctx.fillStyle = "#e0e0ff";
      ctx.fillText(`SCORE: ${state.score}`, CANVAS_W / 2, CANVAS_H / 2 + 4);
      ctx.fillStyle = "#ffff00";
      ctx.fillText("ENTER FOR NEXT WAVE", CANVAS_W / 2, CANVAS_H / 2 + 28);
    }

    // ── Game over overlay ─────────────────────────────────
    if (state.status === "game-over") {
      ctx.fillStyle = "rgba(0,0,0,0.78)";
      ctx.fillRect(0, 0, CANVAS_W, CANVAS_H);
      ctx.fillStyle = "#ff0040";
      ctx.font = '14px "Press Start 2P"';
      ctx.textAlign = "center";
      ctx.fillText("GAME OVER", CANVAS_W / 2, CANVAS_H / 2 - 36);
      ctx.font = '7px "Press Start 2P"';
      ctx.fillStyle = "#e0e0ff";
      ctx.fillText(`SCORE: ${state.score}`, CANVAS_W / 2, CANVAS_H / 2);
      if (state.score > 0 && state.score >= state.highScore) {
        ctx.fillStyle = "#ffff00";
        ctx.fillText("NEW HIGH SCORE!", CANVAS_W / 2, CANVAS_H / 2 + 20);
      }
      ctx.fillStyle = "#39ff14";
      ctx.fillText("ENTER TO RESTART", CANVAS_W / 2, CANVAS_H / 2 + 44);
    }
  }, [state, stars]);

  // ── Render ────────────────────────────────────────────────
  return (
    <div className={styles.page}>
      <div className={styles.layout}>
        {/* Left panel */}
        <div className={styles.leftPanel}>
          <button className={styles.backBtn} onClick={() => navigate("/")}>
            ← BACK
          </button>

          <div className={styles.statBlock}>
            <span className={styles.statLabel}>SCORE</span>
            <span className={styles.statValue}>{state.score}</span>
          </div>

          <div className={styles.statBlock}>
            <span className={styles.statLabel}>BEST</span>
            <span className={styles.statValueAlt}>{state.highScore}</span>
          </div>

          <div className={styles.statBlock}>
            <span className={styles.statLabel}>WAVE</span>
            <span className={styles.statValue}>{state.level}</span>
          </div>

          <div className={styles.livesBlock}>
            <span className={styles.statLabel}>LIVES</span>
            <div className={styles.livesIcons}>
              {Array.from(
                { length: Math.min(Math.max(state.lives, 0), 6) },
                (_, i) => (
                  <span key={i} className={styles.lifeIcon}>
                    ▲
                  </span>
                ),
              )}
            </div>
          </div>
        </div>

        {/* Main canvas */}
        <ArcadeScreen title="SPACE INVADERS" accent="var(--color-neon-pink)">
          <div className={styles.canvasWrap}>
            <canvas
              ref={canvasRef}
              width={CANVAS_W}
              height={CANVAS_H}
              className={styles.gameCanvas}
            />

            {state.status === "idle" && (
              <div className={styles.startOverlay}>
                <p className={styles.startTitle}>SPACE INVADERS</p>
                <p className={styles.startSub}>PRESS ENTER TO START</p>
                <button className={styles.startBtn} onClick={start}>
                  INSERT COIN
                </button>
              </div>
            )}
          </div>
        </ArcadeScreen>

        {/* Right panel */}
        <div className={styles.rightPanel}>
          <div className={styles.controls}>
            <p className={styles.controlsTitle}>CONTROLS</p>
            <ul className={styles.controlsList}>
              <li>
                <kbd>← →</kbd> Move
              </li>
              <li>
                <kbd>A D</kbd> Also move
              </li>
              <li>
                <kbd>SPACE</kbd> Fire
              </li>
              <li>
                <kbd>P</kbd> Pause
              </li>
              <li>
                <kbd>ENTER</kbd> Start
              </li>
            </ul>
          </div>

          <div className={styles.scoreTable}>
            <p className={styles.controlsTitle}>SCORE TABLE</p>
            <ul className={styles.scoreList}>
              <li className={styles.scoreRowPink}>— = 30 pts</li>
              <li className={styles.scoreRowCyan}>— = 20 pts</li>
              <li className={styles.scoreRowYellow}>— = 10 pts</li>
            </ul>
          </div>

          {(state.status === "playing" || state.status === "paused") && (
            <button className={styles.pauseBtn} onClick={pauseToggle}>
              {state.status === "paused" ? "▶ RESUME" : "⏸ PAUSE"}
            </button>
          )}

          {state.status === "game-over" && (
            <button className={styles.pauseBtn} onClick={restart}>
              ↺ RESTART
            </button>
          )}

          {state.status === "level-clear" && (
            <button className={styles.nextBtn} onClick={nextLevel}>
              ▶ NEXT WAVE
            </button>
          )}
        </div>
      </div>
      {pendingScore !== null && (
        <InitialsOverlay score={pendingScore} onSubmit={submitInitials} />
      )}
    </div>
  );
}
