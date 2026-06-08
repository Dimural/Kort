// Game flow orchestration: deal, declare, play, resolve. Mutates the room in place.
import { buildDeck, shuffle, deal } from './game/deck.js'
import { isPlayable, evaluateTrickWinner } from './game/trickLogic.js'
import { checkWinner } from './game/winCondition.js'

const SEATS = 4

// Assign clockwise seats alternating teams: A->0,2  B->1,3
function assignSeats(room) {
  const aPlayers = room.players.filter((p) => p.teamId === 'A')
  const bPlayers = room.players.filter((p) => p.teamId === 'B')
  aPlayers.forEach((p, i) => (p.seat = i * 2)) // 0, 2
  bPlayers.forEach((p, i) => (p.seat = i * 2 + 1)) // 1, 3
}

function playerBySeat(room, seat) {
  return room.players.find((p) => p.seat === seat)
}

function playerById(room, playerId) {
  return room.players.find((p) => p.playerId === playerId)
}

// Phase 1: seat players, shuffle, deal 5 each, pick a caller, enter declare phase.
export function startGame(room, { rng = Math.random } = {}) {
  assignSeats(room)
  const deck = shuffle(buildDeck(), rng)
  // Deal 5 to each player in seat order.
  const { hands, remaining } = deal(deck, SEATS, 5)
  for (let seat = 0; seat < SEATS; seat++) {
    playerBySeat(room, seat).hand = hands[seat]
  }
  room._deck = remaining // undealt 32 cards held server-side

  room.teams.A.tricks = 0
  room.teams.B.tricks = 0
  room.trickHistory = []
  room.winner = null
  room.gameSuit = null

  const callerSeat = Math.floor(rng() * SEATS)
  room.gameCallerId = playerBySeat(room, callerSeat).playerId
  room.phase = 'declare'
  return { gameCallerId: room.gameCallerId }
}

// Phase 2 + 3: caller declares trump, remaining 32 cards dealt out to 13 each, play begins.
export function declareGameSuit(room, playerId, suit) {
  if (room.phase !== 'declare') throw new Error('Not in declare phase')
  if (playerId !== room.gameCallerId) throw new Error('Only the game caller may declare the suit')

  room.gameSuit = suit

  // Deal remaining 32 cards, 4 at a time in seat order, until each has 13.
  const { hands } = deal(room._deck, SEATS, 8) // 8 more each = 13 total
  for (let seat = 0; seat < SEATS; seat++) {
    playerBySeat(room, seat).hand.push(...hands[seat])
  }
  room._deck = []

  room.phase = 'play'
  room.currentLeaderId = room.gameCallerId
  room.currentTurn = room.gameCallerId
  room.currentTrick = { ledSuit: null, ledByPlayerId: room.gameCallerId, plays: [] }
  return { gameSuit: suit }
}

// Phase 4: a player plays one card. Validates, records, and resolves the trick when full.
export function playCard(room, playerId, cardId) {
  if (room.phase !== 'play') throw new Error('Not in play phase')
  if (playerId !== room.currentTurn) throw new Error('Not your turn')

  const player = playerById(room, playerId)
  const card = player.hand.find((c) => c.id === cardId)
  if (!card) throw new Error('Card not in hand')

  if (!isPlayable(card, player.hand, room.currentTrick.ledSuit, room.gameSuit)) {
    throw new Error('Card is not playable (must follow suit)')
  }

  // Remove from hand, record the play.
  player.hand = player.hand.filter((c) => c.id !== cardId)
  if (room.currentTrick.plays.length === 0) {
    room.currentTrick.ledSuit = card.suit
    room.currentTrick.ledByPlayerId = playerId
  }
  room.currentTrick.plays.push({ playerId, card })

  // Trick not yet full — advance clockwise.
  if (room.currentTrick.plays.length < SEATS) {
    const nextSeat = (player.seat + 1) % SEATS
    room.currentTurn = playerBySeat(room, nextSeat).playerId
    return { trickComplete: false }
  }

  // Trick full — resolve.
  const winningPlay = evaluateTrickWinner(
    room.currentTrick.plays,
    room.currentTrick.ledSuit,
    room.gameSuit,
  )
  const winner = playerById(room, winningPlay.playerId)
  room.teams[winner.teamId].tricks += 1
  room.trickHistory.push({
    plays: room.currentTrick.plays,
    ledSuit: room.currentTrick.ledSuit,
    winnerId: winner.playerId,
    winnerTeam: winner.teamId,
  })

  const winnerTeam = winner.teamId
  const result = {
    trickComplete: true,
    winnerId: winner.playerId,
    winnerTeam,
    teamTricks: { A: room.teams.A.tricks, B: room.teams.B.tricks },
    gameOver: false,
  }

  const gameWinner = checkWinner(room.teams)
  if (gameWinner) {
    room.phase = 'end'
    room.winner = gameWinner
    result.gameOver = true
    result.winnerTeam = gameWinner
    // leave the completed trick visible; no next leader needed
    room.currentLeaderId = winner.playerId
    room.currentTurn = null
    return result
  }

  // Winner leads the next trick.
  room.currentLeaderId = winner.playerId
  room.currentTurn = winner.playerId
  room.currentTrick = { ledSuit: null, ledByPlayerId: winner.playerId, plays: [] }
  result.nextLeaderId = winner.playerId
  return result
}

// Restart with the same room and teams (rematch).
export function resetForRematch(room, opts = {}) {
  room.players.forEach((p) => {
    p.hand = []
    p.isReady = false
  })
  room.phase = 'lobby'
  return startGame(room, opts)
}
