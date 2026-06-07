import { useState } from 'react'
import { Link } from 'react-router-dom'
import { Ornament } from '../components/Ornament'
import { AssetImage } from '../components/AssetImage'

const NAV = [
  { icon: '🎴', label: 'Play', key: 'play' },
  { icon: '👥', label: 'Friends', key: 'friends' },
  { icon: '👤', label: 'Profile', key: 'profile' },
  { icon: '🏆', label: 'Leaderboard', key: 'leaderboard' },
  { icon: '⚙️', label: 'Settings', key: 'settings' },
]

export function LobbyPage() {
  const [mode, setMode] = useState<'classic' | 'relaxed'>('classic')

  return (
    <div className="lobby-page">
      <div className="lobby panel">
        {/* sidebar */}
        <aside className="lobby__side">
          <h2 className="lobby__brand">Lobby</h2>
          <nav className="lobby__nav">
            {NAV.map((item) => {
              const isLeaderboard = item.key === 'leaderboard'
              const content = (
                <span className={`lobby__navitem ${item.key === 'play' ? 'is-active' : ''}`}>
                  <span className="lobby__navicon">{item.icon}</span>
                  {item.label}
                </span>
              )
              return isLeaderboard ? (
                <Link key={item.key} to="/leaderboard">
                  {content}
                </Link>
              ) : (
                <button key={item.key} className="lobby__navbtn">
                  {content}
                </button>
              )
            })}
          </nav>
        </aside>

        {/* main */}
        <div className="lobby__main">
          <h3 className="lobby__title">Select Game Mode</h3>

          <div className="modes">
            <button
              className={`mode ${mode === 'classic' ? 'is-selected' : ''}`}
              onClick={() => setMode('classic')}
            >
              <Ornament size={56} color="var(--c-blue)" />
              <div className="mode__name">Classic</div>
              <p className="mode__desc">The original Kort experience.</p>
            </button>

            <button
              className={`mode ${mode === 'relaxed' ? 'is-selected' : ''}`}
              onClick={() => setMode('relaxed')}
            >
              <AssetImage src="icon-teapot.png" label="Teapot" className="mode__art" />
              <div className="mode__name">Relaxed</div>
              <p className="mode__desc">A relaxed game for casual fun.</p>
            </button>
          </div>

          <Link to="/play" className="btn btn-blue lobby__find">
            Find Match
          </Link>
          <button className="btn btn-ghost lobby__private">Create Private Room</button>
        </div>
      </div>
    </div>
  )
}
