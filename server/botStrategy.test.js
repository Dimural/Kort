import { test } from 'node:test'
import assert from 'node:assert/strict'
import {
  legalMoves,
  scoreCandidates,
  pickWithMistake,
  heuristicDeclareSuit,
  chooseCard,
  chooseDeclareSuit,
} from './botStrategy.js'

const C = (id, suit, rank, value) => ({ id, suit, rank, value })
// helpers
const players = [
  { playerId: 0, teamId: 'A', seat: 0 },
  { playerId: 1, teamId: 'B', seat: 1 },
  { playerId: 2, teamId: 'A', seat: 2 }, // partner of 0
  { playerId: 3, teamId: 'B', seat: 3 },
]
const me = players[0]

test('legalMoves: must follow the led suit when holding it', () => {
  const hand = [C('AS', 'spades', 'A', 14), C('2H', 'hearts', '2', 2)]
  const moves = legalMoves(hand, 'spades')
  assert.deepEqual(moves.map((c) => c.id), ['AS'])
})

test('legalMoves: any card when void in led suit', () => {
  const hand = [C('AD', 'diamonds', 'A', 14), C('2H', 'hearts', '2', 2)]
  const moves = legalMoves(hand, 'spades')
  assert.equal(moves.length, 2)
})

test('legalMoves: any card when leading', () => {
  const hand = [C('AD', 'diamonds', 'A', 14), C('2H', 'hearts', '2', 2)]
  assert.equal(legalMoves(hand, null).length, 2)
})

test('win cheaply: takes the trick with the lowest winning card', () => {
  // hearts led, trump=spades. Opponent played 9H. I hold 10H and KH; both win, KH wastes.
  const hand = [C('10H', 'hearts', '10', 10), C('KH', 'hearts', 'K', 13)]
  const currentTrick = { ledSuit: 'hearts', ledByPlayerId: 1, plays: [{ playerId: 1, card: C('9H', 'hearts', '9', 9) }] }
  const ranked = scoreCandidates({ hand, currentTrick, gameSuit: 'spades', players, me })
  assert.equal(ranked[0].card.id, '10H')
})

test('partner-aware: does not overtrump a partner who is already winning', () => {
  // hearts led; partner (player 2) is winning with AH. I'm void in hearts and hold a trump + a low club.
  const hand = [C('2S', 'spades', '2', 2), C('3C', 'clubs', '3', 3)]
  const currentTrick = {
    ledSuit: 'hearts', ledByPlayerId: 1,
    plays: [
      { playerId: 1, card: C('5H', 'hearts', '5', 5) },
      { playerId: 2, card: C('AH', 'hearts', 'A', 14) }, // partner winning
    ],
  }
  const ranked = scoreCandidates({ hand, currentTrick, gameSuit: 'spades', players, me })
  // best move must NOT be the trump (don't waste it over a winning partner)
  assert.notEqual(ranked[0].card.suit, 'spades')
  assert.equal(ranked[0].card.id, '3C')
})

test('pickWithMistake: returns the best when the roll beats the rate', () => {
  const cands = [C('a', 'x', 'A', 14), C('b', 'x', 'K', 13), C('c', 'x', 'Q', 12)]
  assert.equal(pickWithMistake(cands, 0.5, () => 0.9).id, 'a') // 0.9 >= 0.5 -> best
})

test('pickWithMistake: on a mistake never returns the strict worst', () => {
  const cands = [C('a', 'x', 'A', 14), C('b', 'x', 'K', 13), C('c', 'x', 'Q', 12)]
  // force a mistake (roll < rate) and force pool index 0
  const got = pickWithMistake(cands, 1, () => 0)
  assert.notEqual(got.id, 'c') // worst excluded
  assert.notEqual(got.id, 'a') // best excluded on a mistake
})

test('pickWithMistake: single candidate is returned as-is', () => {
  const cands = [C('a', 'x', 'A', 14)]
  assert.equal(pickWithMistake(cands, 1, () => 0).id, 'a')
})

test('mistake rates: easy errs far more often than medium, hard never', () => {
  // A clear trick: opponent led, I can win cheaply with one card or waste another.
  const hand = [C('10H', 'hearts', '10', 10), C('KH', 'hearts', 'K', 13)]
  const currentTrick = { ledSuit: 'hearts', ledByPlayerId: 1, plays: [{ playerId: 1, card: C('9H', 'hearts', '9', 9) }] }
  // Deterministic RNG cycling through a fixed sequence. The generator PERSISTS
  // across trials so different trials sample different thresholds (otherwise
  // every trial would see the same first value and there'd be no variation).
  const seq = [0.05, 0.4, 0.6, 0.2, 0.8, 0.1, 0.55, 0.3, 0.95, 0.45]
  const best = (difficulty) => {
    let i = 0
    const rng = () => seq[i++ % seq.length]
    let bestCount = 0
    for (let t = 0; t < 200; t++) {
      const id = chooseCard({ hand, currentTrick, gameSuit: 'spades', players, me, difficulty, rng })
      if (id === '10H') bestCount++ // 10H is the cheapest winning (best) card
    }
    return bestCount
  }
  const easy = best('easy')
  const medium = best('medium')
  const hard = best('hard')
  assert.equal(hard, 200) // hard is perfect
  assert.ok(medium > easy) // medium picks best more often than easy
})

test('heuristicDeclareSuit: declares the most-held suit', () => {
  const hand = [
    C('AS', 'spades', 'A', 14), C('KS', 'spades', 'K', 13), C('QS', 'spades', 'Q', 12),
    C('2H', 'hearts', '2', 2), C('3D', 'diamonds', '3', 3),
  ]
  assert.equal(heuristicDeclareSuit(hand), 'spades')
})

test('chooseDeclareSuit: falls back to heuristic when groq throws', async () => {
  const hand = [
    C('AS', 'spades', 'A', 14), C('KS', 'spades', 'K', 13), C('QS', 'spades', 'Q', 12),
    C('2H', 'hearts', '2', 2), C('3D', 'diamonds', '3', 3),
  ]
  const groq = { declareSuit: async () => { throw new Error('boom') } }
  const suit = await chooseDeclareSuit({ hand, difficulty: 'hard', groq })
  assert.equal(suit, 'spades')
})

test('chooseDeclareSuit: uses groq result for hard when valid', async () => {
  const hand = [C('2H', 'hearts', '2', 2), C('3D', 'diamonds', '3', 3)]
  const groq = { declareSuit: async () => 'clubs' }
  const suit = await chooseDeclareSuit({ hand, difficulty: 'hard', groq })
  assert.equal(suit, 'clubs')
})

test('chooseDeclareSuit: ignores groq for non-hard difficulty', async () => {
  const hand = [
    C('AS', 'spades', 'A', 14), C('KS', 'spades', 'K', 13), C('2H', 'hearts', '2', 2),
  ]
  let called = false
  const groq = { declareSuit: async () => { called = true; return 'clubs' } }
  const suit = await chooseDeclareSuit({ hand, difficulty: 'medium', groq })
  assert.equal(called, false)
  assert.equal(suit, 'spades')
})
