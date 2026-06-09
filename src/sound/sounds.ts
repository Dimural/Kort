/**
 * Tiny WebAudio sound kit — every cue is synthesized, no audio files.
 * Volumes are deliberately low; the game should murmur, not shout.
 * Muting is persisted so the choice survives refreshes.
 */

const MUTE_KEY = 'kort_muted'

let ctx: AudioContext | null = null
let muted = localStorage.getItem(MUTE_KEY) === '1'

function audio(): AudioContext | null {
  if (typeof AudioContext === 'undefined') return null
  if (!ctx) ctx = new AudioContext()
  if (ctx.state === 'suspended') void ctx.resume()
  return ctx
}

export function isMuted() {
  return muted
}

export function setMuted(value: boolean) {
  muted = value
  localStorage.setItem(MUTE_KEY, value ? '1' : '0')
}

/** One note: freq in Hz, start offset + duration in seconds. */
function note(
  ac: AudioContext,
  freq: number,
  at: number,
  dur: number,
  { type = 'triangle' as OscillatorType, peak = 0.12 } = {},
) {
  const osc = ac.createOscillator()
  const gain = ac.createGain()
  osc.type = type
  osc.frequency.value = freq
  const t = ac.currentTime + at
  gain.gain.setValueAtTime(0, t)
  gain.gain.linearRampToValueAtTime(peak, t + 0.012)
  gain.gain.exponentialRampToValueAtTime(0.0001, t + dur)
  osc.connect(gain).connect(ac.destination)
  osc.start(t)
  osc.stop(t + dur + 0.05)
}

/** Soft "card hits felt" snap: a short, dull thump. */
export function sndCardPlay() {
  if (muted) return
  const ac = audio()
  if (!ac) return
  note(ac, 190, 0, 0.07, { type: 'sine', peak: 0.18 })
  note(ac, 95, 0, 0.1, { type: 'sine', peak: 0.1 })
}

/** Gentle chime when it becomes your turn. */
export function sndYourTurn() {
  if (muted) return
  const ac = audio()
  if (!ac) return
  note(ac, 660, 0, 0.25, { peak: 0.07 })
}

/** Two rising notes when your team takes a trick. */
export function sndTrickWon() {
  if (muted) return
  const ac = audio()
  if (!ac) return
  note(ac, 523, 0, 0.16, { peak: 0.09 })
  note(ac, 784, 0.11, 0.22, { peak: 0.09 })
}

/** Low, short acknowledgement when the other team takes a trick. */
export function sndTrickLost() {
  if (muted) return
  const ac = audio()
  if (!ac) return
  note(ac, 233, 0, 0.18, { type: 'sine', peak: 0.06 })
}

/** Warm little fanfare for winning the game. */
export function sndGameWon() {
  if (muted) return
  const ac = audio()
  if (!ac) return
  const seq = [523, 659, 784, 1047]
  seq.forEach((f, i) => note(ac, f, i * 0.13, 0.3, { peak: 0.1 }))
}

/** Two falling notes for losing the game. */
export function sndGameLost() {
  if (muted) return
  const ac = audio()
  if (!ac) return
  note(ac, 392, 0, 0.25, { type: 'sine', peak: 0.07 })
  note(ac, 294, 0.18, 0.35, { type: 'sine', peak: 0.07 })
}
