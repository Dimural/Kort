// Pure bot decision engine. One strong heuristic for card play; difficulty
// modulates a "mistake rate" that picks a plausible sub-optimal legal move.
// The LLM (Groq) is used only for a Hard bot's trump declaration.
import { evaluateTrickWinner } from './game/trickLogic.js'

const SUITS = ['spades', 'hearts', 'diamonds', 'clubs']
const MISTAKE_RATE = { easy: 0.5, medium: 0.12, hard: 0 }

// Cards this player may legally play given the led suit.
export function legalMoves(hand, ledSuit) {
  if (ledSuit == null) return hand.slice()
  const sameSuit = hand.filter((c) => c.suit === ledSuit)
  return sameSuit.length ? sameSuit : hand.slice()
}

function partnerIdOf(players, me) {
  const p = players.find((q) => q.teamId === me.teamId && q.playerId !== me.playerId)
  return p ? p.playerId : null
}

// Rank legal candidates best-first. Pure; no randomness.
export function scoreCandidates({ hand, currentTrick, gameSuit, players, me }) {
  const plays = currentTrick?.plays ?? []
  const ledSuit = currentTrick?.ledSuit ?? null
  const partnerId = partnerIdOf(players, me)
  const candidates = legalMoves(hand, ledSuit)

  const partnerWinning =
    plays.length > 0 &&
    partnerId != null &&
    evaluateTrickWinner(plays, ledSuit, gameSuit)?.playerId === partnerId

  return candidates
    .map((card) => {
      const isTrump = card.suit === gameSuit
      let score = 0

      if (plays.length === 0) {
        // Leading: lead strength, but hold trumps back early. An Ace usually wins.
        score += card.value
        if (isTrump) score -= 8
        if (card.value === 14) score += 10
      } else if (partnerWinning) {
        // Partner already winning — throw the lowest card, never waste a trump.
        score -= card.value
        if (isTrump) score -= 12
      } else {
        const effLed = ledSuit ?? card.suit
        const simWinner = evaluateTrickWinner(
          [...plays, { playerId: me.playerId, card }],
          effLed,
          gameSuit,
        )
        const iWouldWin = simWinner.playerId === me.playerId
        if (iWouldWin) {
          // Win as cheaply as possible.
          score += 30 - card.value
          if (isTrump && card.value > 11) score -= 4
        } else {
          // Can't win — discard low, keep trumps and high cards.
          score -= card.value
          if (isTrump) score -= 10
        }
      }
      return { card, score }
    })
    .sort((a, b) => b.score - a.score || a.card.value - b.card.value)
}

// Choose among ranked candidates, occasionally erring to a plausible
// (never the strict worst, never random) sub-optimal move.
export function pickWithMistake(candidates, mistakeRate, rng = Math.random) {
  if (candidates.length <= 1) return candidates[0]
  if (rng() >= mistakeRate) return candidates[0] // best play
  const n = candidates.length
  const upper = Math.max(2, Math.ceil(n / 2)) // consider the better half, min top 2
  const pool = candidates.slice(1, upper) // exclude the best; reasonable alternatives
  return pool.length ? pool[Math.floor(rng() * pool.length)] : candidates[1]
}

export function chooseCard({
  hand, currentTrick, gameSuit, players, me, difficulty = 'medium', rng = Math.random,
}) {
  const ranked = scoreCandidates({ hand, currentTrick, gameSuit, players, me })
  const card = pickWithMistake(
    ranked.map((r) => r.card),
    MISTAKE_RATE[difficulty] ?? MISTAKE_RATE.medium,
    rng,
  )
  return card.id
}

// Declare the suit we hold the most of, breaking ties by total card strength.
export function heuristicDeclareSuit(hand) {
  const bySuit = {}
  for (const c of hand) {
    bySuit[c.suit] = bySuit[c.suit] ?? { count: 0, value: 0 }
    bySuit[c.suit].count++
    bySuit[c.suit].value += c.value
  }
  const ranked = Object.entries(bySuit).sort(
    (a, b) => b[1].count - a[1].count || b[1].value - a[1].value,
  )
  return ranked.length ? ranked[0][0] : 'spades'
}

// Hard bots ask the LLM; everyone else (and any LLM failure) uses the heuristic.
export async function chooseDeclareSuit({ hand, difficulty = 'medium', groq = null }) {
  if (difficulty === 'hard' && groq) {
    try {
      const suit = await groq.declareSuit({ hand })
      if (SUITS.includes(suit)) return suit
    } catch {
      // fall through to the heuristic
    }
  }
  return heuristicDeclareSuit(hand)
}
