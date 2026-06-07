/**
 * Icon — a small, consistent line-icon set drawn in the Kort house style
 * (24px grid, 1.7 stroke, round joins, currentColor). Replaces emoji, which
 * render inconsistently across platforms and look templated. A few glyphs use
 * fills where the shape calls for it (social marks, play triangle, bolt).
 */
export type IconName =
  | 'users' | 'group' | 'user' | 'user-plus'
  | 'cards' | 'clock' | 'bolt' | 'book'
  | 'trophy' | 'gear' | 'play'
  | 'facebook' | 'instagram' | 'youtube'

const PATHS: Record<IconName, React.ReactNode> = {
  user: (
    <>
      <circle cx="12" cy="8.5" r="3.4" />
      <path d="M5.5 19.5a6.5 6.5 0 0 1 13 0" />
    </>
  ),
  users: (
    <>
      <circle cx="9" cy="8.6" r="3.1" />
      <path d="M3.4 19a5.6 5.6 0 0 1 11.2 0" />
      <path d="M15.6 5.8a3.1 3.1 0 0 1 0 5.7" />
      <path d="M17 13.4a5.6 5.6 0 0 1 3.6 5.6" />
    </>
  ),
  group: (
    <>
      <circle cx="12" cy="7" r="2.5" />
      <circle cx="6.3" cy="10" r="2.1" />
      <circle cx="17.7" cy="10" r="2.1" />
      <path d="M8.2 18.8a4 4 0 0 1 7.6 0" />
      <path d="M2.8 18.4a3.5 3.5 0 0 1 4-3.3" />
      <path d="M21.2 18.4a3.5 3.5 0 0 0-4-3.3" />
    </>
  ),
  'user-plus': (
    <>
      <circle cx="10" cy="8.5" r="3.2" />
      <path d="M4 19.5a6 6 0 0 1 12 0" />
      <path d="M18.5 8.5v5.5M15.75 11.25h5.5" />
    </>
  ),
  cards: (
    <>
      <rect x="5" y="7" width="8" height="11" rx="1.6" transform="rotate(-12 9 12.5)" />
      <rect x="11" y="6" width="8" height="11" rx="1.6" transform="rotate(9 15 11.5)" />
    </>
  ),
  clock: (
    <>
      <circle cx="12" cy="12" r="8" />
      <path d="M12 7.5v5l3.2 2" />
    </>
  ),
  bolt: <path d="M13 3 5.5 13H10l-1 8 8.5-11.5H13z" fill="currentColor" stroke="none" />,
  book: (
    <path d="M12 6.6C10.4 5.4 7.8 5.1 4.5 5.4v12.4C7.8 17.5 10.4 17.8 12 19m0-12.4c1.6-1.2 4.2-1.5 7.5-1.2v12.4c-3.3-.3-5.9 0-7.5 1.2m0-12.4V19" />
  ),
  trophy: (
    <>
      <path d="M7 4.5h10V8a5 5 0 0 1-10 0z" />
      <path d="M7 6H5a2 2 0 0 0 2 3.3" />
      <path d="M17 6h2a2 2 0 0 1-2 3.3" />
      <path d="M12 13v2.6" />
      <path d="M8.6 19.5h6.8l-.8-2.6H9.4z" />
    </>
  ),
  gear: (
    <>
      <circle cx="12" cy="12" r="3" />
      <path d="M12 3.6v2.1M12 18.3v2.1M5.5 5.5l1.5 1.5M17 17l1.5 1.5M3.6 12h2.1M18.3 12h2.1M5.5 18.5 7 17M17 7l1.5-1.5" />
    </>
  ),
  play: <path d="M8 6.4v11.2L17 12z" fill="currentColor" stroke="none" />,
  facebook: (
    <path
      d="M13.4 21v-7h2.3l.4-2.9h-2.7V9.2c0-.8.4-1.4 1.6-1.4h1.2V5.2C16.6 5.1 15.7 5 14.7 5c-2 0-3.4 1.3-3.4 3.6v2.5H8.9v2.9h2.4V21z"
      fill="currentColor"
      stroke="none"
    />
  ),
  instagram: (
    <>
      <rect x="4.5" y="4.5" width="15" height="15" rx="4.6" />
      <circle cx="12" cy="12" r="3.5" />
      <circle cx="16.4" cy="7.6" r="1" fill="currentColor" stroke="none" />
    </>
  ),
  youtube: (
    <>
      <rect x="3.5" y="6.5" width="17" height="11" rx="3.4" />
      <path d="M10.6 9.8v4.4L14.6 12z" fill="currentColor" stroke="none" />
    </>
  ),
}

type IconProps = {
  name: IconName
  size?: number
  className?: string
}

export function Icon({ name, size = 22, className }: IconProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.7"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-hidden="true"
    >
      {PATHS[name]}
    </svg>
  )
}
