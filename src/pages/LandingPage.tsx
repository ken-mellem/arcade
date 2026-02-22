import { GAMES } from "../games/registry";
import GameCard from "../components/GameCard";
import styles from "./LandingPage.module.css";

export default function LandingPage() {
  return (
    <div className={`page-scrollable ${styles.page}`}>
      {/* Header */}
      <header className={styles.header}>
        <div className={styles.headerInner}>
          <h1 className={styles.logo}>
            <span className="neon-green">ARCADE</span>
            <span className={styles.logoSub}>HUB</span>
          </h1>
          <p className={styles.tagline}>SELECT YOUR GAME</p>
        </div>
        {/* Marquee ticker */}
        <div className={styles.marqueeWrap} aria-hidden>
          <span className={styles.marqueeText}>
            ★ INSERT COIN ★ HIGH SCORE ★ GAME OVER ★ PRESS START ★ PLAYER ONE ★
            INSERT COIN ★ HIGH SCORE ★
          </span>
        </div>
      </header>

      {/* Game grid */}
      <main className={styles.main}>
        <div className={styles.grid}>
          {GAMES.map((game) => (
            <GameCard key={game.id} game={game} />
          ))}
        </div>
      </main>

      {/* Footer */}
      <footer className={styles.footer}>
        <span>© 2026 ARCADE HUB</span>
        <span className={styles.blink}>□</span>
      </footer>
    </div>
  );
}
