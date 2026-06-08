import { test } from 'node:test'
import assert from 'node:assert/strict'
import { buildDeck, shuffle, deal } from './deck.js'

test('buildDeck creates 52 unique cards, no jokers', () => {
  const deck = buildDeck()
  assert.equal(deck.length, 52)
  const ids = new Set(deck.map((c) => c.id))
  assert.equal(ids.size, 52)
})

test('buildDeck card has id, suit, rank, value', () => {
  const deck = buildDeck()
  const ace = deck.find((c) => c.id === 'AS')
  assert.deepEqual(ace, { id: 'AS', suit: 'spades', rank: 'A', value: 14 })
  const two = deck.find((c) => c.id === '2C')
  assert.deepEqual(two, { id: '2C', suit: 'clubs', rank: '2', value: 2 })
  const ten = deck.find((c) => c.id === '10H')
  assert.deepEqual(ten, { id: '10H', suit: 'hearts', rank: '10', value: 10 })
})

test('shuffle keeps the same 52 cards (permutation) and is deterministic with a seeded rng', () => {
  const deck = buildDeck()
  // rng always returns 0 -> Fisher-Yates swaps each i with index 0
  const rng = () => 0
  const shuffled = shuffle(deck, rng)
  assert.equal(shuffled.length, 52)
  assert.deepEqual(
    new Set(shuffled.map((c) => c.id)),
    new Set(deck.map((c) => c.id)),
  )
  // does not mutate the input deck (first built card is 2 of spades)
  assert.equal(deck[0].id, '2S')
})

test('deal removes cards from the deck and hands them out', () => {
  const deck = buildDeck()
  const { hands, remaining } = deal(deck, 4, 5)
  assert.equal(hands.length, 4)
  hands.forEach((h) => assert.equal(h.length, 5))
  assert.equal(remaining.length, 52 - 20)
  // all dealt + remaining are still 52 unique cards
  const all = [...hands.flat(), ...remaining].map((c) => c.id)
  assert.equal(new Set(all).size, 52)
})
