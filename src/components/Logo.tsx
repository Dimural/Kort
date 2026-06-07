import { Ornament } from './Ornament'

/**
 * Logo — terracotta medallion + "Kort" wordmark in the display serif.
 * `tone` lets the footer render a navy/quiet variant if needed.
 */
export function Logo({ size = 34 }: { size?: number }) {
  return (
    <span className="logo">
      <Ornament size={size} color="var(--c-accent)" />
      <span className="logo__word">Kort</span>
    </span>
  )
}
