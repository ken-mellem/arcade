import { useReducer, useEffect, useCallback, useRef } from "react";
import {
  createInitialState,
  snakeReducer,
  getTickInterval,
  type SnakeState,
  type SnakeAction,
} from "./SnakeEngine";
import type { Direction } from "./constants";

interface UseSnakeReturn {
  state: SnakeState;
  dispatch: React.Dispatch<SnakeAction>;
  start: () => void;
  restart: () => void;
  pauseToggle: () => void;
}

export function useSnake(): UseSnakeReturn {
  const [state, dispatch] = useReducer(
    snakeReducer,
    undefined,
    createInitialState,
  );

  // Keep a ref so the RAF loop always reads the latest state without re-subscribing
  const stateRef = useRef(state);
  stateRef.current = state;
  const rafRef = useRef<number | null>(null);
  const lastTickRef = useRef<number>(0);

  const gameLoop = useCallback((timestamp: number) => {
    const s = stateRef.current;
    if (s.status === "playing") {
      const interval = getTickInterval(s.level);
      if (timestamp - lastTickRef.current >= interval) {
        dispatch({ type: "TICK" });
        lastTickRef.current = timestamp;
      }
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
    const DIR_MAP: Record<string, Direction> = {
      ArrowUp: "UP",
      ArrowDown: "DOWN",
      ArrowLeft: "LEFT",
      ArrowRight: "RIGHT",
      w: "UP",
      W: "UP",
      s: "DOWN",
      S: "DOWN",
      a: "LEFT",
      A: "LEFT",
      d: "RIGHT",
      D: "RIGHT",
    };

    const handleKey = (e: KeyboardEvent) => {
      if (
        ["ArrowUp", "ArrowDown", "ArrowLeft", "ArrowRight", " "].includes(e.key)
      ) {
        e.preventDefault();
      }

      const dir = DIR_MAP[e.key];
      if (dir) {
        dispatch({ type: "CHANGE_DIRECTION", direction: dir });
        return;
      }

      switch (e.key) {
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
