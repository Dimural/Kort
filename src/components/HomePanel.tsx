import { useState } from 'react'
import { actions, useGameStore } from '../store/gameStore'
import { CardBack } from './Card'

const NAME_KEY = 'kort_name'

export function HomePanel() {
  const { error, connected } = useGameStore()
  const [name, setName] = useState(() => localStorage.getItem(NAME_KEY) ?? '')
  const [mode, setMode] = useState<'choose' | 'join'>('choose')
  const [code, setCode] = useState('')

  const displayName = name.trim() || 'Player'
  const rememberName = (value: string) => {
    setName(value)
    localStorage.setItem(NAME_KEY, value.trim())
  }

  return (
    <div className="home-panel panel">
      <div className="home-panel__fan" aria-hidden="true">
        <CardBack className="card--xs" rotate={-14} />
        <CardBack className="card--xs" rotate={0} />
        <CardBack className="card--xs" rotate={14} />
      </div>
      <h2 className="home-panel__title">Kort</h2>
      <p className="home-panel__sub">Four players, two teams — first to seven tricks.</p>

      <label className="field">
        <span className="field__label">Your name</span>
        <input
          className="field__input"
          value={name}
          maxLength={16}
          placeholder="Enter a display name"
          onChange={(e) => rememberName(e.target.value)}
        />
      </label>

      {mode === 'choose' ? (
        <div className="home-panel__actions">
          <button
            className="btn btn-accent"
            disabled={!connected}
            onClick={() => actions.createRoom(displayName)}
          >
            Create Game
          </button>
          <button className="btn btn-ghost" disabled={!connected} onClick={() => setMode('join')}>
            Join Game
          </button>
        </div>
      ) : (
        <div className="home-panel__join">
          <label className="field">
            <span className="field__label">Room code</span>
            <input
              className="field__input field__input--code"
              value={code}
              placeholder="ABC123"
              maxLength={6}
              autoFocus
              onChange={(e) => setCode(e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, ''))}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && connected && code.length === 6) {
                  actions.joinRoom(code, displayName)
                }
              }}
            />
          </label>
          <div className="home-panel__actions">
            <button
              className="btn btn-accent"
              disabled={!connected || code.length !== 6}
              onClick={() => actions.joinRoom(code, displayName)}
            >
              Join
            </button>
            <button className="btn btn-ghost" onClick={() => setMode('choose')}>
              Back
            </button>
          </div>
        </div>
      )}

      {!connected && (
        <p className="home-panel__status">
          <span className="condot" aria-hidden="true" />
          Connecting to server…
        </p>
      )}
      {error && <p className="home-panel__error">{error}</p>}
    </div>
  )
}
