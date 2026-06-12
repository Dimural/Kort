// Express + Socket.io setup. Wires client events to the (tested) game managers.
import { createServer } from 'node:http'
import { existsSync } from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import express from 'express'
import { Server } from 'socket.io'
import { RoomManager } from './roomManager.js'
import { startGame, declareGameSuit, playCard, resetForRematch } from './gameManager.js'
import { projectStateFor } from './stateProjection.js'

const PORT = process.env.PORT || 3001
const TRICK_PAUSE_MS = Number(process.env.TRICK_PAUSE_MS ?? 1800)
const RECONNECT_TIMEOUT_MS = Number(process.env.RECONNECT_TIMEOUT_MS ?? 60_000)

const app = express()
app.get('/health', (_req, res) => res.json({ ok: true }))

// Serve the built frontend (if present) so one server runs the whole game
// in production. `npm run build` then `npm run server`.
const distDir = path.join(path.dirname(fileURLToPath(import.meta.url)), '..', 'dist')
if (existsSync(distDir)) {
  app.use(express.static(distDir))
  app.use((req, res, next) => {
    if (req.method !== 'GET' || req.path.startsWith('/socket.io')) return next()
    res.sendFile(path.join(distDir, 'index.html'))
  })
}

const httpServer = createServer(app)
const io = new Server(httpServer, { cors: { origin: '*' } })

const rooms = new RoomManager()
const disconnectTimers = new Map() // roomCode:playerId -> timeout

// --- helpers ---

function broadcastState(room) {
  for (const player of room.players) {
    if (player.socketId) {
      io.to(player.socketId).emit('state', projectStateFor(room, player.playerId))
    }
  }
}

function emitError(socket, message) {
  socket.emit('error_msg', { message })
}

function maybeStart(room) {
  if (room.phase === 'lobby' && rooms.canStart(room)) {
    startGame(room)
    io.to(room.roomCode).emit('game_starting', { countdown: 0 })
    io.to(room.roomCode).emit('game_caller_selected', { playerId: room.gameCallerId })
    broadcastState(room)
  }
}

// --- socket handlers ---

io.on('connection', (socket) => {
  socket.on('create_room', ({ displayName }) => {
    const { room, playerId } = rooms.createRoom({ displayName: displayName || 'Player', socketId: socket.id })
    socket.join(room.roomCode)
    socket.data = { roomCode: room.roomCode, playerId }
    socket.emit('room_created', { roomCode: room.roomCode, playerId })
    broadcastState(room)
  })

  socket.on('join_room', ({ roomCode, displayName }) => {
    try {
      const code = String(roomCode || '').toUpperCase()
      const { room, playerId } = rooms.joinRoom({ roomCode: code, displayName: displayName || 'Player', socketId: socket.id })
      socket.join(room.roomCode)
      socket.data = { roomCode: room.roomCode, playerId }
      socket.emit('room_joined', { roomCode: room.roomCode, playerId })
      broadcastState(room)
    } catch (err) {
      emitError(socket, err.message)
    }
  })

  socket.on('select_team', ({ teamId }) => {
    const { roomCode, playerId } = socket.data || {}
    if (!roomCode) return
    rooms.selectTeam(roomCode, playerId, teamId)
    const room = rooms.getRoom(roomCode)
    if (room) broadcastState(room)
  })

  socket.on('player_ready', () => {
    const { roomCode, playerId } = socket.data || {}
    if (!roomCode) return
    rooms.toggleReady(roomCode, playerId)
    const room = rooms.getRoom(roomCode)
    if (!room) return
    broadcastState(room)
    maybeStart(room)
  })

  socket.on('declare_game_suit', ({ suit }) => {
    const { roomCode, playerId } = socket.data || {}
    const room = rooms.getRoom(roomCode)
    if (!room) return
    try {
      declareGameSuit(room, playerId, suit)
      io.to(room.roomCode).emit('game_suit_declared', { suit })
      io.to(room.roomCode).emit('deal_complete', {})
      broadcastState(room)
    } catch (err) {
      emitError(socket, err.message)
    }
  })

  socket.on('play_card', ({ cardId }) => {
    const { roomCode, playerId } = socket.data || {}
    const room = rooms.getRoom(roomCode)
    if (!room) return
    try {
      const result = playCard(room, playerId, cardId)

      if (!result.trickComplete) {
        broadcastState(room)
        return
      }

      // Trick finished — let the 4 cards linger before clearing.
      const completed = room.trickHistory[room.trickHistory.length - 1]
      io.to(room.roomCode).emit('trick_complete', {
        plays: completed.plays,
        ledSuit: completed.ledSuit,
        winnerId: result.winnerId,
        winnerTeam: result.winnerTeam,
        teamTricks: result.teamTricks,
        nextLeaderId: result.nextLeaderId ?? null,
      })

      if (result.gameOver) {
        io.to(room.roomCode).emit('game_over', { winnerTeam: result.winnerTeam, teamTricks: result.teamTricks })
      }
      setTimeout(() => broadcastState(room), TRICK_PAUSE_MS)
    } catch (err) {
      emitError(socket, err.message)
    }
  })

  socket.on('play_again', () => {
    const { roomCode } = socket.data || {}
    const room = rooms.getRoom(roomCode)
    if (!room || room.phase !== 'end') return
    room._rematchVotes = room._rematchVotes || new Set()
    room._rematchVotes.add(socket.data.playerId)
    if (room._rematchVotes.size === room.players.length) {
      room._rematchVotes = null
      resetForRematch(room)
      io.to(room.roomCode).emit('game_caller_selected', { playerId: room.gameCallerId })
      broadcastState(room)
    } else {
      broadcastState(room)
    }
  })

  // Reconnect to an in-progress game using stored identity.
  socket.on('rejoin', ({ roomCode, playerId }) => {
    const room = rooms.getRoom(roomCode)
    if (!room) return emitError(socket, 'Room not found')
    const player = room.players.find((p) => p.playerId === playerId)
    if (!player) return emitError(socket, 'Player slot not found')

    player.socketId = socket.id
    player.isConnected = true
    socket.join(roomCode)
    socket.data = { roomCode, playerId }

    const key = `${roomCode}:${playerId}`
    if (disconnectTimers.has(key)) {
      clearTimeout(disconnectTimers.get(key))
      disconnectTimers.delete(key)
    }
    io.to(roomCode).emit('player_reconnected', { playerId, displayName: player.displayName })
    broadcastState(room)
  })

  socket.on('disconnect', () => {
    const data = socket.data || {}
    const room = data.roomCode ? rooms.getRoom(data.roomCode) : null
    if (!room) return

    if (room.phase === 'lobby') {
      rooms.removeBySocket(socket.id)
      const stillThere = rooms.getRoom(room.roomCode)
      if (stillThere) broadcastState(stillThere)
      return
    }

    // Mid-game: mark disconnected, pause, hold for reconnect.
    const player = room.players.find((p) => p.socketId === socket.id)
    if (!player) return
    player.isConnected = false
    io.to(room.roomCode).emit('player_disconnected', { playerId: player.playerId, displayName: player.displayName })
    broadcastState(room)

    const key = `${room.roomCode}:${player.playerId}`
    const timer = setTimeout(() => {
      if (!player.isConnected && room.phase !== 'end') {
        room.phase = 'end'
        room.winner = null
        io.to(room.roomCode).emit('game_over', { winnerTeam: null, abandoned: true, displayName: player.displayName })
        broadcastState(room)
      }
      disconnectTimers.delete(key)
    }, RECONNECT_TIMEOUT_MS)
    disconnectTimers.set(key, timer)
  })
})

httpServer.listen(PORT, () => {
  console.log(`Kort server listening on http://localhost:${PORT}`)
})

export { httpServer, io }
