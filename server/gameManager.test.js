import { test } from 'node:test'
import assert from 'node:assert/strict'
import { startGame, declareGameSuit, playCard } from './gameManager.js'

// A minimal 4-player lobby room ready to start.
function lobbyRoom() {
  return {
    roomCode: 'AAAAAA',
    phase: 'lobby',
    gameSuit: null,
    gameCallerId: null,
    currentLeaderId: null,
    currentTurn: null,
    currentTrick: null,
    trickHistory: [],
    winner: null,
    teams: { A: { tricks: 0 }, B: { tricks: 0 } },
    players: [
      { playerId: 0, displayName: 'A0', teamId: 'A', seat: null, isConnected: true, hand: [] },
      { playerId: 1, displayName: 'B1', teamId: 'B', seat: null, isConnected: true, hand: [] },
      { playerId: 2, displayName: 'A2', teamId: 'A', seat: null, isConnected: true, hand: [] },
      { playerId: 3, displayName: 'B3', teamId: 'B', seat: null, isConnected: true, hand: [] },
    ],
  }
}

const card = (id, suit, rank, value) => ({ id, suit, rank, value })
const seatOf = (room, pid) => room.players.find((p) => p.playerId === pid).seat

test('startGame seats teams alternately, deals 5 each, picks a caller, enters declare phase', () => {
  const room = lobbyRoom()
  startGame(room, { rng: () => 0 })
  // team A on seats 0 & 2, team B on 1 & 3
  assert.deepEqual([seatOf(room, 0), seatOf(room, 2)].sort(), [0, 2])
  assert.deepEqual([seatOf(room, 1), seatOf(room, 3)].sort(), [1, 3])
  room.players.forEach((p) => assert.equal(p.hand.length, 5))
  assert.equal(room.phase, 'declare')
  assert.ok([0, 1, 2, 3].includes(room.gameCallerId))
})

test('only the game caller may declare, and only during declare phase', () => {
  const room = lobbyRoom()
  startGame(room, { rng: () => 0 })
  const caller = room.gameCallerId
  const notCaller = (caller + 1) % 4
  assert.throws(() => declareGameSuit(room, notCaller, 'spades'), /caller/i)
})

test('declaring the game suit deals out to 13 cards each and starts play with the caller leading', () => {
  const room = lobbyRoom()
  startGame(room, { rng: () => 0 })
  const caller = room.gameCallerId
  declareGameSuit(room, caller, 'spades')
  assert.equal(room.gameSuit, 'spades')
  assert.equal(room.phase, 'play')
  room.players.forEach((p) => assert.equal(p.hand.length, 13))
  assert.equal(room.currentTurn, caller)
  assert.equal(room.currentLeaderId, caller)
  assert.equal(room.currentTrick.ledSuit, null)
})

// Build a play-phase room with controlled hands for trick tests.
function playRoom(hands) {
  const room = lobbyRoom()
  room.phase = 'play'
  room.gameSuit = 'spades'
  // seat order 0..3 = players 0..3 for simplicity
  room.players.forEach((p, i) => {
    p.seat = i
    p.hand = hands[i]
  })
  room.gameCallerId = 0
  room.currentLeaderId = 0
  room.currentTurn = 0
  room.currentTrick = { ledSuit: null, ledByPlayerId: 0, plays: [] }
  return room
}

test('playing out of turn is rejected', () => {
  const room = playRoom([
    [card('AH', 'hearts', 'A', 14)],
    [card('KH', 'hearts', 'K', 13)],
    [card('QH', 'hearts', 'Q', 12)],
    [card('JH', 'hearts', 'J', 11)],
  ])
  assert.throws(() => playCard(room, 1, 'KH'), /turn/i)
})

test('a following play that breaks suit-following is rejected', () => {
  const room = playRoom([
    [card('AH', 'hearts', 'A', 14)],
    [card('KH', 'hearts', 'K', 13), card('2S', 'spades', '2', 2)],
    [card('QH', 'hearts', 'Q', 12)],
    [card('JH', 'hearts', 'J', 11)],
  ])
  playCard(room, 0, 'AH') // lead hearts
  // player 1 holds a heart, must follow; playing the spade is illegal
  assert.throws(() => playCard(room, 1, '2S'), /not playable|illegal|follow/i)
})

test('completing a trick credits the winning team and the winner leads next', () => {
  const room = playRoom([
    [card('5H', 'hearts', '5', 5)],
    [card('9H', 'hearts', '9', 9)],
    [card('2C', 'clubs', '2', 2)], // off-suit discard
    [card('KH', 'hearts', 'K', 13)],
  ])
  playCard(room, 0, '5H')
  playCard(room, 1, '9H')
  playCard(room, 2, '2C')
  const result = playCard(room, 3, 'KH') // highest heart, player 3 (team B)
  assert.equal(result.trickComplete, true)
  assert.equal(result.winnerId, 3)
  assert.equal(result.winnerTeam, 'B')
  assert.equal(room.teams.B.tricks, 1)
  assert.equal(room.currentLeaderId, 3)
  assert.equal(room.currentTurn, 3)
  assert.equal(room.currentTrick.plays.length, 0) // reset for next trick
})

test('reaching 7 tricks ends the game', () => {
  const room = playRoom([
    [card('AS', 'spades', 'A', 14)],
    [card('2H', 'hearts', '2', 2)],
    [card('3H', 'hearts', '3', 3)],
    [card('4H', 'hearts', '4', 4)],
  ])
  room.teams.A.tricks = 6 // team A one away
  playCard(room, 0, 'AS')
  playCard(room, 1, '2H')
  playCard(room, 2, '3H')
  const result = playCard(room, 3, '4H') // player 0 (team A) cut with spade wins
  assert.equal(result.gameOver, true)
  assert.equal(result.winnerTeam, 'A')
  assert.equal(room.phase, 'end')
  assert.equal(room.winner, 'A')
})
