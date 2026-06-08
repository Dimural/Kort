import { test } from 'node:test'
import assert from 'node:assert/strict'
import { RoomManager } from './roomManager.js'

// Deterministic 6-char codes for testing
function fixedCodes() {
  let n = 0
  const codes = ['AAAAAA', 'BBBBBB', 'CCCCCC']
  return () => codes[n++]
}

test('createRoom makes a lobby room with the host as player 0', () => {
  const rm = new RoomManager({ generateCode: fixedCodes() })
  const { room, playerId } = rm.createRoom({ displayName: 'Alice', socketId: 's1' })
  assert.equal(room.roomCode, 'AAAAAA')
  assert.equal(room.phase, 'lobby')
  assert.equal(playerId, 0)
  assert.equal(room.players.length, 1)
  assert.equal(room.players[0].displayName, 'Alice')
  assert.equal(room.players[0].isReady, false)
  assert.equal(room.players[0].teamId, 'A') // first joiner -> team A
})

test('joinRoom adds players and balances teams', () => {
  const rm = new RoomManager({ generateCode: fixedCodes() })
  const { room } = rm.createRoom({ displayName: 'Alice', socketId: 's1' })
  const b = rm.joinRoom({ roomCode: 'AAAAAA', displayName: 'Bob', socketId: 's2' })
  assert.equal(b.playerId, 1)
  assert.equal(room.players[1].teamId, 'B') // balanced to other team
})

test('joinRoom rejects an unknown room code', () => {
  const rm = new RoomManager({ generateCode: fixedCodes() })
  assert.throws(() => rm.joinRoom({ roomCode: 'NOPE00', displayName: 'X', socketId: 's9' }), /not found/i)
})

test('joinRoom rejects a full room', () => {
  const rm = new RoomManager({ generateCode: fixedCodes() })
  rm.createRoom({ displayName: 'A', socketId: 's1' })
  rm.joinRoom({ roomCode: 'AAAAAA', displayName: 'B', socketId: 's2' })
  rm.joinRoom({ roomCode: 'AAAAAA', displayName: 'C', socketId: 's3' })
  rm.joinRoom({ roomCode: 'AAAAAA', displayName: 'D', socketId: 's4' })
  assert.throws(() => rm.joinRoom({ roomCode: 'AAAAAA', displayName: 'E', socketId: 's5' }), /full/i)
})

test('joinRoom rejects a room that is no longer in lobby phase', () => {
  const rm = new RoomManager({ generateCode: fixedCodes() })
  const { room } = rm.createRoom({ displayName: 'A', socketId: 's1' })
  room.phase = 'play'
  assert.throws(() => rm.joinRoom({ roomCode: 'AAAAAA', displayName: 'B', socketId: 's2' }), /progress/i)
})

test('selectTeam moves a player only when the target team has an open slot', () => {
  const rm = new RoomManager({ generateCode: fixedCodes() })
  const { room } = rm.createRoom({ displayName: 'A', socketId: 's1' }) // team A
  rm.joinRoom({ roomCode: 'AAAAAA', displayName: 'B', socketId: 's2' }) // team B
  rm.joinRoom({ roomCode: 'AAAAAA', displayName: 'C', socketId: 's3' }) // team A (slot 2)
  // team A now full (A, C). Player B (id 1) trying to join A should fail silently / stay.
  rm.selectTeam('AAAAAA', 1, 'A')
  assert.equal(room.players[1].teamId, 'B')
  // moving player C (id 2) to B is fine (B has one open slot)
  rm.selectTeam('AAAAAA', 2, 'B')
  assert.equal(room.players[2].teamId, 'B')
})

test('toggleReady flips a player ready flag', () => {
  const rm = new RoomManager({ generateCode: fixedCodes() })
  const { room } = rm.createRoom({ displayName: 'A', socketId: 's1' })
  rm.toggleReady('AAAAAA', 0)
  assert.equal(room.players[0].isReady, true)
  rm.toggleReady('AAAAAA', 0)
  assert.equal(room.players[0].isReady, false)
})

test('canStart only when 4 players, 2 per team, all ready', () => {
  const rm = new RoomManager({ generateCode: fixedCodes() })
  const { room } = rm.createRoom({ displayName: 'A', socketId: 's1' })
  rm.joinRoom({ roomCode: 'AAAAAA', displayName: 'B', socketId: 's2' })
  rm.joinRoom({ roomCode: 'AAAAAA', displayName: 'C', socketId: 's3' })
  rm.joinRoom({ roomCode: 'AAAAAA', displayName: 'D', socketId: 's4' })
  assert.equal(rm.canStart(room), false)
  ;[0, 1, 2, 3].forEach((id) => rm.toggleReady('AAAAAA', id))
  assert.equal(rm.canStart(room), true)
})

test('removing a player in lobby frees the slot and resets all ready states', () => {
  const rm = new RoomManager({ generateCode: fixedCodes() })
  const { room } = rm.createRoom({ displayName: 'A', socketId: 's1' })
  rm.joinRoom({ roomCode: 'AAAAAA', displayName: 'B', socketId: 's2' })
  rm.toggleReady('AAAAAA', 0)
  rm.toggleReady('AAAAAA', 1)
  const affected = rm.removeBySocket('s2')
  assert.equal(affected.roomCode, 'AAAAAA')
  assert.equal(room.players.length, 1)
  assert.equal(room.players[0].isReady, false) // ready reset
})

test('removing the last player destroys the room', () => {
  const rm = new RoomManager({ generateCode: fixedCodes() })
  rm.createRoom({ displayName: 'A', socketId: 's1' })
  rm.removeBySocket('s1')
  assert.equal(rm.getRoom('AAAAAA'), undefined)
})
