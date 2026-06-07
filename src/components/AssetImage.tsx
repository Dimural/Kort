import { useState } from 'react'

/**
 * AssetImage — renders an illustration from /public/assets/.
 * Until the real file exists (or if it fails to load), it shows a labeled,
 * theme-matched placeholder box so the layout holds together. Drop the named
 * file into /public/assets/ and it appears automatically.
 *
 * The expected filenames are documented in progress.md.
 */
type AssetImageProps = {
  /** filename inside /public/assets/, e.g. "hero-table.png" */
  src: string
  /** human label shown on the placeholder + used as alt text */
  label: string
  className?: string
}

export function AssetImage({ src, label, className = '' }: AssetImageProps) {
  const [failed, setFailed] = useState(false)
  return (
    <div className={`asset-ph ${className}`}>
      {!failed && (
        <img
          src={`/assets/${src}`}
          alt={label}
          onError={() => setFailed(true)}
        />
      )}
      {failed && (
        <span>
          {label}
          <br />/assets/{src}
        </span>
      )}
    </div>
  )
}
