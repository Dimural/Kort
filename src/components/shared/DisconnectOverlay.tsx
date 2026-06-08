export function DisconnectOverlay({ name }: { name: string }) {
  return (
    <div className="modal-overlay modal-overlay--soft">
      <div className="modal panel">
        <div className="spinner" />
        <h2 className="modal__title">Waiting for {name} to reconnect…</h2>
        <p className="modal__sub">The game is paused.</p>
      </div>
    </div>
  )
}
