import { useState } from 'react'

/**
 * AssetImage — renders an illustration from /public/assets/.
 * If the file is missing or fails to load, it falls back to a labeled,
 * theme-matched placeholder box so the layout still holds.
 *
 * `fit` controls object-fit: "contain" for artwork with transparent margins
 * (logos, framed boards, cutout illustrations), "cover" for full-bleed photos.
 */
type AssetImageProps = {
  src: string
  label: string
  className?: string
  fit?: 'cover' | 'contain'
}

export function AssetImage({ src, label, className = '', fit = 'cover' }: AssetImageProps) {
  const [failed, setFailed] = useState(false)

  if (failed) {
    return (
      <div className={`asset-ph asset-ph--empty ${className}`}>
        <span>
          {label}
          <br />/assets/{src}
        </span>
      </div>
    )
  }

  return (
    <div className={`asset-ph ${className}`}>
      <img
        src={`/assets/${src}`}
        alt={label}
        style={{ objectFit: fit }}
        onError={() => setFailed(true)}
      />
    </div>
  )
}
