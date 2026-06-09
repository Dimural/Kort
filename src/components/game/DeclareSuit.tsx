import { actions } from '../../store/gameStore'
import type { ClientState, Suit } from '../../game/types'

const SUITS: { suit: Suit; glyph: string; label: string }[] = [
  { suit: 'spades', glyph: '♠', label: 'Spades' },
  { suit: 'hearts', glyph: '♥', label: 'Hearts' },
  { suit: 'diamonds', glyph: '♦', label: 'Diamonds' },
  { suit: 'clubs', glyph: '♣', label: 'Clubs' },
]

/**
 * Declare-phase panel. Docks above the player's hand instead of covering the
 * board, so the caller can study their first five cards while choosing.
 */
export function DeclareSuit({ game }: { game: ClientState }) {
  const isCaller = game.gameCallerId === game.myPlayerId
  const caller = game.players.find((p) => p.playerId === game.gameCallerId)

  return (
    <div className="declare-dock" role="dialog" aria-label="Game suit declaration">
      {isCaller ? (
        <>
          <h3 className="declare-dock__title">You call the game</h3>
          <p className="declare-dock__sub">
            Pick the game suit from your first five cards — it outranks every other suit.
          </p>
          <div className="declare-dock__suits">
            {SUITS.map((s) => (
              <button
                key={s.suit}
                className={`declare-dock__suit declare-dock__suit--${s.suit}`}
                onClick={() => actions.declareSuit(s.suit)}
              >
                <span className="declare-dock__glyph">{s.glyph}</span>
                <span>{s.label}</span>
              </button>
            ))}
          </div>
        </>
      ) : (
        <>
          <div className="spinner spinner--sm" />
          <h3 className="declare-dock__title">
            {caller?.displayName ?? 'The caller'} is calling the game
          </h3>
          <p className="declare-dock__sub">
            They choose the game suit from their first five cards. The rest of the deck is dealt
            once it's called.
          </p>
        </>
      )}
    </div>
  )
}
