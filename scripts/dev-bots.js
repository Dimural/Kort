// Dev utility: fill a lobby with bots that ready up, declare, and play legal cards.
// Lets one person test the full game flow locally.
//
//   node scripts/dev-bots.js <ROOMCODE> [count=3]
//
// Env: SERVER_URL (default http://localhost:3001), BOT_DELAY_MS (default 900),
//      BOT_REMATCH=1 to make bots vote "play again" after a game ends.
import { io } from 'socket.io-client'

const SERVER_URL = process.env.SERVER_URL || 'http://localhost:3001'
const DELAY = Number(process.env.BOT_DELAY_MS ?? 900)
const REMATCH = process.env.BOT_REMATCH === '1'

const roomCode = (process.argv[2] || '').toUpperCase()
const count = Number(process.argv[3] ?? 3)
if (!roomCode) {
  console.error('Usage: node scripts/dev-bots.js <ROOMCODE> [count]')
  process.exit(1)
}

const NAMES = ['Aygul', 'Tahir', 'Patime', 'Erkin', 'Gulnar', 'Memet']

function isPlayable(card, hand, ledSuit) {
  if (!ledSuit) return true
  const hasLed = hand.some((c) => c.suit === ledSuit)
  return hasLed ? card.suit === ledSuit : true
}

function startBot(name) {
  const socket = io(SERVER_URL)
  let myId = null
  let lastActionKey = null
  let readyPending = false

  const act = (key, fn, delay = DELAY) => {
    if (lastActionKey === key) return
    lastActionKey = key
    setTimeout(fn, delay)
  }

  socket.on('connect', () => socket.emit('join_room', { roomCode, displayName: name }))
  socket.on('room_joined', ({ playerId }) => {
    myId = playerId
    console.log(`[${name}] joined as player ${playerId}`)
  })
  socket.on('error_msg', ({ message }) => console.error(`[${name}] error: ${message}`))

  socket.on('state', (game) => {
    if (myId == null) return
    const me = game.players.find((p) => p.playerId === myId)
    if (!me) return

    if (game.phase === 'lobby') {
      // "ready" is a toggle — guard so racing state updates can't double-toggle.
      if (me.isReady) readyPending = false
      else if (!readyPending) {
        readyPending = true
        setTimeout(() => socket.emit('player_ready', {}), 400)
      }
      return
    }

    if (game.phase === 'declare' && game.gameCallerId === myId) {
      act('declare', () => {
        // Declare the suit we hold most of.
        const counts = {}
        for (const c of game.myHand) counts[c.suit] = (counts[c.suit] ?? 0) + 1
        const suit = Object.keys(counts).sort((a, b) => counts[b] - counts[a])[0] ?? 'spades'
        console.log(`[${name}] declares ${suit}`)
        socket.emit('declare_game_suit', { suit })
      }, 1400)
      return
    }

    if (game.phase === 'play' && game.currentTurn === myId) {
      const tricksDone = game.teams.A.tricks + game.teams.B.tricks
      const playsSoFar = game.currentTrick?.plays?.length ?? 0
      act(`play-${tricksDone}-${playsSoFar}`, () => {
        const ledSuit = game.currentTrick?.ledSuit ?? null
        const card = game.myHand.find((c) => isPlayable(c, game.myHand, ledSuit))
        if (!card) return
        console.log(`[${name}] plays ${card.id}`)
        socket.emit('play_card', { cardId: card.id })
      })
      return
    }

    if (game.phase === 'end' && REMATCH) {
      act('rematch', () => socket.emit('play_again', {}), 2500)
    }
  })
}

for (let i = 0; i < count; i++) startBot(NAMES[i % NAMES.length])
