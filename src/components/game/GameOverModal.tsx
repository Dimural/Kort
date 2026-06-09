import { useMemo, useState } from 'react'
import { actions, useGameStore } from '../../store/gameStore'
import type { ClientState } from '../../game/types'

const CONFETTI_GLYPHS = ['♠', '♥', '♦', '♣']

/** Falling suit-glyph confetti for the winning team (transform/opacity only). */
function Confetti() {
  const pieces = useMemo(
    () =>
      Array.from({ length: 26 }).map((_, i) => ({
        glyph: CONFETTI_GLYPHS[i % 4],
        left: Math.random() * 100,
        delay: Math.random() * 1.6,
        dur: 2.6 + Math.random() * 1.8,
        size: 14 + Math.random() * 14,
        hue: i % 3, // 0 gold, 1 terracotta, 2 navy
      })),
    [],
  )
  return (
    <div className="confetti" aria-hidden="true">
      {pieces.map((p, i) => (
        <span
          key={i}
          className={`confetti__bit confetti__bit--${p.hue}`}
          style={
            {
              left: `${p.left}%`,
              fontSize: `${p.size}px`,
              animationDelay: `${p.delay}s`,
              animationDuration: `${p.dur}s`,
            } as React.CSSProperties
          }
        >
          {p.glyph}
        </span>
      ))}
    </div>
  )
}

export function GameOverModal({ game }: { game: ClientState }) {
  const { gameOver } = useGameStore()
  const [leaving, setLeaving] = useState(false)

  if (gameOver?.abandoned) {
    return (
      <div className="modal-overlay">
        <div className="endcard panel">
          <h2 className="endcard__title">Game abandoned</h2>
          <p className="endcard__sub">{gameOver.displayName} didn't reconnect in time.</p>
          <div className="endcard__actions">
            <button className="btn btn-blue" onClick={() => actions.leaveRoom()}>
              Back to home
            </button>
          </div>
        </div>
      </div>
    )
  }

  const winnerTeam = gameOver?.winnerTeam ?? game.winner
  const myTeam = game.players.find((p) => p.playerId === game.myPlayerId)?.teamId
  const won = winnerTeam === myTeam
  const a = game.teams.A.tricks
  const b = game.teams.B.tricks
  const score = winnerTeam === 'A' ? `${a} – ${b}` : `${b} – ${a}`

  const votes = game.rematchVotes ?? []
  const iVoted = votes.includes(game.myPlayerId)

  return (
    <div className="modal-overlay">
      {won && <Confetti />}
      <div className={`endcard panel ${won ? 'endcard--won' : ''}`}>
        <span className="endcard__kicker">{won ? 'Seven tricks' : 'Game over'}</span>
        <h2 className="endcard__title">{won ? 'Your team takes it!' : `Team ${winnerTeam} takes it`}</h2>
        <p className="endcard__sub">
          Final score {score} — {winnerTeam === 'A' ? 'Team A' : 'Team B'} reached seven tricks first.
        </p>

        <div className="endcard__votes" aria-label="Rematch votes">
          {game.players.map((p) => (
            <span
              key={p.playerId}
              className={`votechip ${votes.includes(p.playerId) ? 'is-in' : ''}`}
            >
              {votes.includes(p.playerId) && (
                <svg viewBox="0 0 24 24" width="12" height="12" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M20 6 9 17l-5-5" />
                </svg>
              )}
              {p.playerId === game.myPlayerId ? 'You' : p.displayName}
            </span>
          ))}
        </div>

        <div className="endcard__actions">
          <button
            className="btn btn-accent"
            disabled={iVoted}
            onClick={() => actions.playAgain()}
          >
            {iVoted ? `Waiting for the others (${votes.length}/4)` : 'Play again'}
          </button>
          <button
            className="btn btn-ghost"
            disabled={leaving}
            onClick={() => {
              setLeaving(true)
              actions.leaveRoom()
            }}
          >
            Leave
          </button>
        </div>
      </div>
    </div>
  )
}
