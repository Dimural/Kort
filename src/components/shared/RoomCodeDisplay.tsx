import { useState } from 'react'

export function RoomCodeDisplay({ code }: { code: string }) {
  const [copied, setCopied] = useState(false)
  const copy = async () => {
    try {
      await navigator.clipboard.writeText(code)
      setCopied(true)
      setTimeout(() => setCopied(false), 1500)
    } catch {
      /* clipboard may be unavailable; ignore */
    }
  }
  return (
    <div className="roomcode">
      <span className="roomcode__label">Room Code</span>
      <button className="roomcode__value" onClick={copy} title="Copy to clipboard">
        <span>{code}</span>
        <span className="roomcode__copy">{copied ? 'Copied!' : 'Copy'}</span>
      </button>
    </div>
  )
}
