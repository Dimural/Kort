import { useEffect } from 'react'
import { useGameStore } from '../store/gameStore'
import { HomePanel } from '../components/HomePanel'
import { LobbyView } from '../components/lobby/LobbyView'
import { GameBoard } from '../components/game/GameBoard'
import { DisconnectOverlay } from '../components/shared/DisconnectOverlay'

/** Keep the tab title in sync with what the player should be doing. */
function usePhaseTitle() {
  const { game } = useGameStore()
  useEffect(() => {
    const phase = game?.phase
    if (!game || !phase) {
      document.title = 'Kort — A classic Uyghur team card game'
      return
    }
    if (phase === 'lobby') document.title = `Lobby ${game.roomCode} · Kort`
    else if (phase === 'declare') document.title = 'Calling the game · Kort'
    else if (phase === 'play')
      document.title = game.currentTurn === game.myPlayerId ? '● Your turn · Kort' : 'Kort'
    else if (phase === 'end') document.title = 'Game over · Kort'
    return () => {
      document.title = 'Kort — A classic Uyghur team card game'
    }
  }, [game])
}

// Live, connection-driven container. Renders the right screen for the current phase.
export function GameTablePage() {
  const { game, roomCode, disconnectedPlayer } = useGameStore()
  usePhaseTitle()

  if (!game) {
    return (
      <div className="table-page table-page--center">
        {roomCode ? (
          <div className="home-panel panel">
            <div className="spinner" />
            <p className="home-panel__status">Reconnecting to room {roomCode}…</p>
          </div>
        ) : (
          <HomePanel />
        )}
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
