export type Suit = 'spades' | 'hearts' | 'diamonds' | 'clubs'

const SUIT_GLYPH: Record<Suit, string> = {
  spades: '♠',
  hearts: '♥',
  diamonds: '♦',
  clubs: '♣',
}

function isRed(suit: Suit) {
  return suit === 'hearts' || suit === 'diamonds'
}

type CardFaceProps = {
  rank: string
  suit: Suit
  /** slight fan rotation in degrees, used when laying out a hand */
  rotate?: number
  /** lift the card up on hover (player's own hand) */
  raise?: boolean
}

/** A face-up playing card with corner indices and a large center pip. */
export function CardFace({ rank, suit, rotate = 0, raise = false }: CardFaceProps) {
  const colorClass = isRed(suit) ? 'card--red' : 'card--black'
  const glyph = SUIT_GLYPH[suit]
  return (
    <div
      className={`card card-face ${colorClass} ${raise ? 'card--raise' : ''}`}
      style={{ '--rot': `${rotate}deg` } as React.CSSProperties}
    >
      <span className="card-face__corner card-face__corner--tl">
        <span className="card-face__rank">{rank}</span>
        <span className="card-face__suit">{glyph}</span>
      </span>
      <span className="card-face__pip">{glyph}</span>
      <span className="card-face__corner card-face__corner--br">
        <span className="card-face__rank">{rank}</span>
        <span className="card-face__suit">{glyph}</span>
      </span>
    </div>
  )
}

type CardBackProps = {
  rotate?: number
  className?: string
}

/** A face-down card: the supplied blue ornamented card-back artwork. */
export function CardBack({ rotate = 0, className = '' }: CardBackProps) {
  return (
    <div
      className={`card card-back ${className}`}
      style={{ '--rot': `${rotate}deg` } as React.CSSProperties}
    >
      <img src="/assets/card-back.png" alt="" className="card-back__art" />
    </div>
  )
}
