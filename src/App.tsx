import { Routes, Route } from "react-router-dom";
import LandingPage from "./pages/LandingPage";
import TetrisPage from "./games/tetris/TetrisPage";
import SnakePage from "./games/snake/SnakePage";
import SpaceInvadersPage from "./games/space-invaders/SpaceInvadersPage";

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<LandingPage />} />
      <Route path="/games/tetris" element={<TetrisPage />} />
      <Route path="/games/snake" element={<SnakePage />} />
      <Route path="/games/space-invaders" element={<SpaceInvadersPage />} />
    </Routes>
  );
}
