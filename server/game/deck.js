// Card definitions, Fisher-Yates shuffle, and deal logic. No jokers.

export const SUITS = ['spades', 'hearts', 'diamonds', 'clubs']
export const RANKS = ['2', '3', '4', '5', '6', '7', '8', '9', '10', 'J', 'Q', 'K', 'A']

const SUIT_LETTER = { spades: 'S', hearts: 'H', diamonds: 'D', clubs: 'C' }
const RANK_VALUE = {
  2: 2, 3: 3, 4: 4, 5: 5, 6: 6, 7: 7, 8: 8, 9: 9, 10: 10,
  J: 11, Q: 12, K: 13, A: 14,
}

export function rankValue(rank) {
  return RANK_VALUE[rank]
}

export function buildDeck() {
  const deck = []
  for (const suit of SUITS) {
    for (const rank of RANKS) {
      deck.push({ id: `${rank}${SUIT_LETTER[suit]}`, suit, rank, value: RANK_VALUE[rank] })
    }
  }
  return deck
}

// Fisher-Yates shuffle. Returns a new array, does not mutate input.
// rng() should return a float in [0, 1); defaults to Math.random.
export function shuffle(deck, rng = Math.random) {
  const out = deck.slice()
  for (let i = out.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1))
    ;[out[i], out[j]] = [out[j], out[i]]
  }
  return out
}

// Deal `perHand` cards to `players` players from the top of the deck.
// Returns the hands and the remaining undealt cards. Does not mutate input.
export function deal(deck, players, perHand) {
  const hands = Array.from({ length: players }, () => [])
  let idx = 0
  for (let c = 0; c < perHand; c++) {
    for (let p = 0; p < players; p++) {
      hands[p].push(deck[idx++])
    }
  }
  return { hands, remaining: deck.slice(idx) }
}
