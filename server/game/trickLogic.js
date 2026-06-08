// Card playability validation and trick winner evaluation. Server-authoritative.

// Can `card` be legally played from `playerHand` given the led suit and game suit?
export function isPlayable(card, playerHand, ledSuit, gameSuit) {
  // Leading the trick — any card is valid.
  if (ledSuit == null) return true

  // Holding one or more cards of the led suit — must play one of those.
  const hasLedSuit = playerHand.some((c) => c.suit === ledSuit)
  if (hasLedSuit) return card.suit === ledSuit

  // No led-suit cards — free to cut (game suit) or discard (anything).
  return true
}

// Given the plays of a completed trick, return the winning play.
// 1. If any game-suit cards were played, the highest one wins.
// 2. Otherwise the highest led-suit card wins.
// Off-suit discards can never win.
export function evaluateTrickWinner(plays, ledSuit, gameSuit) {
  const highestOf = (suit) =>
    plays
      .filter((p) => p.card.suit === suit)
      .reduce((best, p) => (best == null || p.card.value > best.card.value ? p : best), null)

  return highestOf(gameSuit) ?? highestOf(ledSuit)
}
