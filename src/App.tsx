import { Routes, Route } from 'react-router-dom'
import { LandingPage } from './pages/LandingPage'
import { GameTablePage } from './pages/GameTablePage'
import './styles/pages.css'

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<LandingPage />} />
      <Route path="/play" element={<GameTablePage />} />
    </Routes>
  )
}
