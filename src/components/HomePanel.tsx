import { useState } from 'react'
import { actions, useGameStore } from '../store/gameStore'

export function HomePanel() {
  const { error, connected } = useGameStore()
  const [name, setName] = useState('')
  const [mode, setMode] = useState<'choose' | 'join'>('choose')
  const [code, setCode] = useState('')

  const displayName = name.trim() || 'Player'

  return (
    <div className="home-panel panel">
      <h2 className="home-panel__title">Kort</h2>
      <p className="home-panel__sub">Create a room, or join with a code.</p>

      <label className="field">
        <span className="field__label">Your name</span>
        <input
          className="field__input"
          value={name}
          maxLength={16}
          placeholder="Enter a display name"
          onChange={(e) => setName(e.target.value)}
        />
      </label>

      {mode === 'choose' ? (
        <div className="home-panel__actions">
          <button className="btn btn-blue" disabled={!connected} onClick={() => actions.createRoom(displayName)}>
            Create Game
          </button>
          <button className="btn btn-ghost" disabled={!connected} onClick={() => setMode('join')}>
            Join Game
          </button>
        </div>
      ) : (
        <div className="home-panel__join">
          <input
            className="field__input"
            value={code}
            placeholder="Room code"
            maxLength={6}
            onChange={(e) => setCode(e.target.value.toUpperCase())}
          />
          <div className="home-panel__actions">
            <button
              className="btn btn-blue"
              disabled={!connected || code.length < 4}
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

      {!connected && <p className="home-panel__status">Connecting to server…</p>}
      {error && <p className="home-panel__error">{error}</p>}
    </div>
  )
}
