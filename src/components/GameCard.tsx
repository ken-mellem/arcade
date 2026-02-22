import { useNavigate } from "react-router-dom";
import type { GameEntry } from "../games/registry";
import styles from "./GameCard.module.css";

interface Props {
  game: GameEntry;
}

export default function GameCard({ game }: Props) {
  const navigate = useNavigate();

  const handlePlay = () => {
    if (game.status === "available") {
      navigate(game.route);
    }
  };

  return (
    <div
      className={`${styles.card} ${game.status === "coming-soon" ? styles.comingSoon : ""}`}
      style={{ "--accent": game.accentColor } as React.CSSProperties}
    >
      {/* Preview area */}
      <div className={styles.preview}>
        <span className={styles.previewTitle}>{game.title}</span>
      </div>

      {/* Info area */}
      <div className={styles.info}>
        <h2 className={styles.title}>{game.title}</h2>
        <p className={styles.description}>{game.description}</p>
        <p className={styles.controls}>{game.controls}</p>
      </div>

      {/* CTA */}
      <button
        className={styles.playBtn}
        onClick={handlePlay}
        disabled={game.status === "coming-soon"}
        aria-label={`Play ${game.title}`}
      >
        {game.status === "available" ? "▶ INSERT COIN" : "COMING SOON"}
      </button>
    </div>
  );
}
