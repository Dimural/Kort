import { test } from 'node:test'
import assert from 'node:assert/strict'
import { RoomManager } from './roomManager.js'
import { startGame } from './gameManager.js'
import { createBotRunner } from './botDriver.js'

// A fake socket.io `io` that records emits and lets tests ignore them.
function fakeIo() {
  return { to: () => ({ emit: () => {} }) }
}

test('a full table of bots declares and plays a complete game', async () => {
  const rm = new RoomManager({ generateCode: () => 'ZZZZZZ' })
  // Build a 4-bot room: the host slot is converted to a bot, then 3 bots added.
  const { room } = rm.createRoom({ displayName: 'HostBot', socketId: null })
  room.players[0].isBot = true
  room.players[0].difficulty = 'easy'
  room.players[0].isReady = true
  rm.addBot('ZZZZZZ', 'B', 'easy')
  rm.addBot('ZZZZZZ', 'A', 'medium')
  rm.addBot('ZZZZZZ', 'B', 'hard')

  startGame(room, { rng: () => 0.4 }) // seats + deal + pick caller, phase='declare'

  let broadcasts = 0
  const runner = createBotRunner({
    io: fakeIo(),
    broadcastState: () => { broadcasts++ },
    groq: null, // hard bot declare falls back to heuristic
    delay: 0, // no waiting in tests
  })

  await new Promise((resolve) => {
    const done = () => {
      if (room.phase === 'end') resolve()
      else setTimeout(done, 5)
    }
    runner.run(room)
    done()
  })

  assert.equal(room.phase, 'end')
  const total = room.teams.A.tricks + room.teams.B.tricks
  // The game ends the moment a team reaches 7, so total tricks is 7..13.
  assert.ok(total >= 7 && total <= 13, `unexpected total tricks: ${total}`)
  assert.ok(room.teams.A.tricks >= 7 || room.teams.B.tricks >= 7)
  assert.ok(broadcasts > 0)
})
