import { useState } from 'react'
import { Link } from 'react-router-dom'
import { AssetImage } from '../components/AssetImage'

type Row = { rank: number; name: string; rating: number; you?: boolean }

const PLAYERS: Row[] = [
  { rank: 1, name: 'CardUstad', rating: 2450 },
  { rank: 2, name: 'AcePartner', rating: 2310 },
  { rank: 3, name: 'QoshqanDost', rating: 2150 },
  { rank: 4, name: 'PlayerOne', rating: 1980, you: true },
  { rank: 5, name: 'DostWiin', rating: 1870 },
]

const TABS = ['Global', 'Friends', 'Today'] as const

function avatarColor(name: string) {
  const colors = ['#2f6f9e', '#e0764f', '#6a9a6a', '#9a6ab0', '#c2a04f']
  let sum = 0
  for (const ch of name) sum += ch.charCodeAt(0)
  return colors[sum % colors.length]
}

export function LeaderboardPage() {
  const [tab, setTab] = useState<(typeof TABS)[number]>('Global')

  return (
    <div className="lb-page">
      <div className="lb-page__col">
        {/* leaderboard card */}
        <section className="leaderboard panel">
          <h2 className="leaderboard__title">Leaderboard</h2>

          <div className="lb-tabs">
            {TABS.map((t) => (
              <button
                key={t}
                className={`lb-tab ${tab === t ? 'is-active' : ''}`}
                onClick={() => setTab(t)}
              >
                {t}
              </button>
            ))}
          </div>

          <div className="lb-head">
            <span>#</span>
            <span>Player</span>
            <span className="lb-head__rating">Rating</span>
          </div>

          <ul className="lb-rows">
            {PLAYERS.map((p) => (
              <li key={p.rank} className={`lb-row ${p.you ? 'is-you' : ''}`}>
                <span className="lb-row__rank">{p.rank}</span>
                <span className="lb-row__player">
                  <span className="lb-row__avatar" style={{ background: avatarColor(p.name) }}>
                    {p.name[0]}
                  </span>
                  {p.name}
                </span>
                <span className="lb-row__rating">{p.rating.toLocaleString()}</span>
              </li>
            ))}
          </ul>

          <a href="#" className="leaderboard__more">
            View Full Leaderboard
          </a>
        </section>

        {/* invite banner */}
        <section className="invite">
          <div className="invite__art">
            <AssetImage
              src="players.png"
              label="Four friends playing Kort around a table"
              className="invite__img"
            />
          </div>
          <div className="invite__copy">
            <h3 className="invite__title">
              Bring people together.
              <br />
              One hand at a time.
            </h3>
            <p className="invite__lede">
              Kort is more than a game — it's a tradition we play together.
            </p>
            <Link to="/lobby" className="btn btn-ghost invite__btn">
              👥 Invite Friends
            </Link>
          </div>
        </section>
      </div>
    </div>
  )
}
