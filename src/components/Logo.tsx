/**
 * Logo — the Kort wordmark (terracotta medallion + navy "Kort").
 * Uses the supplied logo artwork; `height` controls its rendered size.
 */
export function Logo({ height = 38 }: { height?: number }) {
  return (
    <img
      src="/assets/logo.png"
      alt="Kort"
      className="logo"
      style={{ height }}
    />
  )
}
