import { Link } from 'react-router-dom'
import { TopNav } from '../components/TopNav'
import { Logo } from '../components/Logo'
import { AssetImage } from '../components/AssetImage'
import { Ornament } from '../components/Ornament'

const STATS = [
  { icon: '👥', value: '2v2', label: 'TEAM PLAY' },
  { icon: '🧑‍🤝‍🧑', value: '4', label: 'PLAYERS' },
  { icon: '⏱', value: '15–20 MIN', label: 'AVG. GAME' },
  { icon: '⚡', value: 'STRATEGY', label: 'TEAMWORK WINS' },
]

const FEATURES = [
  {
    icon: '👥',
    title: '2v2 Team Play',
    body: 'You and your partner vs. the other team. Work together & win!',
  },
  {
    icon: '🂠',
    title: 'Only See Your Own Cards',
    body: 'Each player can only see their own hand. Plan wisely!',
  },
  {
    icon: '👨‍👩‍👧',
    title: 'Fun for Family & Friends',
    body: 'Perfect for all ages. Connect, laugh, and make memories.',
  },
  {
    icon: '📖',
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
          <Ornament size={44} color="var(--c-blue)" className="hero__cloud" />
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
              Watch Demo ▶
            </Link>
          </div>
        </div>

        <div className="hero__art">
          <AssetImage
            src="hero-board.png"
            label="Hero — ornate gold-framed Kort board"
            className="hero__board"
            fit="contain"
          />
        </div>
      </section>

      {/* ---- Stats strip ---- */}
      <section className="container">
        <div className="statbar panel">
          {STATS.map((s) => (
            <div key={s.label} className="statbar__item">
              <span className="statbar__icon">{s.icon}</span>
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
              <div className="feature__icon">{f.icon}</div>
              <h3 className="feature__title">{f.title}</h3>
              <p className="feature__body">{f.body}</p>
            </article>
          ))}
        </div>
      </section>

      {/* ---- Landscape banner ---- */}
      <section className="landscape">
        <AssetImage
          src="landscape.png"
          label="Watercolor Uyghur landscape — mosques, mountains, blossoms"
          className="landscape__img"
          fit="cover"
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
            <a href="#" aria-label="Facebook">f</a>
            <a href="#" aria-label="Instagram">◎</a>
            <a href="#" aria-label="YouTube">▶</a>
          </div>
        </div>
      </footer>
    </div>
  )
}
