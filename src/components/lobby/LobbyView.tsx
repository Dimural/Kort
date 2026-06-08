import { actions, useGameStore } from '../../store/gameStore'
import type { ClientState, TeamId } from '../../game/types'
import { RoomCodeDisplay } from '../shared/RoomCodeDisplay'

function TeamPanel({ game, teamId }: { game: ClientState; teamId: TeamId }) {
  const members = game.players.filter((p) => p.teamId === teamId)
  const isFull = members.length >= 2
  const mine = game.players.find((p) => p.playerId === game.myPlayerId)
  const canJoin = !isFull && mine?.teamId !== teamId

  return (
    <div
      className={`teampanel ${mine?.teamId === teamId ? 'is-own' : ''} ${canJoin ? 'is-joinable' : ''}`}
      onClick={() => canJoin && actions.selectTeam(teamId)}
      role="button"
    >
      <h3 className="teampanel__name">Team {teamId}</h3>
      {[0, 1].map((slot) => {
        const p = members[slot]
        const isMe = p?.playerId === game.myPlayerId
        return (
          <div key={slot} className={`slot ${p ? 'is-taken' : 'is-empty'} ${isMe ? 'is-me' : ''}`}>
            {p ? (
              <>
                <span className="slot__name">
                  {p.displayName}
                  {isMe && ' (you)'}
                </span>
                <span className={`slot__ready ${p.isReady ? 'is-ready' : ''}`}>
                  {p.isReady ? 'Ready' : '…'}
                </span>
              </>
            ) : (
              <span className="slot__name slot__name--empty">Waiting…</span>
            )}
          </div>
        )
      })}
    </div>
  )
}

export function LobbyView({ game }: { game: ClientState }) {
  const { error } = useGameStore()
  const me = game.players.find((p) => p.playerId === game.myPlayerId)
  const readyCount = game.players.filter((p) => p.isReady).length

  return (
    <div className="lobby-live panel">
      <RoomCodeDisplay code={game.roomCode} />

      <div className="lobby-live__teams">
        <TeamPanel game={game} teamId="A" />
        <span className="lobby-live__vs">vs</span>
        <TeamPanel game={game} teamId="B" />
      </div>

      <div className="lobby-live__status">
        <span>{game.players.length} / 4 players joined</span>
        <span>{readyCount} / 4 ready</span>
      </div>

      <button
        className={`btn ${me?.isReady ? 'btn-ghost' : 'btn-blue'} lobby-live__ready`}
        onClick={() => actions.toggleReady()}
      >
        {me?.isReady ? 'Cancel Ready' : 'Ready'}
      </button>

      <p className="lobby-live__hint">The game starts automatically when all 4 players are ready.</p>
      {error && <p className="home-panel__error">{error}</p>}
    </div>
  )
}
