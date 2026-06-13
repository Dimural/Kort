# AI Bot Players — Design

**Date:** 2026-06-13
**Status:** Approved (pending spec review)

## Goal

Let people play Kort with AI bots, in any mix of humans and bots that fills the
4-seat / 2-team table: two humans vs. two bots, one human with a bot teammate
against two bot opponents, one human vs. three bots, etc. Bots must feel like
real players and must never stall the game.

Hard constraint: **the core game rules and the tested game logic in
`server/gameManager.js` and `server/game/**` are NOT modified.** Bots are driven
through the exact same flow functions humans use.

## Architecture: in-process virtual players

Bots are real entries in `room.players` with `isBot: true` and **no
`socketId`** — not external socket.io clients. This fits the codebase:

- `stateProjection`/`broadcastState` already skip players without a `socketId`,
  so bots never receive or break broadcasts.
- `disconnect` / `rejoin` handlers locate players *by socketId*, so bots are
  naturally untouched by connection lifecycle.
- `gameManager` flow functions (`startGame`, `declareGameSuit`, `playCard`,
  `resetForRematch`) are reused verbatim.

A server-side **bot driver** runs after each state change. If the player whose
turn it is (play phase), or the caller (declare phase), is a bot, it schedules
that bot's action after a short human-paced delay.

## Components

### Data model & RoomManager (`server/roomManager.js`)

Bot player shape:
```
{ playerId, isBot: true, socketId: null, displayName: <Uyghur name>,
  difficulty: 'easy' | 'medium' | 'hard', teamId, position: null,
  hand: [], isReady: true, isConnected: true }
```

New methods:
- `addBot(roomCode, teamId, difficulty)` — adds a bot to the given team if it has
  an open slot (respects `TEAM_SIZE`); auto-ready; assigns next free `playerId`.
  Picks an unused display name. Resets human ready flags? No — bots are always
  ready and adding a bot should not reset humans (it's an additive lobby action).
- `removeBot(roomCode, playerId)` — removes a bot by id (no-op if not a bot).

`canStart` is unchanged: 4 players, 2 per team, all ready — bots satisfy it.

### Socket events (`server/index.js`)

- `add_bot { teamId, difficulty }` — any human in the room may add a bot
  (host-only enforcement not needed for v1). Validates open slot, broadcasts,
  then `maybeStart` (in case the table is now full — though bots being ready
  plus humans ready will start it).
- `remove_bot { playerId }` — removes a bot, broadcasts.
- After every state change that can hand the turn to a bot (`maybeStart`,
  `declare_game_suit`, the play resolution, rematch reset), invoke the driver.

Refactor: extract the post-`playCard` broadcast/trick-emit/pause logic currently
inline in the `play_card` handler into a shared `resolvePlay(room, result)` so
both the human handler and the bot driver use identical resolution (including
`trick_complete` emit and `TRICK_PAUSE_MS`).

### Bot driver (`server/botDriver.js`)

`runBots(room, io, deps)` — inspects room, schedules at most one pending action
per bot per (phase, turn-key):

- **declare**, caller is bot → after delay, `chooseDeclareSuit` (async; may call
  Groq for Hard), then `declareGameSuit` + the same emits the socket handler does,
  then re-run driver.
- **play**, `currentTurn` is bot → after delay, `chooseCard` (sync heuristic),
  `playCard`, then `resolvePlay`, then re-run driver.
- **end** → each bot auto-votes `play_again` (so rematch isn't blocked).

A per-bot `pendingKey` guard (mirrors `dev-bots.js` `lastActionKey`) prevents
double-scheduling from racing broadcasts. Delay from `BOT_DELAY_MS` (~900ms).

### Bot strategy (`server/botStrategy.js`, pure)

One strong engine; difficulty modulates a **mistake rate**. A "mistake" is never
random — the engine ranks legal candidate moves by score and, on a mistake roll,
picks from a lower-but-reasonable tier (e.g., 2nd/3rd best), so every bot always
looks like it is playing a real game.

| Level | Behavior | Mistake rate | Declaration |
|-------|----------|--------------|-------------|
| Easy | Follows suit, sensible, but frequently passes up the best line; still coherent, clearly beatable | High (~50%) from reasonable alternatives | Heuristic |
| Medium | Plays correctly and well; decently challenging | Low (~12%) slight slips | Heuristic |
| Hard | Strongest line every time: partner-aware, tracks voids, holds high trumps, leads optimally | Zero | LLM (Groq) |

Card play stays deterministic-heuristic for ALL levels (including Hard) so Hard's
"zero mistakes" is guaranteed; an LLM could hallucinate illegal/weak moves. The
LLM is reserved for Hard's trump declaration, where open-ended judgment helps and
a poor call is recoverable.

Engine capabilities used by the scorer:
- Legal-move filtering via existing `isPlayable` logic (not duplicated — imported
  or mirrored from `trickLogic`).
- Win-cheaply: if the trick is winnable, play the lowest card that wins; else
  throw the lowest non-trump.
- Partner-awareness: if the partner currently wins the trick, don't overplay/trump
  it; throw low.
- Void tracking: from `trickHistory` + current trick, track which suits each
  opponent has shown out of, to inform leading.
- API: `chooseCard({ hand, currentTrick, gameSuit, players, trickHistory, me,
  difficulty, rng })` → cardId. `chooseDeclareSuit({ hand, difficulty, groq })`
  → suit (async).

Exports:
- `scoreCandidates(...)` → ranked legal moves (pure, testable)
- `chooseCard(...)`
- `chooseDeclareSuit(...)` (async)

### Groq client (`server/groqClient.js`)

- Reads `GROQ_API_KEY` (from `.env`, already gitignored). Model from `GROQ_MODEL`
  (sensible default). Uses `fetch` to Groq's OpenAI-compatible chat completions
  endpoint.
- `declareSuit({ hand })` builds a compact prompt (hand + rules summary), asks for
  a single suit, parses/validates it.
- Strict guard: timeout ~3s, any error / missing key / invalid suit → throws, and
  the caller falls back to the heuristic.
- Injectable for tests (no network in tests).

### Lobby UI (`src/components/lobby/LobbyView.tsx` + store/types)

- Each empty `Slot` renders a "+ Add bot" control with an Easy/Medium/Hard
  picker (per-bot difficulty).
- Bot slots show the bot name, a "BOT" badge, the difficulty, and a remove (×).
- `PlayerView` (types + `stateProjection`) gains `isBot: boolean` and
  `difficulty?: 'easy'|'medium'|'hard'` so the client can render bot slots.
- Store actions: `addBot(teamId, difficulty)`, `removeBot(playerId)`.

### Room lifecycle

- If a human disconnects/leaves and **zero humans remain** in the room, destroy
  the room (bots never keep a room alive). Applies in lobby (`removeBySocket`)
  and to the mid-game abandon path.

## Error handling & edge cases

- LLM failure (missing key, timeout, malformed, illegal suit) → heuristic
  declaration. Game never blocks.
- Double-action guard per bot per turn-key prevents double plays.
- All-humans-leave → room destroyed.
- Human reconnect/abandon logic is keyed on human sockets; unaffected by bots.
- Rematch: bots auto-vote `play_again`.

## Testing (`node --test`, repo style)

- `botStrategy.test.js` — legal selection, follow-suit, win-cheaply,
  partner-awareness (Hard never overtrumps a winning partner), void tracking,
  and Easy/Medium/Hard mistake rates land in expected bands over seeded trials.
- `botDriver.test.js` — bot caller declares and a full hand auto-plays to
  completion with no human, no double-plays.
- `integration.test.js` — extend: 1 human + 3 bots play to a winner, no hand
  leakage.
- `roomManager.test.js` — `addBot`/`removeBot`, team capacity, all-humans-leave
  cleanup.
- Groq client injected/mocked; tests never hit the network.

## Out of scope (YAGNI)

- LLM-driven card play.
- Bot chat / personalities beyond a display name.
- Persisting bot config across sessions.
- Mid-game add/remove of bots (lobby only).
