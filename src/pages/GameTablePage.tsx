import { useGameStore } from '../store/gameStore'
import { HomePanel } from '../components/HomePanel'
import { LobbyView } from '../components/lobby/LobbyView'
import { GameBoard } from '../components/game/GameBoard'
import { DisconnectOverlay } from '../components/shared/DisconnectOverlay'

// Live, connection-driven container. Renders the right screen for the current phase.
export function GameTablePage() {
  const { game, roomCode, disconnectedPlayer } = useGameStore()

  if (!game) {
    return (
      <div className="table-page table-page--center">
        {roomCode ? <p className="home-panel__status">Reconnecting to {roomCode}…</p> : <HomePanel />}
      </div>
    )
  }

  return (
    <>
      {game.phase === 'lobby' ? (
        <div className="table-page table-page--center">
          <LobbyView game={game} />
        </div>
      ) : (
        <GameBoard game={game} />
      )}

      {disconnectedPlayer && game.phase !== 'end' && game.phase !== 'lobby' && (
        <DisconnectOverlay name={disconnectedPlayer.displayName} />
      )}
    </>
  )
}
