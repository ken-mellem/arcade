// ============================================================
// Asteroids — React Hook (game loop + input wiring)
// ============================================================

import { useReducer, useEffect, useCallback, useRef, useState } from "react";
import {
  createInitialState,
  asteroidsReducer,
  type AsteroidsState,
  type AsteroidsAction,
} from "./AsteroidsEngine";
import { loadScores, isTopScore, addScore } from "../../lib/highScores";

const GAME_ID = "asteroids";

interface UseAsteroidsReturn {
  state: AsteroidsState;
  dispatch: React.Dispatch<AsteroidsAction>;
  pendingScore: number | null;
  submitInitials: (initials: string) => void;
}

export function useAsteroids(): UseAsteroidsReturn {
  const [state, dispatch] = useReducer(asteroidsReducer, undefined, () =>
    createInitialState(loadScores(GAME_ID)[0]?.score ?? 0),
  );

  const [pendingScore, setPendingScore] = useState<number | null>(null);
  const pendingRef = useRef<number | null>(null);
  pendingRef.current = pendingScore;

  const stateRef = useRef(state);
  stateRef.current = state;

  const rafRef = useRef<number | null>(null);
  const lastTimeRef = useRef<number>(0);

  // Held keys — lives in a ref so the game loop never re-fires its useEffect
  const inputRef = useRef({
    rotLeft: false,
    rotRight: false,
    thrust: false,
    shoot: false,
  });

  const gameLoop = useCallback((timestamp: number) => {
    if (lastTimeRef.current === 0) lastTimeRef.current = timestamp;
    const dt = Math.min(timestamp - lastTimeRef.current, 50);
    lastTimeRef.current = timestamp;

    const s = stateRef.current;
    const { rotLeft, rotRight, thrust, shoot } = inputRef.current;

    if (
      s.status === "playing" ||
      s.status === "dying" ||
      s.status === "wave-clear"
    ) {
      dispatch({ type: "TICK", dt, rotLeft, rotRight, thrust, shoot });
      // shoot fires on key-press, not held — consume after dispatch
      inputRef.current.shoot = false;
    }

    rafRef.current = requestAnimationFrame(gameLoop);
  }, []);

  useEffect(() => {
    rafRef.current = requestAnimationFrame(gameLoop);
    return () => {
      if (rafRef.current !== null) cancelAnimationFrame(rafRef.current);
    };
  }, [gameLoop]);

  // ── High-score gate ─────────────────────────────────────────
  const prevStatusRef = useRef(state.status);
  useEffect(() => {
    const prev = prevStatusRef.current;
    const curr = state.status;
    prevStatusRef.current = curr;

    if (prev !== "game-over" && curr === "game-over") {
      if (state.score > 0 && isTopScore(GAME_ID, state.score)) {
        setPendingScore(state.score);
      }
    }
  }, [state.status, state.score]);

  const submitInitials = useCallback((initials: string) => {
    if (pendingRef.current === null) return;
    addScore(GAME_ID, pendingRef.current, initials);
    setPendingScore(null);
  }, []);

  // ── Keyboard input ──────────────────────────────────────────
  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      const s = stateRef.current;

      // Prevent arrow-key page scroll while playing
      if (["ArrowLeft", "ArrowRight", "ArrowUp", " "].includes(e.key)) {
        e.preventDefault();
      }

      switch (e.key) {
        case "ArrowLeft":
        case "z":
        case "Z":
          inputRef.current.rotLeft = true;
          break;
        case "ArrowRight":
        case "x":
        case "X":
          inputRef.current.rotRight = true;
          break;
        case "ArrowUp":
          inputRef.current.thrust = true;
          break;
        case " ":
          inputRef.current.shoot = true;
          break;
        case "p":
        case "P":
          dispatch({ type: "PAUSE_TOGGLE" });
          break;
        case "Enter": {
          if (s.status === "idle") dispatch({ type: "START" });
          else if (s.status === "game-over" && pendingRef.current === null)
            dispatch({ type: "RESTART" });
          break;
        }
      }
    };

    const onKeyUp = (e: KeyboardEvent) => {
      switch (e.key) {
        case "ArrowLeft":
        case "z":
        case "Z":
          inputRef.current.rotLeft = false;
          break;
        case "ArrowRight":
        case "x":
        case "X":
          inputRef.current.rotRight = false;
          break;
        case "ArrowUp":
          inputRef.current.thrust = false;
          break;
      }
    };

    window.addEventListener("keydown", onKeyDown);
    window.addEventListener("keyup", onKeyUp);
    return () => {
      window.removeEventListener("keydown", onKeyDown);
      window.removeEventListener("keyup", onKeyUp);
    };
  }, []);

  return { state, dispatch, pendingScore, submitInitials };
}
