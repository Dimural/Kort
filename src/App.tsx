import { Routes, Route } from 'react-router-dom'
import { LandingPage } from './pages/LandingPage'
import { GameTablePage } from './pages/GameTablePage'
import { LobbyPage } from './pages/LobbyPage'
import { LeaderboardPage } from './pages/LeaderboardPage'
import './styles/pages.css'

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<LandingPage />} />
      <Route path="/play" element={<GameTablePage />} />
      <Route path="/lobby" element={<LobbyPage />} />
      <Route path="/leaderboard" element={<LeaderboardPage />} />
    </Routes>
  )
}
