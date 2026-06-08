import { test } from 'node:test'
import assert from 'node:assert/strict'
import { isPlayable, evaluateTrickWinner } from './trickLogic.js'

const C = (id, suit, rank, value) => ({ id, suit, rank, value })

// ---- isPlayable ----

test('leading (ledSuit null) — any card is playable', () => {
  const hand = [C('AS', 'spades', 'A', 14), C('2H', 'hearts', '2', 2)]
  assert.equal(isPlayable(hand[0], hand, null, 'clubs'), true)
  assert.equal(isPlayable(hand[1], hand, null, 'clubs'), true)
})

test('must follow led suit when holding it', () => {
  const ace = C('AH', 'hearts', 'A', 14)
  const spade = C('KS', 'spades', 'K', 13)
  const hand = [ace, spade]
  assert.equal(isPlayable(ace, hand, 'hearts', 'spades'), true)
  // cannot play spade (even though it is the game suit) while holding a heart
  assert.equal(isPlayable(spade, hand, 'hearts', 'spades'), false)
})

test('cannot follow suit — any card is playable (cut or discard)', () => {
  const spade = C('KS', 'spades', 'K', 13) // game suit -> cut
  const club = C('3C', 'clubs', '3', 3) // discard
  const hand = [spade, club]
  assert.equal(isPlayable(spade, hand, 'hearts', 'spades'), true)
  assert.equal(isPlayable(club, hand, 'hearts', 'spades'), true)
})

// ---- evaluateTrickWinner ----

test('highest led-suit card wins when no game suit played', () => {
  const plays = [
    { playerId: 0, card: C('5H', 'hearts', '5', 5) },
    { playerId: 1, card: C('9H', 'hearts', '9', 9) },
    { playerId: 2, card: C('2C', 'clubs', '2', 2) }, // off-suit discard
    { playerId: 3, card: C('KH', 'hearts', 'K', 13) },
  ]
  const winner = evaluateTrickWinner(plays, 'hearts', 'spades')
  assert.equal(winner.playerId, 3)
})

test('any game suit card beats the highest led suit card', () => {
  const plays = [
    { playerId: 0, card: C('AH', 'hearts', 'A', 14) }, // led, highest non-trump
    { playerId: 1, card: C('2S', 'spades', '2', 2) }, // game suit cut
    { playerId: 2, card: C('KH', 'hearts', 'K', 13) },
    { playerId: 3, card: C('5C', 'clubs', '5', 5) }, // discard
  ]
  const winner = evaluateTrickWinner(plays, 'hearts', 'spades')
  assert.equal(winner.playerId, 1)
})

test('highest game suit card wins when multiple are played', () => {
  const plays = [
    { playerId: 0, card: C('5S', 'spades', '5', 5) },
    { playerId: 1, card: C('QS', 'spades', 'Q', 12) },
    { playerId: 2, card: C('AH', 'hearts', 'A', 14) },
    { playerId: 3, card: C('8S', 'spades', '8', 8) },
  ]
  const winner = evaluateTrickWinner(plays, 'spades', 'spades')
  assert.equal(winner.playerId, 1)
})

test('off-suit discards never win even if highest value', () => {
  const plays = [
    { playerId: 0, card: C('3H', 'hearts', '3', 3) }, // led suit
    { playerId: 1, card: C('AC', 'clubs', 'A', 14) }, // discard, not led, not trump
    { playerId: 2, card: C('AD', 'diamonds', 'A', 14) }, // discard
    { playerId: 3, card: C('2H', 'hearts', '2', 2) },
  ]
  const winner = evaluateTrickWinner(plays, 'hearts', 'spades')
  assert.equal(winner.playerId, 0)
})
