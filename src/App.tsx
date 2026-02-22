import { Routes, Route } from "react-router-dom";
import LandingPage from "./pages/LandingPage";
import TetrisPage from "./games/tetris/TetrisPage";

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<LandingPage />} />
      <Route path="/games/tetris" element={<TetrisPage />} />
    </Routes>
  );
}
