// Trick counting and win detection.

export const TRICKS_TO_WIN = 7

// Returns the winning team id ('A' | 'B') once a team reaches 7 tricks, else null.
export function checkWinner(teams) {
  if (teams.A.tricks >= TRICKS_TO_WIN) return 'A'
  if (teams.B.tricks >= TRICKS_TO_WIN) return 'B'
  return null
}
