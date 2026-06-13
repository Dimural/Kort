import { useState } from 'react'
import { actions, useGameStore } from '../../store/gameStore'
import type { ClientState, Difficulty, PlayerView, TeamId } from '../../game/types'
import { RoomCodeDisplay } from '../shared/RoomCodeDisplay'
import { Ornament } from '../Ornament'

const DIFFICULTIES: Difficulty[] = ['easy', 'medium', 'hard']
const DIFF_LABEL: Record<Difficulty, string> = { easy: 'Easy', medium: 'Medium', hard: 'Hard' }

function AddBotSlot({ teamId }: { teamId: TeamId }) {
  const [difficulty, setDifficulty] = useState<Difficulty>('medium')
  return (
    <div className="slot is-empty slot--addbot">
      <div className="slot__addbot-row">
        <select
          className="slot__diff"
          value={difficulty}
          onChange={(e) => setDifficulty(e.target.value as Difficulty)}
          aria-label="Bot difficulty"
        >
          {DIFFICULTIES.map((d) => (
            <option key={d} value={d}>
              {DIFF_LABEL[d]}
            </option>
          ))}
        </select>
        <button
          type="button"
          className="slot__addbot-btn"
          onClick={() => actions.addBot(teamId, difficulty)}
        >
          + Add bot
        </button>
      </div>
    </div>
  )
}

function Slot({ player, isMe }: { player: PlayerView; isMe: boolean }) {
  return (
    <div className={`slot is-taken ${isMe ? 'is-me' : ''} ${player.isBot ? 'slot--bot' : ''}`}>
      <span className="slot__avatar" aria-hidden="true">
        {player.displayName.charAt(0).toUpperCase()}
      </span>
      <span className="slot__name">
        {player.displayName}
        {isMe && <em> (you)</em>}
        {player.isBot && (
          <span className="slot__botbadge">BOT · {DIFF_LABEL[player.difficulty ?? 'medium']}</span>
        )}
      </span>
      {player.isBot ? (
        <button
          type="button"
          className="slot__remove"
          aria-label={`Remove ${player.displayName}`}
          onClick={() => actions.removeBot(player.playerId)}
        >
          ✕
        </button>
      ) : (
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
      )}
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
    >
      <h3 className="teampanel__name">Team {teamId}</h3>
      {[0, 1].map((slot) => {
        const member = members[slot]
        if (member) {
          return <Slot key={slot} player={member} isMe={member.playerId === game.myPlayerId} />
        }
        return <AddBotSlot key={slot} teamId={teamId} />
      })}
      {canJoin && (
        <button
          type="button"
          className="teampanel__switch"
          onClick={() => actions.selectTeam(teamId)}
        >
          Switch to this team
        </button>
      )}
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
