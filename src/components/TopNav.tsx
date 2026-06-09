import { Link } from 'react-router-dom'
import { Logo } from './Logo'

/** Minimal top bar: wordmark + a single way in. */
export function TopNav() {
  return (
    <header className="topnav">
      <div className="container topnav__inner">
        <Link to="/" aria-label="Kort home">
          <Logo />
        </Link>
        <Link to="/play" className="btn btn-blue btn--sm">
          Play Now
        </Link>
      </div>
    </header>
  )
}
