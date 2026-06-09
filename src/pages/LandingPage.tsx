import { Link } from 'react-router-dom'
import { TopNav } from '../components/TopNav'
import { Logo } from '../components/Logo'
import { AssetImage } from '../components/AssetImage'
import { CardBack } from '../components/Card'

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

const STATS: { value: string; label: string }[] = [
  { value: '2v2', label: 'Teams' },
  { value: '4', label: 'Players' },
  { value: '~15 min', label: 'A game' },
]

export function LandingPage() {
  return (
    <div className="landing">
      <TopNav />

      {/* ---- Hero ---- */}
      <section className="container hero">
        <div className="hero__copy">
          <h1 className="hero__title">Kort</h1>
          <p className="hero__subtitle">A classic Uyghur 2v2 card game.</p>

          <div className="hero__stats">
            {STATS.map((s) => (
              <div key={s.label} className="hero__stat">
                <span className="hero__stat-value">{s.value}</span>
                <span className="hero__stat-label">{s.label}</span>
              </div>
            ))}
          </div>

          <div className="hero__cta">
            <Link to="/play" className="btn btn-accent">
              Play Now
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
          <span className="footer__copy">© 2024 Kort</span>
        </div>
      </footer>
    </div>
  )
}
