import { useSyncExternalStore } from 'react'
import { socket } from '../socket/socket'
import type { ClientState, Suit, TeamId, TrickCompletePayload, Difficulty } from '../game/types'
import {
  sndCardPlay,
  sndGameLost,
  sndGameWon,
  sndTrickLost,
  sndTrickWon,
  sndYourTurn,
} from '../sound/sounds'

interface StoreState {
  connected: boolean
  roomCode: string | null
  playerId: number | null
  game: ClientState | null
  error: string | null
  trickOverlay: TrickCompletePayload | null
  gameOver: { winnerTeam: TeamId | null; abandoned?: boolean; displayName?: string } | null
  disconnectedPlayer: { playerId: number; displayName: string } | null
}

let state: StoreState = {
  connected: socket.connected,
  roomCode: sessionStorage.getItem('kort_roomCode'),
  playerId: sessionStorage.getItem('kort_playerId')
    ? Number(sessionStorage.getItem('kort_playerId'))
    : null,
  game: null,
  error: null,
  trickOverlay: null,
  gameOver: null,
  disconnectedPlayer: null,
}

const listeners = new Set<() => void>()
function set(partial: Partial<StoreState>) {
  state = { ...state, ...partial }
  listeners.forEach((l) => l())
}

function persistIdentity(roomCode: string, playerId: number) {
  sessionStorage.setItem('kort_roomCode', roomCode)
  sessionStorage.setItem('kort_playerId', String(playerId))
}
function clearIdentity() {
  sessionStorage.removeItem('kort_roomCode')
  sessionStorage.removeItem('kort_playerId')
}

// --- socket event wiring (registered once) ---
socket.on('connect', () => {
  set({ connected: true })
  // Attempt to rejoin an in-progress game after a reconnect/refresh.
  if (state.roomCode != null && state.playerId != null) {
    socket.emit('rejoin', { roomCode: state.roomCode, playerId: state.playerId })
  }
})
socket.on('disconnect', () => set({ connected: false }))

socket.on('room_created', ({ roomCode, playerId }: { roomCode: string; playerId: number }) => {
  persistIdentity(roomCode, playerId)
  set({ roomCode, playerId, error: null })
})
socket.on('room_joined', ({ roomCode, playerId }: { roomCode: string; playerId: number }) => {
  persistIdentity(roomCode, playerId)
  set({ roomCode, playerId, error: null })
})

socket.on('state', (game: ClientState) => {
  const prev = state.game

  // Sound cues derived from state transitions (display-only).
  if (prev && prev.roomCode === game.roomCode) {
    const prevPlays = prev.currentTrick?.plays.length ?? 0
    const nowPlays = game.currentTrick?.plays.length ?? 0
    if (game.phase === 'play' && nowPlays > prevPlays) sndCardPlay()
    if (
      game.phase === 'play' &&
      game.currentTurn === game.myPlayerId &&
      prev.currentTurn !== prev.myPlayerId
    ) {
      sndYourTurn()
    }
  }

  set({
    game,
    roomCode: game.roomCode,
    playerId: game.myPlayerId,
    trickOverlay: null,
    gameOver: game.phase === 'end' ? state.gameOver : null,
    error: null,
  })
})

socket.on('error_msg', ({ message }: { message: string }) => {
  // A failed rejoin (room expired / server restarted) would otherwise leave the
  // player stuck on "Reconnecting…" — fall back to the home screen instead.
  if (state.game === null && state.roomCode !== null) {
    clearIdentity()
    set({ roomCode: null, playerId: null, error: 'That game has ended.' })
    return
  }
  set({ error: message })
})

socket.on('trick_complete', (payload: TrickCompletePayload) => {
  const myTeam = state.game?.players.find((p) => p.playerId === state.game?.myPlayerId)?.teamId
  if (myTeam) (payload.winnerTeam === myTeam ? sndTrickWon : sndTrickLost)()
  set({ trickOverlay: payload })
})
socket.on('game_over', (payload: StoreState['gameOver']) => {
  const myTeam = state.game?.players.find((p) => p.playerId === state.game?.myPlayerId)?.teamId
  if (payload && !payload.abandoned && myTeam) {
    ;(payload.winnerTeam === myTeam ? sndGameWon : sndGameLost)()
  }
  set({ gameOver: payload })
})
socket.on('player_disconnected', (p: { playerId: number; displayName: string }) =>
  set({ disconnectedPlayer: p }),
)
socket.on('player_reconnected', () => set({ disconnectedPlayer: null }))

// --- public store API ---
export function subscribe(cb: () => void) {
  listeners.add(cb)
  return () => listeners.delete(cb)
}
export function getSnapshot() {
  return state
}

export function useGameStore() {
  return useSyncExternalStore(subscribe, getSnapshot)
}

// --- actions ---
export const actions = {
  createRoom: (displayName: string) => socket.emit('create_room', { displayName }),
  joinRoom: (roomCode: string, displayName: string) =>
    socket.emit('join_room', { roomCode, displayName }),
  selectTeam: (teamId: TeamId) => socket.emit('select_team', { teamId }),
  addBot: (teamId: TeamId, difficulty: Difficulty) =>
    socket.emit('add_bot', { teamId, difficulty }),
  removeBot: (playerId: number) => socket.emit('remove_bot', { playerId }),
  toggleReady: () => socket.emit('player_ready', {}),
  declareSuit: (suit: Suit) => socket.emit('declare_game_suit', { suit }),
  playCard: (cardId: string) => socket.emit('play_card', { cardId }),
  playAgain: () => socket.emit('play_again', {}),
  clearError: () => set({ error: null }),
  leaveRoom: () => {
    clearIdentity()
    set({ roomCode: null, playerId: null, game: null, gameOver: null, trickOverlay: null })
    socket.disconnect()
    socket.connect()
  },
}
