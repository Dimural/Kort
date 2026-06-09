import { useEffect, useState } from 'react'
import { actions, useGameStore } from '../../store/gameStore'
import { CardBack, CardFace, type Suit } from '../Card'
import { isPlayable } from '../../game/playable'
import { sortHand } from '../../game/sortHand'
import { isMuted, setMuted } from '../../sound/sounds'
import type { ClientState, Position, PlayerView, TrickPlay } from '../../game/types'
import { DeclareSuit } from './DeclareSuit'
import { GameOverModal } from './GameOverModal'

const SUIT_GLYPH: Record<Suit, string> = { spades: '♠', hearts: '♥', diamonds: '♦', clubs: '♣' }
const RED_SUITS: Suit[] = ['hearts', 'diamonds']

function posOf(game: ClientState, playerId: number): Position {
  return (game.players.find((p) => p.playerId === playerId)?.position as Position) ?? 'bottom'
}

/* ---- HUD pieces ---------------------------------------------------- */

function TrumpBadge({ suit }: { suit: Suit | null }) {
  if (!suit) return null
  return (
    <div className={`suitbadge ${RED_SUITS.includes(suit) ? 'suitbadge--red' : ''}`}>
      <span className="suitbadge__glyph">{SUIT_GLYPH[suit]}</span>
      <span className="suitbadge__text">
        {suit.charAt(0).toUpperCase() + suit.slice(1)}
        <small>game suit</small>
      </span>
    </div>
  )
}

function ScorePips({ game, teamId }: { game: ClientState; teamId: 'A' | 'B' }) {
  const tricks = game.teams[teamId].tricks
  const isMine = game.players.find((p) => p.playerId === game.myPlayerId)?.teamId === teamId
  return (
    <div className={`scorepips scorepips--${teamId.toLowerCase()}`}>
      <span className="scorepips__label">
        {teamId}
        {isMine && <em>you</em>}
      </span>
      <span className="scorepips__dots" aria-label={`Team ${teamId}: ${tricks} of 7 tricks`}>
        {Array.from({ length: 7 }).map((_, i) => (
          <i key={i} className={i < tricks ? 'is-won' : ''} />
        ))}
      </span>
    </div>
  )
}

function MuteButton() {
  const [muted, setMutedState] = useState(isMuted())
  const toggle = () => {
    setMuted(!muted)
    setMutedState(!muted)
  }
  return (
    <button
      className="iconbtn"
      onClick={toggle}
      aria-label={muted ? 'Unmute sounds' : 'Mute sounds'}
      title={muted ? 'Unmute sounds' : 'Mute sounds'}
    >
      <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M11 5 6 9H2v6h4l5 4V5z" />
        {muted ? (
          <path d="m23 9-6 6M17 9l6 6" />
        ) : (
          <path d="M15.5 8.5a5 5 0 0 1 0 7" />
        )}
      </svg>
    </button>
  )
}

function LeaveControl({ confirmNeeded }: { confirmNeeded: boolean }) {
  const [confirming, setConfirming] = useState(false)
  if (!confirmNeeded) {
    return (
      <button className="btn btn-ghost btn--sm" onClick={() => actions.leaveRoom()}>
        ← Leave
      </button>
    )
  }
  return confirming ? (
    <span className="leave-confirm">
      <span>Leave the game?</span>
      <button className="btn btn--sm leave-confirm__yes" onClick={() => actions.leaveRoom()}>
        Leave
      </button>
      <button className="btn btn-ghost btn--sm" onClick={() => setConfirming(false)}>
        Stay
      </button>
    </span>
  ) : (
    <button className="btn btn-ghost btn--sm" onClick={() => setConfirming(true)}>
      ← Leave
    </button>
  )
}

/* ---- Seats & trick -------------------------------------------------- */

function OpponentSeat({ player, active }: { player: PlayerView; active: boolean }) {
  const pos = player.position as Position
  const n = player.cardCount
  const mid = (n - 1) / 2
  return (
    <div
      className={`oseat oseat--${pos} ${active ? 'is-active' : ''} ${!player.isConnected ? 'is-offline' : ''}`}
    >
      <div className="oseat__fan">
        {Array.from({ length: n }).map((_, i) => {
          const off = n > 1 ? i - mid : 0
          const rot = off * Math.min(5, 36 / Math.max(n - 1, 1))
          return (
            <span
              key={i}
              className="oseat__slot"
              style={{ '--rot': `${rot}deg` } as React.CSSProperties}
            >
              <CardBack className="card--xs" />
            </span>
          )
        })}
      </div>
      <div className={`plate plate--${player.teamId.toLowerCase()}`}>
        <span className="plate__name">{player.displayName}</span>
        <span className="plate__count">{n}</span>
        {!player.isConnected && <span className="plate__offline">away</span>}
        {active && <span className="plate__turndot" aria-label="their turn" />}
      </div>
    </div>
  )
}

function TrickArea({ game }: { game: ClientState }) {
  const { trickOverlay } = useGameStore()
  const plays: TrickPlay[] = trickOverlay ? trickOverlay.plays : game.currentTrick?.plays ?? []
  const winnerPos = trickOverlay ? posOf(game, trickOverlay.winnerId) : null
  const winnerName = trickOverlay
    ? game.players.find((p) => p.playerId === trickOverlay.winnerId)?.displayName
    : null

  return (
    <div className={`trick ${winnerPos ? `trick--done trick--sweep-${winnerPos}` : ''}`}>
      {plays.map((play) => (
        <div
          key={play.playerId}
          className={`trick__card trick__card--${posOf(game, play.playerId)} ${
            trickOverlay && play.playerId === trickOverlay.winnerId ? 'is-winner' : ''
          }`}
        >
          <CardFace rank={play.card.rank} suit={play.card.suit} />
        </div>
      ))}
      {trickOverlay && winnerName && (
        <div className={`trick__banner trick__banner--${trickOverlay.winnerTeam.toLowerCase()}`}>
          {trickOverlay.winnerId === game.myPlayerId ? 'You take the trick' : `${winnerName} takes the trick`}
        </div>
      )}
    </div>
  )
}

/* ---- Error toast ----------------------------------------------------- */

function Toast({ message }: { message: string }) {
  useEffect(() => {
    const t = setTimeout(() => actions.clearError(), 3200)
    return () => clearTimeout(t)
  }, [message])
  return <div className="toast">{message}</div>
}

/* ---- Board ----------------------------------------------------------- */

export function GameBoard({ game }: { game: ClientState }) {
  const { error, trickOverlay } = useGameStore()
  const opponents = game.players.filter((p) => p.playerId !== game.myPlayerId)
  // During the post-trick pause the server state is stale — don't show turn cues.
  const myTurn = game.phase === 'play' && game.currentTurn === game.myPlayerId && !trickOverlay
  const ledSuit = game.currentTrick?.ledSuit ?? null
  const hand = sortHand(game.myHand, game.gameSuit)

  return (
    <div className="game">
      <header className="game__bar">
        <div className="game__bar-side">
          <LeaveControl confirmNeeded={game.phase !== 'end'} />
          <button
            className="codechip"
            onClick={() => navigator.clipboard?.writeText(game.roomCode).catch(() => {})}
            title="Copy room code"
          >
            {game.roomCode}
          </button>
        </div>
        <div className="game__bar-side game__bar-side--right">
          <MuteButton />
          <TrumpBadge suit={game.gameSuit} />
          <div className="scoreboard">
            <ScorePips game={game} teamId="A" />
            <ScorePips game={game} teamId="B" />
          </div>
        </div>
      </header>

      <div className="game__stage">
        <div className="board">
          <img src="/assets/hero-board.png" alt="" className="board__art" aria-hidden="true" />
          {opponents.map((p) => (
            <OpponentSeat
              key={p.playerId}
              player={p}
              active={game.currentTurn === p.playerId && !trickOverlay}
            />
          ))}
          <TrickArea game={game} />
        </div>

        <div className={`my-area ${myTurn ? 'is-my-turn' : ''}`}>
          <div className={`turn-pill ${myTurn ? 'is-on' : ''}`} aria-hidden={!myTurn}>
            Your turn{ledSuit ? '' : ' — you lead'}
          </div>
          <div className="hand" key={game.phase === 'declare' ? 'first-five' : 'full-hand'}>
            {hand.map((c, i) => {
              const off = hand.length > 1 ? i - (hand.length - 1) / 2 : 0
              const rot = off * Math.min(4, 30 / Math.max(hand.length - 1, 1))
              const playable = myTurn && isPlayable(c, game.myHand, ledSuit, game.gameSuit)
              return (
                <button
                  key={c.id}
                  className={`hand-card ${playable ? 'is-playable' : ''} ${
                    myTurn && !playable ? 'is-locked' : ''
                  }`}
                  style={{ '--rot': `${rot}deg`, '--i': i } as React.CSSProperties}
                  disabled={!playable}
                  onClick={() => playable && actions.playCard(c.id)}
                  aria-label={`${c.rank} of ${c.suit}${playable ? '' : ' (not playable)'}`}
                >
                  <CardFace rank={c.rank} suit={c.suit} />
                </button>
              )
            })}
          </div>
        </div>
      </div>

      {game.phase === 'declare' && <DeclareSuit game={game} />}
      {game.phase === 'end' && <GameOverModal game={game} />}
      {error && <Toast message={error} />}
    </div>
  )
}
