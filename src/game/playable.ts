import type { Card, Suit } from './types'

// Mirrors the server's isPlayable — used only for UX (dimming unplayable cards).
// The server remains the source of truth and rejects illegal plays.
export function isPlayable(
  card: Card,
  hand: Card[],
  ledSuit: Suit | null,
  _gameSuit: Suit | null,
): boolean {
  if (ledSuit == null) return true
  const hasLedSuit = hand.some((c) => c.suit === ledSuit)
  if (hasLedSuit) return card.suit === ledSuit
  return true
}
