# KORT — AI Agent Build Specification

## Agent Instructions

You are being asked to build a fully functional digital implementation of **Kort**, a 2v2 trick-taking card game. A rough frontend UI structure already exists — **work with it, preserve its layout and component structure where possible, and extend or adjust it only where the game logic requires**. Do not rebuild the UI from scratch. Integrate game logic, state management, and any missing UI components into what is already there.

The game is **real-time multiplayer**. Up to 4 human players join a shared room using a code. The server is the single source of truth for all game state. Each client receives only the information they are permitted to see — most critically, a player's hand is **never sent to any other client**.

---

## 1. Game Overview

Kort is a 2v2 trick-taking card game played with a standard 52-card deck (no jokers). Teams of two sit opposite each other. A "game suit" (trump suit) is declared at the start and holds special power throughout the round. The first team to win **7 hands (tricks)** wins the game.

---

## 2. Players & Teams

- **4 players total**, all human in a full multiplayer room
- **2 teams of 2**
  - Team A: Player at bottom + Player at top — sitting opposite each other
  - Team B: Player at left + Player at right — sitting opposite each other
- Play proceeds **clockwise**: bottom → left → top → right → repeat
- Players **cannot see each other's cards** — enforced both by game rules and by the server (cards are never broadcast to other players)
- Players **cannot communicate** card information to their teammate through the game interface
- Each client always renders **themselves at the bottom**; the other three players are arranged clockwise around the table from their perspective

---

## 3. Room & Lobby System

### 3.1 Creating a Game

1. A player visits the app and clicks **"Create Game"**
2. The server generates a unique **6-character alphanumeric room code** (e.g. `K4RT29`)
3. The host is taken to the **lobby screen** and is assigned a slot
4. The room code is displayed prominently with a **copy button** so the host can share it

### 3.2 Joining a Game

1. A player clicks **"Join Game"** and is prompted to enter a room code
2. The server validates the code:
   - If valid and room has fewer than 4 players → player joins the lobby
   - If invalid or room is full → show an appropriate error message
3. The joining player is taken to the **lobby screen**

### 3.3 Lobby Screen

The lobby is shown to all players before the game starts. It must display:

- The **room code** at the top (always visible for sharing)
- **Two team columns**: Team A and Team B, each with 2 slots
- Each connected player appears as a **name card** in a slot
- Players can **click a team** to move themselves to an available slot on that team
- A player's own slot is highlighted; others are shown as taken
- A **"Ready" button** for each player — togglable, shows green when ready
- A **player count indicator**: e.g. `3 / 4 players joined`
- The host sees a note that the game starts automatically when all 4 players are ready

### 3.4 Game Start Conditions

The game starts automatically when **all of the following are true**:
- All 4 player slots are filled (2 per team, both teams have exactly 2 players)
- All 4 players have pressed **Ready**

If a player leaves the lobby before the game starts, their slot opens back up and all Ready states reset.

### 3.5 Room State Model

```json
{
  "roomCode": "K4RT29",
  "phase": "lobby | game | end",
  "players": [
    {
      "socketId": "abc123",
      "playerId": 0,
      "displayName": "Alice",
      "teamId": "A",
      "position": "bottom | left | top | right",
      "isReady": false,
      "isConnected": true
    }
  ],
  "teams": {
    "A": { "playerIds": [0, 2] },
    "B": { "playerIds": [1, 3] }
  }
}
```

---

## 4. Card Structure

### Deck
- 52 cards, no jokers
- 4 suits: `spades`, `hearts`, `diamonds`, `clubs`
- 13 ranks per suit: `2, 3, 4, 5, 6, 7, 8, 9, 10, J, Q, K, A`

### Card Object
```json
{
  "id": "AS",
  "suit": "spades",
  "rank": "A",
  "value": 14
}
```

### Rank-to-Value Mapping
| Rank | Value |
|------|-------|
| 2    | 2     |
| 3    | 3     |
| 4    | 4     |
| 5    | 5     |
| 6    | 6     |
| 7    | 7     |
| 8    | 8     |
| 9    | 9     |
| 10   | 10    |
| J    | 11    |
| Q    | 12    |
| K    | 13    |
| A    | 14    |

---

## 5. Game Flow — Step by Step

### Phase 1: Initial Deal
1. Shuffle the full 52-card deck **server-side** using a Fisher-Yates shuffle
2. Deal **5 cards** to each player (20 cards total dealt, 32 remaining)
3. The server sends each player **only their own 5 cards** — no other player's cards are ever transmitted to a client
4. Randomly select one player as the **"game caller"**

### Phase 2: Game Suit Declaration
1. The server notifies all clients who the game caller is
2. The game caller's client displays a **suit picker UI** (4 suit options)
3. The game caller selects a suit and submits it to the server
4. The server broadcasts the declared **game suit** to all clients
5. Once declared, the game suit is fixed for the entire round

### Phase 3: Remaining Deal
1. The server deals the remaining 32 cards **4 at a time** to each player in clockwise order
2. Each batch of 4 is sent **only to the receiving player**
3. Each player ends up with exactly **13 cards total**
4. The server confirms to all clients that dealing is complete (without revealing hands)

### Phase 4: Gameplay (Tricks)
1. The game caller leads the first trick
2. The server enforces turn order — only the active player's client can submit a card play
3. Each trick resolves server-side; the result is broadcast to all clients
4. The trick winner leads the next trick
5. First team to reach **7 tricks wins** — the server detects this and ends the game immediately

---

## 6. Core Trick Logic

### Leading a Trick
- The lead player may play **any card** from their hand
- The suit of that card becomes the **"led suit"** for the trick

### Following a Trick
Each subsequent player (clockwise) must follow these rules **in order**:

#### Rule 1 — Must follow suit
If the player has **one or more cards matching the led suit**, they **must play one of those cards**. They cannot play any other suit, including the game suit.

#### Rule 2 — Cannot follow suit
If the player has **no cards matching the led suit**, they have two options:
- **Option A — Cut:** Play a card of the **game suit**. This can win the trick.
- **Option B — Discard:** Play **any card**. This card is dead — it cannot win under any circumstances.

> **Important:** Even if a player cannot follow suit but holds game suit cards, they are **not forced to cut**. Choosing to discard a game suit card is a valid and legal strategic play.

#### Special Case — Game Suit Led
If the lead card is a game suit card, all others must follow with game suit cards if they have them. Players with no game suit cards may discard freely (those discards cannot win).

---

## 7. Trick Resolution

### Determining the Winner
Evaluate all 4 cards played:

1. **If any game suit cards were played** → highest-value game suit card wins
2. **If no game suit cards were played** → highest-value card of the led suit wins
3. Discarded cards (wrong suit, not game suit) are never considered for winning

### Trick Ownership
- The winning **team** claims the trick (trick counts are per team, not per player)
- The **individual player** who played the winning card leads the next trick
- Track: `teamA_tricks` and `teamB_tricks`

---

## 8. Win Condition

- First team to accumulate **7 tricks** wins
- Checked by the server after every trick resolution
- Since there are 13 tricks total, a tie is mathematically impossible
- On win: server sets game phase to `end`, broadcasts the winning team and final scores to all clients

---

## 9. Server-Side Game State

The server holds the **full authoritative game state**, including all hands. Clients only hold their own hand and the public game state.

### Full Server State
```json
{
  "roomCode": "K4RT29",
  "phase": "lobby | deal | declare | play | end",
  "gameSuit": "spades | hearts | diamonds | clubs | null",
  "gameCallerId": 0,
  "currentLeaderId": 0,
  "currentTurn": 0,
  "currentTrick": {
    "ledSuit": "spades | null",
    "ledByPlayerId": 0,
    "plays": [
      { "playerId": 0, "card": { "id": "AS", "suit": "spades", "rank": "A", "value": 14 } }
    ]
  },
  "players": [
    {
      "playerId": 0,
      "socketId": "abc123",
      "displayName": "Alice",
      "teamId": "A",
      "position": "bottom",
      "hand": [],
      "isConnected": true
    }
  ],
  "teams": {
    "A": { "playerIds": [0, 2], "tricks": 0 },
    "B": { "playerIds": [1, 3], "tricks": 0 }
  },
  "trickHistory": [],
  "winner": null
}
```

### Client-Side State (what each client receives)
```json
{
  "roomCode": "K4RT29",
  "phase": "play",
  "gameSuit": "spades",
  "gameCallerId": 0,
  "currentTurn": 0,
  "currentTrick": {
    "ledSuit": "spades",
    "ledByPlayerId": 0,
    "plays": [
      { "playerId": 0, "card": { "id": "AS", "suit": "spades", "rank": "A", "value": 14 } }
    ]
  },
  "myHand": [],
  "players": [
    { "playerId": 0, "displayName": "Alice", "teamId": "A", "position": "bottom", "cardCount": 13, "isConnected": true }
  ],
  "teams": {
    "A": { "tricks": 0 },
    "B": { "tricks": 0 }
  },
  "winner": null
}
```

> Note: `myHand` contains only the requesting client's cards. Other players are represented by `cardCount` only (no card data). The server **never sends a player's hand to any other socket**.

---

## 10. Real-Time Communication (WebSocket Events)

Use **Socket.io** (or equivalent WebSocket library). All game state changes are driven by server events.

### Client → Server Events

| Event | Payload | Description |
|---|---|---|
| `create_room` | `{ displayName }` | Host creates a new room |
| `join_room` | `{ roomCode, displayName }` | Player joins an existing room |
| `select_team` | `{ teamId }` | Player selects or switches team in lobby |
| `player_ready` | `{}` | Player toggles ready state |
| `declare_game_suit` | `{ suit }` | Game caller declares the trump suit |
| `play_card` | `{ cardId }` | Active player plays a card |
| `play_again` | `{}` | Player votes to restart after game ends |

### Server → Client Events

| Event | Payload | Description |
|---|---|---|
| `room_created` | `{ roomCode, playerId }` | Confirms room creation, sends code |
| `room_joined` | `{ roomCode, playerId }` | Confirms successful join |
| `lobby_update` | `{ players, teams }` | Broadcast on any lobby change |
| `game_starting` | `{ countdown }` | All players ready; game about to begin |
| `hand_dealt` | `{ cards }` | Sends a player their own cards only |
| `game_caller_selected` | `{ playerId }` | Announces who must declare game suit |
| `game_suit_declared` | `{ suit }` | Broadcasts declared trump to all |
| `deal_complete` | `{}` | All cards distributed, game begins |
| `turn_update` | `{ currentTurn, currentTrick }` | Whose turn it is, current trick state |
| `card_played` | `{ playerId, card, currentTrick }` | A card was played; broadcast to all |
| `trick_complete` | `{ winnerId, winnerTeam, teamTricks, nextLeaderId }` | Trick resolved |
| `game_over` | `{ winnerTeam, teamTricks }` | Game ended, winning team declared |
| `player_disconnected` | `{ playerId, displayName }` | A player lost connection |
| `player_reconnected` | `{ playerId, displayName }` | A player reconnected |
| `error` | `{ message }` | Invalid action (e.g. playing out of turn) |

---

## 11. Card Playability Validation

Validation must be enforced **server-side**. Client-side validation is optional (for UX only — dimming unplayable cards) but the server must reject illegal plays.

```
function isPlayable(card, playerHand, ledSuit, gameSuit):

  // Player is leading — any card is valid
  if ledSuit is null:
    return true

  // Player has cards of the led suit — must play one
  playerHasLedSuit = playerHand contains any card where card.suit == ledSuit
  if playerHasLedSuit:
    return card.suit == ledSuit

  // Player has no led suit cards — any card is valid (cut or discard)
  return true
```

If a client submits an illegal play, the server emits an `error` event back to that client only and does not advance game state.

---

## 12. Trick Winner Evaluation

```
function evaluateTrickWinner(plays, ledSuit, gameSuit):

  gameSuitPlays = plays where play.card.suit == gameSuit

  if gameSuitPlays is not empty:
    return play with highest value among gameSuitPlays

  ledSuitPlays = plays where play.card.suit == ledSuit
  return play with highest value among ledSuitPlays
```

---

## 13. Player Perspective (Rendering)

Each client always renders **themselves at the bottom** of the table. The other three players are arranged clockwise:

```
          [Teammate — top]
[Opponent — left]    [Opponent — right]
          [Self — bottom]
```

The server assigns each player an absolute `position` (bottom/left/top/right) from the perspective of that specific client. This mapping is computed when the game starts based on seating order and sent as part of the initial game state to each client individually.

### What each position shows:
- **Bottom (self):** Cards face-up, interactive, playable cards highlighted
- **Left, Top, Right (others):** Cards face-down, showing only card backs and count
- **All positions:** Show the card played in the current trick as it happens (face-up for all)

---

## 14. Disconnection Handling

### Mid-Lobby Disconnect
- Remove the player from their slot
- Reset all Ready states
- Broadcast `lobby_update` to remaining players

### Mid-Game Disconnect
- Mark the player as `isConnected: false` in server state
- Pause the game (do not auto-advance turns)
- Display a visible **"Waiting for [Name] to reconnect..."** overlay to all clients
- Hold the game state for a configurable timeout (suggested: **60 seconds**)
- If the player reconnects within the timeout:
  - Reattach their socket to the existing game state
  - Emit their current hand and full public game state to them
  - Resume the game
- If the timeout expires without reconnect:
  - End the game and notify all clients with a disconnection message

### Reconnection Flow
1. Client attempts to rejoin with their `roomCode` and a stored `playerId` / session token
2. Server matches them to the existing room
3. Server emits their hand (`hand_dealt`) and the current public game state (`turn_update`)
4. Game resumes from exactly where it left off

---

## 15. UI Components Required

Work with the existing frontend. The following must be present and functional — add or adjust as needed.

### Home Screen
- **"Create Game"** button → generates room code, goes to lobby
- **"Join Game"** button → prompts for room code input, goes to lobby

### Lobby Screen
- Room code displayed prominently with a **copy to clipboard** button
- Two team panels (Team A, Team B), each with 2 player slots
- Joined players shown with their name; empty slots shown as "Waiting..."
- Each player can click a team panel to join that team (if a slot is open)
- **Ready button** per player (only affects own state)
- **Status bar**: `X / 4 players ready` — updates in real time
- If a team is full (2 players), its join button is disabled for others

### Game Board
- Central play area: 4 card slots (one per player position) showing the current trick
- **Game suit indicator**: always-visible suit icon + label (e.g. "♠ Spades is trump")
- **Trick counters**: Team A: X / 7 and Team B: X / 7
- Player name labels at each position around the table
- Card count badge on each opponent's hand (e.g. "11 cards")

### Player Hand (Bottom)
- Cards rendered face-up, interactable
- Unplayable cards dimmed during the player's turn
- Playable cards highlighted/elevated on hover
- Cards are not interactive when it is not this player's turn

### Turn Indicator
- Highlight the active player's area (glow, label, or border)
- Show a subtle **turn timer** if desired (optional but good UX)

### Game Suit Declaration UI
- Shown only to the game caller during the declare phase
- Four suit buttons (♠ ♥ ♦ ♣) with clear labels
- Other players see: "Waiting for [Name] to declare the game suit..."

### End of Trick
- All 4 played cards remain visible for ~1.5–2 seconds before clearing
- Winning team's trick counter animates upward
- Brief label: "[Name]'s team wins the trick"

### End of Game
- Full-screen or modal overlay: "[Team] wins! X – Y"
- "Play Again" button (requires all 4 players to confirm, or host can trigger a rematch)

### Disconnection Overlay
- Shown over the game board when a player is disconnected mid-game
- Message: "Waiting for [Name] to reconnect..."
- Dismisses automatically when they reconnect or game is abandoned

---

## 16. Edge Cases & Rules Clarifications

| Scenario | Rule |
|---|---|
| Player leads with a game suit card | All others must follow with game suit cards if they have them |
| Two players on opposing teams both play game suit cards | Highest game suit card wins |
| Two players on the same team both play game suit cards | Highest game suit card wins; both go to that team's trick count |
| Player has only game suit cards and cannot follow led suit | They may cut OR discard a game suit card — free choice |
| Player has no led suit AND no game suit cards | Must discard any card; it cannot win |
| Team reaches 7 tricks before all 13 are played | Game ends immediately; remaining tricks not played |
| Player plays out of turn (server-side) | Server rejects the action and emits an error back to that client |
| Room code entered is invalid or room is full | Show error, do not navigate to lobby |
| Player tries to join a game already in progress | Disallow — rooms are only joinable during lobby phase |
| All 4 players press "Play Again" | Server resets game state, keeps same room and teams, starts a new round |
| Jokers | Not used. Remove from deck entirely before shuffling. |

---

## 17. Suggested Tech Stack

| Layer | Recommendation |
|---|---|
| Realtime | Socket.io (server + client) |
| Backend | Node.js + Express |
| Frontend | Existing stack (React or equivalent) |
| State (server) | In-memory room map (can add Redis for persistence/scaling later) |
| State (client) | Zustand, Redux, or Context — whichever exists already |
| Room codes | `nanoid` or custom alphanumeric generator (6 chars, uppercase) |
| Shuffle | Fisher-Yates, server-side only |
| Session persistence | Store `playerId` + `roomCode` in `sessionStorage` for reconnection |

---

## 18. File / Module Structure (Suggested)

```
/server
  index.js               — Express + Socket.io setup
  roomManager.js         — Create/join/destroy rooms, lobby state
  gameManager.js         — Game flow orchestration (deal, declare, play, resolve)
  /game
    deck.js              — Card definitions, Fisher-Yates shuffle, deal logic
    trickLogic.js        — Playability validation, trick winner evaluation
    winCondition.js      — Trick counting, win detection
  stateProjection.js     — Strips server state down to per-client safe projection

/src (frontend — extend existing structure)
  /components            — Existing UI components (extend, do not replace)
    /lobby               — LobbyScreen, TeamPanel, PlayerSlot, ReadyButton
    /game                — GameBoard, PlayerHand, TrickArea, GameSuitBadge
    /shared              — RoomCodeDisplay, DisconnectOverlay, GameOverModal
  /socket                — Socket.io client setup, event listeners, emitters
  /store                 — Game state (extend existing store)
  /assets
    /cards               — Card face images or SVG suit components
```

---

*End of Specification*
