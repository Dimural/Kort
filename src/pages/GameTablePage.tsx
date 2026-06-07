import { Link } from 'react-router-dom'
import { CardFace, CardBack, type Suit } from '../components/Card'

// The player's own fanned hand (bottom of table)
const HAND: { rank: string; suit: Suit }[] = [
  { rank: 'A', suit: 'spades' },
  { rank: 'K', suit: 'diamonds' },
  { rank: 'Q', suit: 'clubs' },
  { rank: 'J', suit: 'hearts' },
  { rank: '10', suit: 'spades' },
]

export function GameTablePage() {
  return (
    <div className="table-page">
      <Link to="/lobby" className="table-page__back btn btn-ghost btn--sm">
        ← Lobby
      </Link>

      <div className="felt">
        {/* top opponent — face-down row */}
        <div className="seat seat--top">
          {Array.from({ length: 5 }).map((_, i) => (
            <CardBack key={i} className="card--sm" />
          ))}
        </div>

        {/* left opponent — face-down stack */}
        <div className="seat seat--left">
          {Array.from({ length: 4 }).map((_, i) => (
            <CardBack key={i} className="card--sm" />
          ))}
        </div>

        {/* right opponent — face-down stack */}
        <div className="seat seat--right">
          {Array.from({ length: 4 }).map((_, i) => (
            <CardBack key={i} className="card--sm" />
          ))}
        </div>

        {/* center trick area */}
        <div className="trick">
          <CardBack />
          <CardFace rank="9" suit="hearts" />
        </div>

        {/* player's hand — fanned, face-up */}
        <div className="seat seat--bottom">
          {HAND.map((c, i) => {
            const rotate = (i - (HAND.length - 1) / 2) * 7
            return (
              <CardFace
                key={`${c.rank}${c.suit}`}
                rank={c.rank}
                suit={c.suit}
                rotate={rotate}
                raise
              />
            )
          })}
        </div>
      </div>
    </div>
  )
}
