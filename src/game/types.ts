export type Suit = 'spades' | 'hearts' | 'diamonds' | 'clubs'
export type TeamId = 'A' | 'B'
export type Position = 'bottom' | 'left' | 'top' | 'right'
export type Phase = 'lobby' | 'declare' | 'play' | 'end'

export interface Card {
  id: string
  suit: Suit
  rank: string
  value: number
}

export interface PlayerView {
  playerId: number
  displayName: string
  teamId: TeamId
  position: Position | null
  cardCount: number
  isConnected: boolean
  isReady: boolean
}

export interface TrickPlay {
  playerId: number
  card: Card
}

export interface CurrentTrick {
  ledSuit: Suit | null
  ledByPlayerId: number
  plays: TrickPlay[]
}

/** The per-client projected state sent by the server (never includes others' hands). */
export interface ClientState {
  roomCode: string
  phase: Phase
  gameSuit: Suit | null
  gameCallerId: number | null
  currentLeaderId: number | null
  currentTurn: number | null
  currentTrick: CurrentTrick | null
  myPlayerId: number
  myHand: Card[]
  players: PlayerView[]
  teams: { A: { tricks: number }; B: { tricks: number } }
  winner: TeamId | null
  /** playerIds who voted to play again (only meaningful in the end phase) */
  rematchVotes?: number[]
}

export interface TrickCompletePayload {
  plays: TrickPlay[]
  ledSuit: Suit | null
  winnerId: number
  winnerTeam: TeamId
  teamTricks: { A: number; B: number }
  nextLeaderId: number | null
}
