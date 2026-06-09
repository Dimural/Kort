import type { Card, Suit } from './types'

const BLACKS: Suit[] = ['spades', 'clubs']
const REDS: Suit[] = ['hearts', 'diamonds']

/**
 * Display order for a hand: trump suit first (leftmost), then the remaining
 * suits arranged so adjacent groups alternate red/black. Within a suit,
 * high cards first. Pure display sorting — play validation is untouched.
 */
export function suitOrder(trump: Suit | null): Suit[] {
  if (!trump) return ['spades', 'hearts', 'clubs', 'diamonds']
  const sameColor = (BLACKS.includes(trump) ? BLACKS : REDS).filter((s) => s !== trump)
  const otherColor = BLACKS.includes(trump) ? REDS : BLACKS
  // trump, opposite color, same color, opposite color — colors always alternate
  return [trump, otherColor[0], sameColor[0], otherColor[1]]
}

export function sortHand(hand: Card[], trump: Suit | null): Card[] {
  const order = suitOrder(trump)
  return [...hand].sort((a, b) => {
    const sa = order.indexOf(a.suit)
    const sb = order.indexOf(b.suit)
    if (sa !== sb) return sa - sb
    return b.value - a.value
  })
}
