// ============================================================
// Asteroids — Route Page Component
// ============================================================

import { useEffect, useRef, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { useAsteroids } from "./useAsteroids";
import {
  CANVAS_W,
  CANVAS_H,
  SHIP_RADIUS,
  ASTEROID_VERTS,
  COLOR_BG,
  COLOR_FG,
  COLOR_THRUST,
  COLOR_INVUL,
} from "./constants";
import ArcadeScreen from "../../components/ArcadeScreen";
import InitialsOverlay from "../../components/InitialsOverlay";
import type { Asteroid, Ufo, Ship } from "./AsteroidsEngine";
import styles from "./AsteroidsPage.module.css";

// ── Drawing helpers ────────────────────────────────────────────

/** Apply a transform, call draw fn at (0,0), restore. */
function withTransform(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  fn: () => void,
): void {
  ctx.save();
  ctx.translate(x, y);
  fn();
  ctx.restore();
}

/**
 * Draw a thing centred at (cx, cy) — plus up to 3 "ghost" copies that appear
 * on the opposite edge when the object wraps near a boundary.
 */
function drawWrapped(
  ctx: CanvasRenderingContext2D,
  cx: number,
  cy: number,
  radius: number,
  fn: (ctx: CanvasRenderingContext2D) => void,
): void {
  // Collect x/y offsets for wrapped copies
  const offsets: Array<[number, number]> = [[0, 0]];
  if (cx - radius < 0) offsets.push([CANVAS_W, 0]);
  if (cx + radius > CANVAS_W) offsets.push([-CANVAS_W, 0]);
  if (cy - radius < 0) offsets.push([0, CANVAS_H]);
  if (cy + radius > CANVAS_H) offsets.push([0, -CANVAS_H]);
  // Corner ghosts
  if (cx - radius < 0 && cy - radius < 0) offsets.push([CANVAS_W, CANVAS_H]);
  if (cx + radius > CANVAS_W && cy - radius < 0)
    offsets.push([-CANVAS_W, CANVAS_H]);
  if (cx - radius < 0 && cy + radius > CANVAS_H)
    offsets.push([CANVAS_W, -CANVAS_H]);
  if (cx + radius > CANVAS_W && cy + radius > CANVAS_H)
    offsets.push([-CANVAS_W, -CANVAS_H]);

  for (const [ox, oy] of offsets) {
    withTransform(ctx, cx + ox, cy + oy, () => fn(ctx));
  }
}

function drawAsteroid(ctx: CanvasRenderingContext2D, a: Asteroid): void {
  ctx.strokeStyle = COLOR_FG;
  ctx.lineWidth = 1.5;

  drawWrapped(ctx, a.x, a.y, a.radius, (c) => {
    c.beginPath();
    for (let i = 0; i < ASTEROID_VERTS; i++) {
      const theta = a.angle + (i / ASTEROID_VERTS) * Math.PI * 2;
      const r = a.radius * a.verts[i];
      const vx = Math.cos(theta) * r;
      const vy = Math.sin(theta) * r;
      if (i === 0) c.moveTo(vx, vy);
      else c.lineTo(vx, vy);
    }
    c.closePath();
    c.stroke();
  });
}

/** Local ship points (pointing right, angle = 0). */
const SHIP_NOSE = [16, 0] as const;
const SHIP_LEFT = [-10, -9] as const;
const SHIP_INDENT = [-5, 0] as const;
const SHIP_RIGHT = [-10, 9] as const;

function drawShip(
  ctx: CanvasRenderingContext2D,
  ship: Ship,
  invulBlink: boolean,
): void {
  if (ship.dying) return;
  if (invulBlink) return; // blink off

  const color = ship.invulTimer > 0 ? COLOR_INVUL : COLOR_FG;
  ctx.strokeStyle = color;
  ctx.lineWidth = 1.5;

  drawWrapped(ctx, ship.x, ship.y, SHIP_RADIUS * 2, (c) => {
    c.save();
    c.rotate(ship.angle);

    // Hull: nose → left → indent → right → close
    c.beginPath();
    c.moveTo(SHIP_NOSE[0], SHIP_NOSE[1]);
    c.lineTo(SHIP_LEFT[0], SHIP_LEFT[1]);
    c.lineTo(SHIP_INDENT[0], SHIP_INDENT[1]);
    c.lineTo(SHIP_RIGHT[0], SHIP_RIGHT[1]);
    c.closePath();
    c.stroke();

    // Thruster flame
    if (ship.thrusting) {
      const flicker = 4 + Math.random() * 6;
      c.strokeStyle = COLOR_THRUST;
      c.lineWidth = 1.5;
      c.beginPath();
      c.moveTo(SHIP_LEFT[0], SHIP_LEFT[1] * 0.5);
      c.lineTo(-10 - flicker, 0);
      c.lineTo(SHIP_RIGHT[0], SHIP_RIGHT[1] * 0.5);
      c.stroke();
    }

    c.restore();
  });
}

/** Debris lines rendered during ship death animation. */
const EXPLOSION_LINES: ReadonlyArray<
  readonly [number, number, number, number]
> = [
  [18, 0, 36, 0],
  [-14, -9, -28, -18],
  [-14, 9, -28, 18],
  [5, -4, 10, -14],
  [5, 4, 10, 14],
  [-10, -1, -20, -2],
  [-2, -8, -4, -18],
  [-2, 8, -4, 18],
];

function drawExplosion(
  ctx: CanvasRenderingContext2D,
  ship: Ship,
  progress: number, // 0..1 (0 = just died, 1 = end)
): void {
  ctx.strokeStyle = COLOR_FG;
  ctx.lineWidth = 1.5;

  ctx.save();
  ctx.translate(ship.x, ship.y);
  ctx.rotate(ship.angle);

  for (const [x1, y1, x2, y2] of EXPLOSION_LINES) {
    const expand = 1 + progress * 2.5;
    ctx.beginPath();
    ctx.moveTo(x1 * expand, y1 * expand);
    ctx.lineTo(x2 * expand, y2 * expand);
    ctx.stroke();
  }

  ctx.restore();
}

function drawUfo(ctx: CanvasRenderingContext2D, ufo: Ufo): void {
  ctx.strokeStyle = COLOR_FG;
  ctx.lineWidth = 1.5;

  withTransform(ctx, ufo.x, ufo.y, () => {
    const r = ufo.radius;

    // Bottom saucer arc
    ctx.beginPath();
    ctx.arc(0, 2, r, 0, Math.PI, true); // bottom half (dome flipped)
    ctx.closePath();
    ctx.stroke();

    // Main body oval (wider)
    ctx.beginPath();
    ctx.ellipse(0, 2, r * 1.4, r * 0.55, 0, 0, Math.PI * 2);
    ctx.stroke();

    // Top dome
    ctx.beginPath();
    ctx.arc(0, 2, r * 0.6, Math.PI, 0, false);
    ctx.closePath();
    ctx.stroke();
  });
}

// ── Component ──────────────────────────────────────────────────

export default function AsteroidsPage() {
  const navigate = useNavigate();
  const { state, dispatch, pendingScore, submitInitials } = useAsteroids();
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const blinkRef = useRef(false);
  const blinkTimerRef = useRef(0);
  const prevTimeRef = useRef(0);
  const deathAnimTotalRef = useRef(0); // total ms of death animation for progress calc

  // Track death anim total duration for progress normalisation
  useEffect(() => {
    if (
      state.status === "dying" &&
      state.deathAnimTimer > deathAnimTotalRef.current
    ) {
      deathAnimTotalRef.current = state.deathAnimTimer;
    }
    if (state.status !== "dying") {
      deathAnimTotalRef.current = 0;
    }
  }, [state.status, state.deathAnimTimer]);

  // Stars — deterministic
  const stars = useMemo(() => {
    const arr: Array<{ x: number; y: number; r: number }> = [];
    let seed = 17;
    const rng = () => {
      seed = (seed * 1664525 + 1013904223) & 0xffffffff;
      return (seed >>> 0) / 0x100000000;
    };
    for (let i = 0; i < 60; i++) {
      arr.push({
        x: rng() * CANVAS_W,
        y: rng() * CANVAS_H,
        r: rng() * 1.0 + 0.4,
      });
    }
    return arr;
  }, []);

  // ── Canvas draw ────────────────────────────────────────────
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const now = performance.now();
    const elapsed = now - prevTimeRef.current;
    prevTimeRef.current = now;

    // Invulnerability blink (toggle every 120ms)
    blinkTimerRef.current += elapsed;
    if (blinkTimerRef.current >= 120) {
      blinkTimerRef.current = 0;
      blinkRef.current = !blinkRef.current;
    }

    // ── Background ──────────────────────────────────────────
    ctx.fillStyle = COLOR_BG;
    ctx.fillRect(0, 0, CANVAS_W, CANVAS_H);

    // Stars
    for (const s of stars) {
      ctx.fillStyle = COLOR_FG;
      ctx.globalAlpha = 0.35;
      ctx.beginPath();
      ctx.arc(s.x, s.y, s.r, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.globalAlpha = 1;

    // ── Asteroids ────────────────────────────────────────────
    for (const a of state.asteroids) {
      drawAsteroid(ctx, a);
    }

    // ── UFO ──────────────────────────────────────────────────
    if (state.ufo) {
      drawUfo(ctx, state.ufo);
    }

    // ── Bullets ──────────────────────────────────────────────
    for (const b of state.bullets) {
      ctx.fillStyle = b.fromUfo ? "#ff4444" : COLOR_FG;
      ctx.beginPath();
      ctx.arc(b.x, b.y, 2, 0, Math.PI * 2);
      ctx.fill();
    }

    // ── Ship ─────────────────────────────────────────────────
    const invulBlink = state.ship.invulTimer > 0 && blinkRef.current;
    drawShip(ctx, state.ship, invulBlink);

    // ── Death explosion ───────────────────────────────────────
    if (state.status === "dying" && state.ship.dying) {
      const total = deathAnimTotalRef.current;
      const progress = total > 0 ? 1 - state.deathAnimTimer / total : 0;
      drawExplosion(ctx, state.ship, Math.min(progress, 1));
    }

    // ── Overlay text ─────────────────────────────────────────
    if (state.status === "idle") {
      ctx.textAlign = "center";
      ctx.font = 'bold 48px "Courier New", monospace';
      ctx.fillStyle = COLOR_FG;
      ctx.fillText("ASTEROIDS", CANVAS_W / 2, CANVAS_H / 2 - 40);

      ctx.font = 'bold 16px "Courier New", monospace';
      ctx.fillText("PRESS ENTER TO START", CANVAS_W / 2, CANVAS_H / 2 + 20);

      ctx.font = '13px "Courier New", monospace';
      ctx.fillStyle = "#aaaaaa";
      ctx.fillText(
        "← → ROTATE   ↑ THRUST   SPACE FIRE   P PAUSE",
        CANVAS_W / 2,
        CANVAS_H / 2 + 56,
      );
    }

    if (state.status === "paused") {
      ctx.textAlign = "center";
      ctx.font = 'bold 32px "Courier New", monospace';
      ctx.fillStyle = COLOR_FG;
      ctx.fillText("PAUSED", CANVAS_W / 2, CANVAS_H / 2);
      ctx.font = '14px "Courier New", monospace';
      ctx.fillStyle = "#aaaaaa";
      ctx.fillText("PRESS P TO RESUME", CANVAS_W / 2, CANVAS_H / 2 + 30);
    }

    if (state.status === "wave-clear") {
      ctx.textAlign = "center";
      ctx.font = 'bold 24px "Courier New", monospace';
      ctx.fillStyle = COLOR_FG;
      ctx.fillText(`WAVE ${state.wave} CLEAR`, CANVAS_W / 2, CANVAS_H / 2);
    }

    if (state.status === "game-over") {
      ctx.textAlign = "center";
      ctx.font = 'bold 40px "Courier New", monospace';
      ctx.fillStyle = COLOR_FG;
      ctx.fillText("GAME OVER", CANVAS_W / 2, CANVAS_H / 2 - 20);

      if (pendingScore === null) {
        ctx.font = '16px "Courier New", monospace';
        ctx.fillStyle = "#aaaaaa";
        ctx.fillText(
          "PRESS ENTER TO PLAY AGAIN",
          CANVAS_W / 2,
          CANVAS_H / 2 + 24,
        );
      }
    }
  });

  // ── Back navigation ────────────────────────────────────────
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") navigate("/");
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [navigate]);

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
            <span className={styles.statValue}>
              {state.status === "idle" ? "—" : state.wave}
            </span>
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
        <ArcadeScreen title="ASTEROIDS" accent="var(--color-neon-yellow)">
          <canvas
            ref={canvasRef}
            width={CANVAS_W}
            height={CANVAS_H}
            className={styles.canvas}
          />
        </ArcadeScreen>

        {/* Right panel */}
        <div className={styles.rightPanel}>
          <div className={styles.controls}>
            <p className={styles.controlsTitle}>CONTROLS</p>
            <ul className={styles.controlsList}>
              <li>
                <kbd>← →</kbd> Rotate
              </li>
              <li>
                <kbd>↑</kbd> Thrust
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
              <li>
                <kbd>ESC</kbd> Hub
              </li>
            </ul>
          </div>

          <div className={styles.scoreTable}>
            <p className={styles.controlsTitle}>POINTS</p>
            <ul className={styles.scoreList}>
              <li className={styles.scoreRowLarge}>Large — 20</li>
              <li className={styles.scoreRowMedium}>Medium — 50</li>
              <li className={styles.scoreRowSmall}>Small — 100</li>
              <li className={styles.scoreRowSaucerLg}>Saucer L — 200</li>
              <li className={styles.scoreRowSaucerSm}>Saucer S — 1000</li>
            </ul>
          </div>

          {(state.status === "playing" || state.status === "paused") && (
            <button
              className={styles.pauseBtn}
              onClick={() => dispatch({ type: "PAUSE_TOGGLE" })}
            >
              {state.status === "paused" ? "▶ RESUME" : "⏸ PAUSE"}
            </button>
          )}

          {state.status === "game-over" && (
            <button
              className={styles.pauseBtn}
              onClick={() => dispatch({ type: "RESTART" })}
            >
              ↺ RESTART
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
