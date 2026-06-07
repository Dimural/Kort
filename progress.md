# Kort — Progress

A web app for **Kort**, a classic Uyghur 2v2 team card game. This pass builds
the **UI/theme only** to match the design mockup — no game logic, no backend yet.

## Stack

- **React 18 + Vite + TypeScript** (SPA). Chosen because the eventual online
  multiplayer is best served by a Vite frontend + a separate realtime WebSocket
  server (e.g. Node/Socket.IO or Colyseus) added later — not by SSR.
- **react-router-dom** for the four screens.
- Google Fonts: **Fraunces** (display serif, the "Kort" wordmark + headings) and
  **Inter** (body).

## Run it

```bash
npm install
npm run dev      # http://localhost:5173
npm run build    # type-check + production build (passes, strict mode)
```

## Screens (routes)

| Route          | Screen                     | Mockup quadrant |
| -------------- | -------------------------- | --------------- |
| `/`            | Landing page               | top-left        |
| `/play`        | Game table (4-player)      | top-right       |
| `/lobby`       | Lobby / game-mode select   | bottom-left     |
| `/leaderboard` | Leaderboard + invite banner| bottom-right    |

Screens are linked: top-nav + "Play Now" → lobby; "Find Match" → table; lobby
sidebar "Leaderboard" → leaderboard; etc.

## Theme

Central design tokens in [`src/styles/theme.css`](src/styles/theme.css):

- Surfaces: warm cream paper `#faf5ea`, with faint warm grain wash on `body`.
- Ink: deep navy `#173552` (headings, logo, nav).
- Accents: terracotta `#e0764f` (primary CTA), blue `#2f6f9e` (tabs / Find Match).
- Cards/board: teal felt `#5a86a2`, blue card backs `#3f6f8e`, gold ornament
  borders `#c7a567`. Lavender invite banner.

## Code-drawn vs. image assets

**Drawn in code (SVG/CSS) — no files needed:**

- The **Kort medallion** (8-petal Uyghur geometric star) — [`Ornament.tsx`](src/components/Ornament.tsx),
  reused in the logo, card backs, lobby "Classic" icon, and favicon.
- **Playing cards** — [`Card.tsx`](src/components/Card.tsx): `CardFace` (rank +
  suit, red/black) and `CardBack` (blue gold-bordered pattern). Used for the
  hand (A♠ K♦ Q♣ J♥ 10♠), the trick (9♥), and all face-down stacks.

**Real illustrations to be supplied** — drop into
[`public/assets/`](public/assets/) (see [its README](public/assets/README.md)).
Until a file exists, a labeled, theme-matched placeholder shows in its slot via
[`AssetImage.tsx`](src/components/AssetImage.tsx):

| File              | Slot                          |
| ----------------- | ----------------------------- |
| `hero-table.png`  | Landing hero board            |
| `landscape.png`   | Landing footer banner         |
| `players.png`     | Leaderboard invite banner     |
| `icon-teapot.png` | Lobby "Relaxed" mode icon     |

## File map

```
src/
  components/   Ornament, Logo, Card, AssetImage, TopNav
  pages/        LandingPage, GameTablePage, LobbyPage, LeaderboardPage
  styles/       theme.css (tokens), global.css (base+buttons),
                components.css (logo+cards), pages.css (per-page layout)
  App.tsx       routes
  main.tsx      entry
public/
  favicon.svg   ornament favicon
  assets/       drop real illustrations here
```

## Not done yet (intentional)

- No game logic, turns, dealing, scoring, or state.
- No backend / multiplayer / accounts. Nav links and tabs are visual only
  (mode select and leaderboard tabs toggle locally; others are inert).
- Real illustration files not included — placeholders stand in.

## Suggested next steps

1. Add the four illustration files to `public/assets/`.
2. Stand up the realtime backend (Socket.IO/Colyseus) + lobby/match state.
3. Wire game rules and the server-authoritative "see only your own cards" logic.
