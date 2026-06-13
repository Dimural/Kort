// Create/join/destroy rooms and manage lobby state. In-memory room map.
import { customAlphabet } from 'nanoid'

const ALPHABET = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789' // no ambiguous chars (I,O,0,1)
const defaultGenerateCode = customAlphabet(ALPHABET, 6)

const MAX_PLAYERS = 4
const TEAM_SIZE = 2
const BOT_NAMES = ['Aygul', 'Tahir', 'Patime', 'Erkin', 'Gulnar', 'Memet']

export class RoomManager {
  constructor({ generateCode = defaultGenerateCode } = {}) {
    this.generateCode = generateCode
    this.rooms = new Map() // roomCode -> room
  }

  getRoom(roomCode) {
    return this.rooms.get(roomCode)
  }

  createRoom({ displayName, socketId }) {
    let roomCode = this.generateCode()
    while (this.rooms.has(roomCode)) roomCode = this.generateCode()

    const room = {
      roomCode,
      phase: 'lobby',
      players: [],
      teams: { A: { tricks: 0 }, B: { tricks: 0 } },
      // game state, populated when play begins
      gameSuit: null,
      gameCallerId: null,
      currentLeaderId: null,
      currentTurn: null,
      currentTrick: null,
      trickHistory: [],
      winner: null,
    }
    this.rooms.set(roomCode, room)
    const playerId = this._addPlayer(room, displayName, socketId)
    return { room, playerId }
  }

  joinRoom({ roomCode, displayName, socketId }) {
    const room = this.rooms.get(roomCode)
    if (!room) throw new Error('Room not found')
    if (room.phase !== 'lobby') throw new Error('Game already in progress')
    if (room.players.length >= MAX_PLAYERS) throw new Error('Room is full')
    const playerId = this._addPlayer(room, displayName, socketId)
    return { room, playerId }
  }

  addBot(roomCode, teamId, difficulty = 'medium') {
    const room = this.rooms.get(roomCode)
    if (!room || room.phase !== 'lobby') return null
    if (room.players.length >= MAX_PLAYERS) return null
    const onTeam = room.players.filter((p) => p.teamId === teamId).length
    if (onTeam >= TEAM_SIZE) return null

    const used = new Set(room.players.map((p) => p.playerId))
    let playerId = 0
    while (used.has(playerId)) playerId++

    const takenNames = new Set(room.players.map((p) => p.displayName))
    const name = BOT_NAMES.find((n) => !takenNames.has(n)) ?? `Bot ${playerId}`

    const bot = {
      playerId,
      socketId: null,
      displayName: name,
      isBot: true,
      difficulty,
      teamId,
      position: null,
      hand: [],
      isReady: true,
      isConnected: true,
    }
    room.players.push(bot)
    return bot
  }

  removeBot(roomCode, playerId) {
    const room = this.rooms.get(roomCode)
    if (!room || room.phase !== 'lobby') return
    const idx = room.players.findIndex((p) => p.playerId === playerId && p.isBot)
    if (idx === -1) return
    room.players.splice(idx, 1)
  }

  _addPlayer(room, displayName, socketId) {
    const used = new Set(room.players.map((p) => p.playerId))
    let playerId = 0
    while (used.has(playerId)) playerId++

    const teamId = this._teamWithRoom(room)
    room.players.push({
      playerId,
      socketId,
      displayName,
      teamId,
      position: null,
      hand: [],
      isReady: false,
      isConnected: true,
    })
    return playerId
  }

  _teamWithRoom(room) {
    const a = room.players.filter((p) => p.teamId === 'A').length
    const b = room.players.filter((p) => p.teamId === 'B').length
    return b < a ? 'B' : 'A'
  }

  selectTeam(roomCode, playerId, teamId) {
    const room = this.rooms.get(roomCode)
    if (!room || room.phase !== 'lobby') return
    const player = room.players.find((p) => p.playerId === playerId)
    if (!player || player.teamId === teamId) return
    const count = room.players.filter((p) => p.teamId === teamId).length
    if (count >= TEAM_SIZE) return // no open slot
    player.teamId = teamId
    this._resetReady(room)
  }

  toggleReady(roomCode, playerId) {
    const room = this.rooms.get(roomCode)
    if (!room) return
    const player = room.players.find((p) => p.playerId === playerId)
    if (player) player.isReady = !player.isReady
  }

  canStart(room) {
    if (room.players.length !== MAX_PLAYERS) return false
    const a = room.players.filter((p) => p.teamId === 'A').length
    const b = room.players.filter((p) => p.teamId === 'B').length
    if (a !== TEAM_SIZE || b !== TEAM_SIZE) return false
    return room.players.every((p) => p.isReady)
  }

  // Remove the player owning socketId from whatever room they are in.
  // Returns the affected room (or null). Destroys the room if it becomes empty.
  removeBySocket(socketId) {
    for (const room of this.rooms.values()) {
      const idx = room.players.findIndex((p) => p.socketId === socketId)
      if (idx === -1) continue
      room.players.splice(idx, 1)
      const humansLeft = room.players.some((p) => !p.isBot)
      if (room.players.length === 0 || !humansLeft) {
        this.rooms.delete(room.roomCode)
        return room
      }
      this._resetReady(room)
      return room
    }
    return null
  }

  _resetReady(room) {
    room.players.forEach((p) => {
      if (!p.isBot) p.isReady = false
    })
  }
}
