import { useReducer, useEffect, useCallback, useRef } from "react";
import {
  createInitialState,
  tetrisReducer,
  getDropInterval,
  type TetrisState,
  type TetrisAction,
} from "./TetrisEngine";

interface UseTetrisReturn {
  state: TetrisState;
  dispatch: React.Dispatch<TetrisAction>;
  start: () => void;
  restart: () => void;
  pauseToggle: () => void;
}

export function useTetris(): UseTetrisReturn {
  const [state, dispatch] = useReducer(
    tetrisReducer,
    undefined,
    createInitialState,
  );

  // ── Game loop ──────────────────────────────────────────
  const stateRef = useRef(state);
  stateRef.current = state;
  const rafRef = useRef<number | null>(null);
  const lastTickRef = useRef<number>(0);

  const gameLoop = useCallback((timestamp: number) => {
    const s = stateRef.current;
    if (s.status !== "playing") {
      rafRef.current = requestAnimationFrame(gameLoop);
      return;
    }

    const interval = getDropInterval(s.level);
    if (timestamp - lastTickRef.current >= interval) {
      dispatch({ type: "TICK" });
      lastTickRef.current = timestamp;
    }

    rafRef.current = requestAnimationFrame(gameLoop);
  }, []);

  useEffect(() => {
    rafRef.current = requestAnimationFrame(gameLoop);
    return () => {
      if (rafRef.current !== null) cancelAnimationFrame(rafRef.current);
    };
  }, [gameLoop]);

  // ── Keyboard input ─────────────────────────────────────
  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      // Prevent default browser scroll for game keys
      if (
        ["ArrowLeft", "ArrowRight", "ArrowUp", "ArrowDown", " "].includes(e.key)
      ) {
        e.preventDefault();
      }

      switch (e.key) {
        case "ArrowLeft":
          dispatch({ type: "MOVE_LEFT" });
          break;
        case "ArrowRight":
          dispatch({ type: "MOVE_RIGHT" });
          break;
        case "ArrowUp":
          dispatch({ type: "ROTATE" });
          break;
        case "ArrowDown":
          dispatch({ type: "SOFT_DROP" });
          break;
        case " ":
          dispatch({ type: "HARD_DROP" });
          break;
        case "c":
        case "C":
          dispatch({ type: "HOLD" });
          break;
        case "p":
        case "P":
          dispatch({ type: "PAUSE_TOGGLE" });
          break;
        case "Enter": {
          const s = stateRef.current;
          if (s.status === "idle") dispatch({ type: "START" });
          else if (s.status === "game-over") dispatch({ type: "RESTART" });
          break;
        }
      }
    };

    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, []);

  const start = useCallback(() => dispatch({ type: "START" }), []);
  const restart = useCallback(() => dispatch({ type: "RESTART" }), []);
  const pauseToggle = useCallback(() => dispatch({ type: "PAUSE_TOGGLE" }), []);

  return { state, dispatch, start, restart, pauseToggle };
}
