import { actions, useGameStore } from '../../store/gameStore'
import type { ClientState, PlayerView, TeamId } from '../../game/types'
import { RoomCodeDisplay } from '../shared/RoomCodeDisplay'
import { Ornament } from '../Ornament'

function Slot({ player, isMe }: { player: PlayerView | undefined; isMe: boolean }) {
  if (!player) {
    return (
      <div className="slot is-empty">
        <span className="slot__avatar slot__avatar--empty" aria-hidden="true" />
        <span className="slot__name slot__name--empty">
          Waiting
          <span className="slot__dots" aria-hidden="true">
            <i />
            <i />
            <i />
          </span>
        </span>
      </div>
    )
  }
  return (
    <div className={`slot is-taken ${isMe ? 'is-me' : ''}`}>
      <span className="slot__avatar" aria-hidden="true">
        {player.displayName.charAt(0).toUpperCase()}
      </span>
      <span className="slot__name">
        {player.displayName}
        {isMe && <em> (you)</em>}
      </span>
      <span className={`slot__ready ${player.isReady ? 'is-ready' : ''}`}>
        {player.isReady ? (
          <>
            <svg viewBox="0 0 24 24" width="11" height="11" fill="none" stroke="currentColor" strokeWidth="3.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M20 6 9 17l-5-5" />
            </svg>
            Ready
          </>
        ) : (
          'Not ready'
        )}
      </span>
    </div>
  )
}

function TeamPanel({ game, teamId }: { game: ClientState; teamId: TeamId }) {
  const members = game.players.filter((p) => p.teamId === teamId)
  const isFull = members.length >= 2
  const mine = game.players.find((p) => p.playerId === game.myPlayerId)
  const canJoin = !isFull && mine?.teamId !== teamId

  return (
    <div
      className={`teampanel teampanel--${teamId.toLowerCase()} ${
        mine?.teamId === teamId ? 'is-own' : ''
      } ${canJoin ? 'is-joinable' : ''}`}
      onClick={() => canJoin && actions.selectTeam(teamId)}
      role={canJoin ? 'button' : undefined}
      tabIndex={canJoin ? 0 : undefined}
      onKeyDown={(e) => {
        if (canJoin && (e.key === 'Enter' || e.key === ' ')) {
          e.preventDefault()
          actions.selectTeam(teamId)
        }
      }}
    >
      <h3 className="teampanel__name">Team {teamId}</h3>
      {[0, 1].map((slot) => (
        <Slot key={slot} player={members[slot]} isMe={members[slot]?.playerId === game.myPlayerId} />
      ))}
      {canJoin && <span className="teampanel__hint">Switch to this team</span>}
    </div>
  )
}

export function LobbyView({ game }: { game: ClientState }) {
  const { error } = useGameStore()
  const me = game.players.find((p) => p.playerId === game.myPlayerId)
  const readyCount = game.players.filter((p) => p.isReady).length
  const allReady = game.players.length === 4 && readyCount === 4

  return (
    <div className="lobby-live panel">
      <RoomCodeDisplay code={game.roomCode} />
      <p className="lobby-live__share">Share this code with three friends to fill the table.</p>

      <div className="lobby-live__teams">
        <TeamPanel game={game} teamId="A" />
        <div className="lobby-live__vs" aria-hidden="true">
          <Ornament size={26} />
          <span>vs</span>
        </div>
        <TeamPanel game={game} teamId="B" />
      </div>

      <div className="lobby-live__status">
        <span className={game.players.length === 4 ? 'is-done' : ''}>
          {game.players.length} / 4 joined
        </span>
        <span className={readyCount === 4 ? 'is-done' : ''}>{readyCount} / 4 ready</span>
      </div>

      {allReady ? (
        <p className="lobby-live__starting">
          <span className="spinner spinner--inline" /> Dealing the cards…
        </p>
      ) : (
        <button
          className={`btn ${me?.isReady ? 'btn-ghost' : 'btn-accent'} lobby-live__ready`}
          onClick={() => actions.toggleReady()}
        >
          {me?.isReady ? 'Wait — not ready' : "I'm ready"}
        </button>
      )}

      <p className="lobby-live__hint">
        {me?.isReady && !allReady
          ? 'The game starts the moment everyone is ready.'
          : 'Both teams need two players, and all four must be ready.'}
      </p>
      {error && <p className="home-panel__error">{error}</p>}
    </div>
  )
}
