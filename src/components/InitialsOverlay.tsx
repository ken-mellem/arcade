// ============================================================
// InitialsOverlay — appears after a qualifying game-over
// ============================================================

import { useEffect, useRef, useState, type FC } from "react";
import styles from "./InitialsOverlay.module.css";

interface Props {
  score: number;
  onSubmit: (initials: string) => void;
}

const InitialsOverlay: FC<Props> = ({ score, onSubmit }) => {
  const [value, setValue] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);

  // Autofocus the input on mount
  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const clean = e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, "");
    setValue(clean.slice(0, 3));
  };

  const handleSubmit = (e?: React.FormEvent) => {
    e?.preventDefault();
    if (value.trim().length === 0) return;
    onSubmit(value.padEnd(3, "_"));
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    // Stop arrow keys from leaking into the game's keyboard handler
    e.stopPropagation();
  };

  return (
    <div className={styles.overlay} onKeyDown={handleKeyDown}>
      <div className={styles.box}>
        <p className={styles.newHigh}>NEW HIGH SCORE!</p>
        <p className={styles.scoreValue}>{score.toLocaleString()}</p>

        <form className={styles.form} onSubmit={handleSubmit}>
          <label className={styles.label} htmlFor="initials-input">
            ENTER YOUR INITIALS
          </label>
          <input
            id="initials-input"
            ref={inputRef}
            className={styles.input}
            type="text"
            maxLength={3}
            value={value}
            onChange={handleChange}
            autoComplete="off"
            spellCheck={false}
          />
          <button
            className={styles.submitBtn}
            type="submit"
            disabled={value.trim().length === 0}
          >
            ▶ SUBMIT
          </button>
        </form>
      </div>
    </div>
  );
};

export default InitialsOverlay;
