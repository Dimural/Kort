import { actions, useGameStore } from '../../store/gameStore'
import { CardBack, CardFace, type Suit } from '../Card'
import { isPlayable } from '../../game/playable'
import type { ClientState, Position, PlayerView, TrickPlay } from '../../game/types'
import { DeclareSuit } from './DeclareSuit'
import { GameOverModal } from './GameOverModal'

const SUIT_GLYPH: Record<Suit, string> = { spades: '♠', hearts: '♥', diamonds: '♦', clubs: '♣' }

function GameSuitBadge({ suit }: { suit: Suit | null }) {
  if (!suit) return null
  const label = suit.charAt(0).toUpperCase() + suit.slice(1)
  return (
    <div className={`suitbadge suitbadge--${suit}`}>
      <span className="suitbadge__glyph">{SUIT_GLYPH[suit]}</span>
      <span>{label} is trump</span>
    </div>
  )
}

function OpponentSeat({ player, active }: { player: PlayerView; active: boolean }) {
  const pos = player.position as Position
  return (
    <div className={`seat seat--${pos} ${active ? 'is-active' : ''} ${!player.isConnected ? 'is-offline' : ''}`}>
      <div className="seat__label">
        {player.displayName} <span className="seat__count">{player.cardCount}</span>
      </div>
      <div className="seat__cards">
        {Array.from({ length: Math.min(player.cardCount, 8) }).map((_, i) => (
          <CardBack key={i} className="card--sm" />
        ))}
      </div>
    </div>
  )
}

function TrickArea({ game, plays }: { game: ClientState; plays: TrickPlay[] }) {
  const posOf = (playerId: number): Position =>
    (game.players.find((p) => p.playerId === playerId)?.position as Position) ?? 'bottom'
  return (
    <div className="trick">
      {plays.map((play) => (
        <div key={play.playerId} className={`trick__card trick__card--${posOf(play.playerId)}`}>
          <CardFace rank={play.card.rank} suit={play.card.suit} />
        </div>
      ))}
    </div>
  )
}

export function GameBoard({ game }: { game: ClientState }) {
  const { trickOverlay } = useGameStore()
  const opponents = game.players.filter((p) => p.playerId !== game.myPlayerId)
  const myTurn = game.currentTurn === game.myPlayerId
  const ledSuit = game.currentTrick?.ledSuit ?? null

  // During the post-trick pause, show all four cards from the overlay.
  const trickPlays = trickOverlay ? trickOverlay.plays : game.currentTrick?.plays ?? []

  const turnPlayer = game.players.find((p) => p.playerId === game.currentTurn)

  return (
    <div className="table-page">
      <button className="table-page__back btn btn-ghost btn--sm" onClick={() => actions.leaveRoom()}>
        ← Leave
      </button>

      <div className="board-hud">
        <GameSuitBadge suit={game.gameSuit} />
        <div className="trickcounters">
          <span className="trickcounter trickcounter--a">Team A {game.teams.A.tricks} / 7</span>
          <span className="trickcounter trickcounter--b">Team B {game.teams.B.tricks} / 7</span>
        </div>
      </div>

      {game.phase === 'play' && turnPlayer && (
        <div className="turn-banner">
          {myTurn ? 'Your turn' : `${turnPlayer.displayName}'s turn`}
        </div>
      )}

      <div className="felt">
        {opponents.map((p) => (
          <OpponentSeat key={p.playerId} player={p} active={game.currentTurn === p.playerId} />
        ))}

        <TrickArea game={game} plays={trickPlays} />

        {/* player's own hand */}
        <div className={`seat seat--bottom ${myTurn ? 'is-active' : ''}`}>
          {game.myHand.map((c, i) => {
            const rotate = (i - (game.myHand.length - 1) / 2) * 6
            const playable = myTurn && isPlayable(c, game.myHand, ledSuit, game.gameSuit)
            return (
              <div
                key={c.id}
                className={`hand-card ${myTurn && !playable ? 'is-dim' : ''} ${playable ? 'is-playable' : ''}`}
                onClick={() => playable && actions.playCard(c.id)}
              >
                <CardFace rank={c.rank} suit={c.suit} rotate={rotate} raise={playable} />
              </div>
            )
          })}
        </div>
      </div>

      {game.phase === 'declare' && <DeclareSuit game={game} />}
      {game.phase === 'end' && <GameOverModal game={game} />}
    </div>
  )
}
