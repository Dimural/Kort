import { test } from 'node:test'
import assert from 'node:assert/strict'
import { projectStateFor } from './stateProjection.js'

function sampleRoom() {
  return {
    roomCode: 'AAAAAA',
    phase: 'play',
    gameSuit: 'spades',
    gameCallerId: 0,
    currentTurn: 1,
    currentLeaderId: 0,
    currentTrick: { ledSuit: 'hearts', ledByPlayerId: 0, plays: [] },
    winner: null,
    teams: { A: { tricks: 3 }, B: { tricks: 2 } },
    players: [
      { playerId: 0, socketId: 's0', displayName: 'Alice', teamId: 'A', seat: 0, isConnected: true, hand: [{ id: 'AS' }, { id: 'KS' }] },
      { playerId: 1, socketId: 's1', displayName: 'Bob', teamId: 'B', seat: 1, isConnected: true, hand: [{ id: '2H' }] },
      { playerId: 2, socketId: 's2', displayName: 'Cara', teamId: 'A', seat: 2, isConnected: true, hand: [{ id: '3D' }, { id: '4D' }, { id: '5D' }] },
      { playerId: 3, socketId: 's3', displayName: 'Dan', teamId: 'B', seat: 3, isConnected: true, hand: [{ id: '6C' }] },
    ],
  }
}

test('projection includes only the requesting player hand', () => {
  const view = projectStateFor(sampleRoom(), 2)
  assert.deepEqual(view.myHand, [{ id: '3D' }, { id: '4D' }, { id: '5D' }])
  assert.equal(view.myPlayerId, 2)
})

test('projection never leaks another player hand or socketId', () => {
  const view = projectStateFor(sampleRoom(), 2)
  const serialized = JSON.stringify(view)
  // other players cards
  assert.ok(!serialized.includes('AS'))
  assert.ok(!serialized.includes('2H'))
  assert.ok(!serialized.includes('6C'))
  // no socket ids leaked
  assert.ok(!serialized.includes('s0'))
  view.players.forEach((p) => {
    assert.equal(p.hand, undefined)
    assert.equal(p.socketId, undefined)
    assert.equal(typeof p.cardCount, 'number')
  })
})

test('projection reports correct card counts for opponents', () => {
  const view = projectStateFor(sampleRoom(), 2)
  const byId = Object.fromEntries(view.players.map((p) => [p.playerId, p]))
  assert.equal(byId[0].cardCount, 2)
  assert.equal(byId[1].cardCount, 1)
  assert.equal(byId[2].cardCount, 3)
  assert.equal(byId[3].cardCount, 1)
})

test('projection rotates seats so the requesting player is at the bottom', () => {
  const view = projectStateFor(sampleRoom(), 2) // seat 2
  const byId = Object.fromEntries(view.players.map((p) => [p.playerId, p]))
  // me at bottom, then clockwise: seat3->left, seat0->top, seat1->right
  assert.equal(byId[2].position, 'bottom')
  assert.equal(byId[3].position, 'left')
  assert.equal(byId[0].position, 'top')
  assert.equal(byId[1].position, 'right')
})

test('projection carries public game fields', () => {
  const view = projectStateFor(sampleRoom(), 0)
  assert.equal(view.gameSuit, 'spades')
  assert.equal(view.currentTurn, 1)
  assert.equal(view.phase, 'play')
  assert.deepEqual(view.teams, { A: { tricks: 3 }, B: { tricks: 2 } })
})

test('projection includes isBot and difficulty for bot players', () => {
  const room = {
    roomCode: 'AAAAAA', phase: 'lobby', gameSuit: null, gameCallerId: null,
    currentLeaderId: null, currentTurn: null, currentTrick: null, trickHistory: [],
    winner: null, teams: { A: { tricks: 0 }, B: { tricks: 0 } },
    players: [
      { playerId: 0, displayName: 'Alice', teamId: 'A', seat: 0, hand: [], isConnected: true, isReady: false },
      { playerId: 1, displayName: 'Aygul', teamId: 'B', seat: 1, hand: [], isConnected: true, isReady: true, isBot: true, difficulty: 'hard' },
    ],
  }
  const view = projectStateFor(room, 0)
  const me = view.players.find((p) => p.playerId === 0)
  const bot = view.players.find((p) => p.playerId === 1)
  assert.equal(me.isBot, false)
  assert.equal(bot.isBot, true)
  assert.equal(bot.difficulty, 'hard')
})
