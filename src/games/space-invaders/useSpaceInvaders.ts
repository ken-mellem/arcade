// ============================================================
// Space Invaders — React Hook (game loop + input wiring)
// ============================================================

import { useReducer, useEffect, useCallback, useRef } from "react";
import {
  createInitialState,
  spaceInvadersReducer,
  type SpaceInvadersState,
  type SpaceInvadersAction,
} from "./SpaceInvadersEngine";

interface UseSpaceInvadersReturn {
  state: SpaceInvadersState;
  dispatch: React.Dispatch<SpaceInvadersAction>;
  start: () => void;
  restart: () => void;
  nextLevel: () => void;
  pauseToggle: () => void;
}

export function useSpaceInvaders(): UseSpaceInvadersReturn {
  const [state, dispatch] = useReducer(
    spaceInvadersReducer,
    undefined,
    createInitialState,
  );

  const stateRef = useRef(state);
  stateRef.current = state;

  const rafRef = useRef<number | null>(null);
  const lastTimeRef = useRef<number>(0);

  // Held-key input state — lives in a ref so the game loop never re-subscribes
  const inputRef = useRef({ left: false, right: false, shoot: false });

  const gameLoop = useCallback((timestamp: number) => {
    if (lastTimeRef.current === 0) lastTimeRef.current = timestamp;
    const dt = Math.min(timestamp - lastTimeRef.current, 50); // cap at 50 ms
    lastTimeRef.current = timestamp;

    const s = stateRef.current;
    if (s.status === "playing" || s.status === "dying") {
      const { left, right, shoot } = inputRef.current;
      dispatch({ type: "TICK", dt, moveLeft: left, moveRight: right, shoot });
      // Space-bar fires on press, not held — consume the flag after dispatching
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

  // ── Keyboard input ─────────────────────────────────────
  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (["ArrowLeft", "ArrowRight", " "].includes(e.key)) e.preventDefault();

      switch (e.key) {
        case "ArrowLeft":
        case "a":
        case "A":
          inputRef.current.left = true;
          break;
        case "ArrowRight":
        case "d":
        case "D":
          inputRef.current.right = true;
          break;
        case " ":
          inputRef.current.shoot = true;
          break;
        case "p":
        case "P":
          dispatch({ type: "PAUSE_TOGGLE" });
          break;
        case "Enter": {
          const s = stateRef.current;
          if (s.status === "idle") dispatch({ type: "START" });
          else if (s.status === "game-over") dispatch({ type: "RESTART" });
          else if (s.status === "level-clear") dispatch({ type: "NEXT_LEVEL" });
          break;
        }
      }
    };

    const onKeyUp = (e: KeyboardEvent) => {
      switch (e.key) {
        case "ArrowLeft":
        case "a":
        case "A":
          inputRef.current.left = false;
          break;
        case "ArrowRight":
        case "d":
        case "D":
          inputRef.current.right = false;
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

  const start = useCallback(() => dispatch({ type: "START" }), []);
  const restart = useCallback(() => dispatch({ type: "RESTART" }), []);
  const nextLevel = useCallback(() => dispatch({ type: "NEXT_LEVEL" }), []);
  const pauseToggle = useCallback(() => dispatch({ type: "PAUSE_TOGGLE" }), []);

  return { state, dispatch, start, restart, nextLevel, pauseToggle };
}
