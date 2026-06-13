// Drives in-process bot players. After each state change the server calls
// runner.run(room); if it is a bot's turn (or a bot is the caller, or the game
// is over) the bot's action is scheduled after a short delay using the same
// gameManager flow functions humans use.
import { declareGameSuit, playCard } from './gameManager.js'
import { chooseCard, chooseDeclareSuit } from './botStrategy.js'

const DEFAULT_DELAY = Number(process.env.BOT_DELAY_MS ?? 900)

export function createBotRunner({
  io,
  broadcastState,
  resolvePlay,
  castRematchVote,
  groq = null,
  delay = DEFAULT_DELAY,
}) {
  const pending = new Set() // dedupe keys so racing run() calls schedule once

  // Continuation model: a bot action is scheduled by run(). After the action,
  // the NEXT bot is triggered by whichever helper handles the resulting state
  // change — NOT by an unconditional re-run. This matters for trick completion:
  // the production resolvePlay defers its broadcast + botRunner.run by
  // TRICK_PAUSE_MS so the finished trick lingers before a bot leads the next one.
  // In production, resolvePlay/castRematchVote (passed in) call botRunner.run.
  // For unit tests that don't wire them, the defaults below chain run() directly.
  const doResolvePlay = resolvePlay ?? ((room) => { broadcastState(room); run(room) })
  const doRematchVote =
    castRematchVote ??
    ((room, playerId) => {
      room._rematchVotes = room._rematchVotes || new Set()
      room._rematchVotes.add(playerId)
      broadcastState(room)
      run(room)
    })

  function nextBotActor(room) {
    if (!room) return null
    if (room.phase === 'declare') {
      const caller = room.players.find((p) => p.playerId === room.gameCallerId)
      return caller && caller.isBot ? caller : null
    }
    if (room.phase === 'play') {
      const turn = room.players.find((p) => p.playerId === room.currentTurn)
      return turn && turn.isBot ? turn : null
    }
    if (room.phase === 'end') {
      const voted = room._rematchVotes || new Set()
      return room.players.find((p) => p.isBot && !voted.has(p.playerId)) ?? null
    }
    return null
  }

  function actionKey(room, bot) {
    if (room.phase === 'declare') return `${room.roomCode}:declare:${bot.playerId}`
    if (room.phase === 'play') {
      const tricks = room.teams.A.tricks + room.teams.B.tricks
      const inTrick = room.currentTrick?.plays?.length ?? 0
      return `${room.roomCode}:play:${tricks}:${inTrick}:${bot.playerId}`
    }
    return `${room.roomCode}:end:${bot.playerId}`
  }

  async function act(room, bot) {
    if (room.phase === 'declare' && room.gameCallerId === bot.playerId) {
      const suit = await chooseDeclareSuit({ hand: bot.hand, difficulty: bot.difficulty, groq })
      declareGameSuit(room, bot.playerId, suit)
      io.to(room.roomCode).emit('game_suit_declared', { suit })
      io.to(room.roomCode).emit('deal_complete', {})
      broadcastState(room)
      run(room) // caller now leads; if that's a bot, schedule its play
    } else if (room.phase === 'play' && room.currentTurn === bot.playerId) {
      const cardId = chooseCard({
        hand: bot.hand,
        currentTrick: room.currentTrick,
        gameSuit: room.gameSuit,
        players: room.players,
        me: bot,
        difficulty: bot.difficulty,
      })
      const result = playCard(room, bot.playerId, cardId)
      doResolvePlay(room, result)
    } else if (room.phase === 'end') {
      doRematchVote(room, bot.playerId)
    }
  }

  function run(room) {
    const bot = nextBotActor(room)
    if (!bot) return
    const key = actionKey(room, bot)
    if (pending.has(key)) return
    pending.add(key)
    setTimeout(async () => {
      pending.delete(key)
      try {
        await act(room, bot)
        // act() triggers the next bot via the resolve/declare/rematch path.
      } catch {
        // Bot errors must never crash the server; drop this action. A later
        // human action or state change will re-kick run() if needed.
      }
    }, delay)
  }

  return { run }
}
