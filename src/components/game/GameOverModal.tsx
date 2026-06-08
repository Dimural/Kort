import { actions, useGameStore } from '../../store/gameStore'
import type { ClientState } from '../../game/types'

export function GameOverModal({ game }: { game: ClientState }) {
  const { gameOver } = useGameStore()
  const winnerTeam = gameOver?.winnerTeam ?? game.winner

  if (gameOver?.abandoned) {
    return (
      <div className="modal-overlay">
        <div className="modal panel">
          <h2 className="modal__title">Game abandoned</h2>
          <p className="modal__sub">{gameOver.displayName} did not reconnect in time.</p>
          <button className="btn btn-blue" onClick={() => actions.leaveRoom()}>
            Back to Home
          </button>
        </div>
      </div>
    )
  }

  const myTeam = game.players.find((p) => p.playerId === game.myPlayerId)?.teamId
  const won = winnerTeam === myTeam

  return (
    <div className="modal-overlay">
      <div className="modal panel">
        <h2 className="modal__title">{won ? 'Your team wins!' : `Team ${winnerTeam} wins`}</h2>
        <p className="modal__sub">
          Team A {game.teams.A.tricks} — {game.teams.B.tricks} Team B
        </p>
        <div className="modal__actions">
          <button className="btn btn-blue" onClick={() => actions.playAgain()}>
            Play Again
          </button>
          <button className="btn btn-ghost" onClick={() => actions.leaveRoom()}>
            Leave
          </button>
        </div>
      </div>
    </div>
  )
}
