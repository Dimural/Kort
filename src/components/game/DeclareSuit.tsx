import { actions } from '../../store/gameStore'
import type { ClientState, Suit } from '../../game/types'

const SUITS: { suit: Suit; glyph: string; label: string }[] = [
  { suit: 'spades', glyph: '♠', label: 'Spades' },
  { suit: 'hearts', glyph: '♥', label: 'Hearts' },
  { suit: 'diamonds', glyph: '♦', label: 'Diamonds' },
  { suit: 'clubs', glyph: '♣', label: 'Clubs' },
]

export function DeclareSuit({ game }: { game: ClientState }) {
  const isCaller = game.gameCallerId === game.myPlayerId
  const caller = game.players.find((p) => p.playerId === game.gameCallerId)

  return (
    <div className="declare-overlay">
      <div className="declare panel">
        {isCaller ? (
          <>
            <h3 className="declare__title">Declare the game suit</h3>
            <div className="declare__suits">
              {SUITS.map((s) => (
                <button
                  key={s.suit}
                  className={`declare__suit declare__suit--${s.suit}`}
                  onClick={() => actions.declareSuit(s.suit)}
                >
                  <span className="declare__glyph">{s.glyph}</span>
                  <span>{s.label}</span>
                </button>
              ))}
            </div>
          </>
        ) : (
          <h3 className="declare__title">Waiting for {caller?.displayName ?? 'the caller'} to declare the game suit…</h3>
        )}
      </div>
    </div>
  )
}
