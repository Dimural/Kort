import { Link } from 'react-router-dom'
import { TopNav } from '../components/TopNav'
import { Logo } from '../components/Logo'
import { AssetImage } from '../components/AssetImage'
import { CardBack } from '../components/Card'
import { Icon, type IconName } from '../components/Icon'

/** A small cluster of face-down cards for one arm of the hero board. */
function CardArm({ count, className }: { count: number; className: string }) {
  return (
    <div className={`hero-arm ${className}`}>
      {Array.from({ length: count }).map((_, i) => (
        <CardBack key={i} />
      ))}
    </div>
  )
}

const STATS: { icon: IconName; value: string; label: string }[] = [
  { icon: 'users', value: '2v2', label: 'TEAM PLAY' },
  { icon: 'group', value: '4', label: 'PLAYERS' },
  { icon: 'clock', value: '15–20 MIN', label: 'AVG. GAME' },
  { icon: 'bolt', value: 'STRATEGY', label: 'TEAMWORK WINS' },
]

const FEATURES: { icon: IconName; title: string; body: string }[] = [
  {
    icon: 'users',
    title: '2v2 Team Play',
    body: 'You and your partner vs. the other team. Work together & win!',
  },
  {
    icon: 'cards',
    title: 'Only See Your Own Cards',
    body: 'Each player can only see their own hand. Plan wisely!',
  },
  {
    icon: 'group',
    title: 'Fun for Family & Friends',
    body: 'Perfect for all ages. Connect, laugh, and make memories.',
  },
  {
    icon: 'book',
    title: 'Easy to Learn',
    body: 'Simple rules, quick to pick up, hard to master.',
  },
]

export function LandingPage() {
  return (
    <div className="landing">
      <TopNav />

      {/* ---- Hero ---- */}
      <section className="container hero">
        <div className="hero__copy">
          <h1 className="hero__title">Kort</h1>
          <p className="hero__subtitle">A classic Uyghur team card game</p>
          <p className="hero__lede">
            Play with your partner across the table in this traditional 2v2
            Uyghur card game. Smart moves, good teamwork, great times!
          </p>
          <div className="hero__cta">
            <Link to="/lobby" className="btn btn-accent">
              Play Now
            </Link>
            <Link to="/play" className="btn btn-ghost">
              <Icon name="play" size={15} /> Watch Demo
            </Link>
          </div>
        </div>

        <div className="hero__art">
          <div className="hero__board">
            <AssetImage
              src="hero-board.png"
              label="Hero — ornate gold-framed Kort board"
              className="hero__board-img"
              fit="contain"
            />
            <div className="hero__layout">
              <CardArm count={3} className="hero-arm--top" />
              <CardArm count={3} className="hero-arm--left" />
              <CardBack className="hero-arm--center" />
              <CardArm count={3} className="hero-arm--right" />
              <CardArm count={3} className="hero-arm--bottom" />
            </div>
          </div>
        </div>
      </section>

      {/* ---- Stats strip ---- */}
      <section className="container">
        <div className="statbar panel">
          {STATS.map((s) => (
            <div key={s.label} className="statbar__item">
              <span className="statbar__icon">
                <Icon name={s.icon} size={22} />
              </span>
              <div>
                <div className="statbar__value">{s.value}</div>
                <div className="statbar__label">{s.label}</div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ---- Why you'll love Kort ---- */}
      <section className="container features">
        <h2 className="flourish-heading features__heading">Why you'll love Kort</h2>
        <div className="features__grid">
          {FEATURES.map((f) => (
            <article key={f.title} className="feature panel">
              <span className="feature__icon">
                <Icon name={f.icon} size={26} />
              </span>
              <h3 className="feature__title">{f.title}</h3>
              <p className="feature__body">{f.body}</p>
            </article>
          ))}
        </div>
      </section>

      {/* ---- Landscape banner ---- */}
      <section className="landscape">
        <img
          src="/assets/landscape.png"
          alt="Watercolor Uyghur landscape — mosques, mountains, blossoms"
          className="landscape__img"
        />
      </section>

      {/* ---- Footer ---- */}
      <footer className="footer">
        <div className="container footer__inner">
          <Logo />
          <span className="footer__copy">© 2024 Kort. All rights reserved.</span>
          <nav className="footer__links">
            <a href="#">Privacy</a>
            <a href="#">Terms</a>
            <a href="#">About</a>
            <a href="#">Contact</a>
          </nav>
          <div className="footer__social" aria-label="Social links">
            <a href="#" aria-label="Facebook"><Icon name="facebook" size={18} /></a>
            <a href="#" aria-label="Instagram"><Icon name="instagram" size={18} /></a>
            <a href="#" aria-label="YouTube"><Icon name="youtube" size={18} /></a>
          </div>
        </div>
      </footer>
    </div>
  )
}
