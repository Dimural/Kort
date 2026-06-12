import { Link } from 'react-router-dom'
import { TopNav } from '../components/TopNav'
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

const STEPS: { title: string; body: string }[] = [
  {
    title: 'Call the game',
    body: 'Each player starts with five cards. One of them names the game suit — the trump that outranks every other card.',
  },
  {
    title: 'Follow suit',
    body: 'Hands grow to thirteen and tricks begin. Follow the suit that was led; out of it, cut with a trump or throw a card away.',
  },
  {
    title: 'Race to seven',
    body: 'The highest trump — or the highest card of the led suit — takes the trick. The first team to seven tricks wins the game.',
  },
]

export function LandingPage() {
  return (
    <div className="landing">
      {/* Landscape sits behind everything as grounding scenery; its
          transparent sky blends the content into the page. */}
      <img
        src="/assets/landscape.png"
        alt=""
        className="landing__scape"
        aria-hidden="true"
      />

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
            <a href="#how-to-play" className="btn btn-ghost">
              How to play
            </a>
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

      {/* ---- How to play ---- */}
      <section className="container howto" id="how-to-play">
        <div className="howto__panel panel">
          <h2 className="howto__title">How Kort is played</h2>
          <ol className="howto__steps">
            {STEPS.map((step, i) => (
              <li key={step.title} className="howto__step">
                <span className="howto__num" aria-hidden="true">
                  {i + 1}
                </span>
                <h3 className="howto__step-title">{step.title}</h3>
                <p className="howto__step-body">{step.body}</p>
              </li>
            ))}
          </ol>
          <div className="howto__cta">
            <Link to="/play" className="btn btn-accent">
              Gather your four
            </Link>
          </div>
        </div>
      </section>
    </div>
  )
}
