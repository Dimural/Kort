// End-to-end smoke test of the Socket.io wiring: 4 clients create/join a room,
// ready up, declare, and auto-play a full game to completion. Verifies hand
// isolation, dealing to 13, and that a winner is reached without crashes.
import { test } from 'node:test'
import assert from 'node:assert/strict'
import { io as Client } from 'socket.io-client'

process.env.PORT = '3999'
process.env.TRICK_PAUSE_MS = '5'
// Keep post-test disconnect timers from holding the process open for 60s.
process.env.RECONNECT_TIMEOUT_MS = '50'
// Force Hard-bot declaration onto the offline heuristic (no Groq network call).
// Empty string is "defined", so loadEnv() in index.js won't repopulate from .env.
process.env.GROQ_API_KEY = ''
// Bots act near-instantly in tests instead of the human-paced default.
process.env.BOT_DELAY_MS = '1'
const { httpServer, io } = await import('./index.js') // starts listening on 3999
const URL = 'http://localhost:3999'

function legalCard(state) {
  const led = state.currentTrick?.ledSuit ?? null
  const hand = state.myHand
  if (led == null) return hand[0]
  const sameSuit = hand.filter((c) => c.suit === led)
  return (sameSuit.length ? sameSuit : hand)[0]
}

test('one human plus three bots play a full game with no hand leakage', async () => {
  const human = Client(URL, { forceNew: true })
  let myId = null
  let over = null

  human.on('state', (s) => {
    // never see anyone else's hand
    s.players.forEach((p) => assert.equal(p.hand, undefined))
    if (s.phase === 'declare' && s.gameCallerId === s.myPlayerId) {
      assert.equal(s.myHand.length, 5)
      human.emit('declare_game_suit', { suit: 'spades' })
    }
    if (s.phase === 'play' && s.currentTurn === s.myPlayerId) {
      const led = s.currentTrick?.ledSuit ?? null
      const hand = s.myHand
      const sameSuit = hand.filter((c) => c.suit === led)
      const card = (led == null ? hand : sameSuit.length ? sameSuit : hand)[0]
      human.emit('play_card', { cardId: card.id })
    }
  })
  human.on('game_over', (p) => { over = p })

  await new Promise((resolve) => {
    human.on('connect', () => {
      human.emit('create_room', { displayName: 'Solo' })
      human.once('room_created', ({ playerId }) => {
        myId = playerId
        resolve()
      })
    })
  })

  // Fill the table: human is team A; add a bot teammate (A) and two opponents (B).
  human.emit('add_bot', { teamId: 'A', difficulty: 'easy' })
  human.emit('add_bot', { teamId: 'B', difficulty: 'medium' })
  human.emit('add_bot', { teamId: 'B', difficulty: 'hard' })

  const done = new Promise((resolve) => {
    const check = setInterval(() => {
      if (over && ['A', 'B'].includes(over.winnerTeam)) {
        clearInterval(check)
        resolve()
      }
    }, 10)
  })
  // Bots are auto-ready; the human readies to start.
  human.emit('player_ready', {})

  await done
  assert.ok(['A', 'B'].includes(over.winnerTeam))
  assert.equal(myId, 0)

  human.close()
})

test('four clients play a full game to a winner with no hand leakage', async () => {
  const clients = []
  const latest = {} // playerId -> last state
  let winnerTeam = null

  function connect(setup) {
    return new Promise((resolve) => {
      const c = Client(URL, { forceNew: true })
      c.on('state', (s) => {
        latest[s.myPlayerId] = s
        // No other player's hand or socketId should ever appear.
        s.players.forEach((p) => assert.equal(p.hand, undefined))
        // It's my turn during play -> play a legal card.
        if (s.phase === 'play' && s.currentTurn === s.myPlayerId) {
          c.emit('play_card', { cardId: legalCard(s).id })
        }
        // I'm the caller in declare phase -> declare spades.
        if (s.phase === 'declare' && s.gameCallerId === s.myPlayerId) {
          assert.equal(s.myHand.length, 5)
          c.emit('declare_game_suit', { suit: 'spades' })
        }
      })
      c.on('game_over', ({ winnerTeam: w }) => {
        winnerTeam = w
      })
      c.on('connect', () => setup(c, resolve))
      clients.push(c)
    })
  }

  // Host creates; the other three join.
  let roomCode = null
  await connect((c, resolve) => {
    c.emit('create_room', { displayName: 'Alice' })
    c.once('room_created', ({ roomCode: rc }) => {
      roomCode = rc
      resolve()
    })
  })
  for (const name of ['Bob', 'Cara', 'Dan']) {
    await connect((c, resolve) => {
      c.emit('join_room', { roomCode, displayName: name })
      c.once('room_joined', () => resolve())
    })
  }

  // Everyone readies up -> game auto-starts, declare fires, play runs to the end.
  // Wait for the game_over event AND for the final state broadcast to land
  // (it follows game_over by TRICK_PAUSE_MS, so polling on the event alone races).
  const done = new Promise((resolve) => {
    const check = setInterval(() => {
      const anyState = Object.values(latest)[0]
      if (winnerTeam && anyState && anyState.teams[winnerTeam].tricks >= 7) {
        clearInterval(check)
        resolve()
      }
    }, 10)
  })
  clients.forEach((c) => c.emit('player_ready', {}))

  await done
  assert.ok(['A', 'B'].includes(winnerTeam))
  // 13 tricks distributed, winner has >= 7.
  const anyState = Object.values(latest)[0]
  assert.ok(anyState.teams[winnerTeam].tricks >= 7)

  clients.forEach((c) => c.close())
  io.close()
  httpServer.close()
})
