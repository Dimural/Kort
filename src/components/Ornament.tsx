/**
 * Ornament — the signature Kort medallion: an 8-petal Uyghur geometric
 * flower-star. Used in the logo, on card backs, and as decorative accents.
 * Color is driven by `color` (defaults to currentColor) so it can be tinted
 * gold on card backs, terracotta in the logo, etc.
 */
type OrnamentProps = {
  size?: number
  color?: string
  className?: string
}

export function Ornament({ size = 40, color = 'currentColor', className }: OrnamentProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 100 100"
      fill="none"
      className={className}
      aria-hidden="true"
    >
      <g stroke={color} strokeWidth="3" strokeLinejoin="round" strokeLinecap="round">
        {/* outer 8-pointed star (two overlaid squares) */}
        <path
          d="M50 6 L61 39 L94 50 L61 61 L50 94 L39 61 L6 50 L39 39 Z"
          fill={color}
          fillOpacity="0.14"
        />
        <path
          d="M50 18 L74 26 L82 50 L74 74 L50 82 L26 74 L18 50 L26 26 Z"
          fill="none"
        />
        {/* inner four-petal flower */}
        <path
          d="M50 30 C57 40 60 43 70 50 C60 57 57 60 50 70 C43 60 40 57 30 50 C40 43 43 40 50 30 Z"
          fill={color}
          fillOpacity="0.22"
        />
        <circle cx="50" cy="50" r="6" fill={color} fillOpacity="0.5" stroke="none" />
      </g>
    </svg>
  )
}
