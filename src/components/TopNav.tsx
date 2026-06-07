import { Link } from 'react-router-dom'
import { Logo } from './Logo'

const LINKS = [
  { label: 'Home', to: '/' },
  { label: 'How to Play', to: '/' },
  { label: 'Features', to: '/' },
  { label: 'Leaderboard', to: '/leaderboard' },
  { label: 'About', to: '/' },
]

/** Marketing-site top navigation used on the landing page. */
export function TopNav() {
  return (
    <header className="topnav">
      <div className="container topnav__inner">
        <Link to="/" aria-label="Kort home">
          <Logo />
        </Link>
        <nav className="topnav__links">
          {LINKS.map((l) => (
            <Link key={l.label} to={l.to} className="topnav__link">
              {l.label}
            </Link>
          ))}
        </nav>
        <div className="topnav__actions">
          <button className="btn btn-ghost btn--sm">Log in</button>
          <Link to="/lobby" className="btn btn-blue btn--sm">
            Sign Up
          </Link>
        </div>
      </div>
    </header>
  )
}
