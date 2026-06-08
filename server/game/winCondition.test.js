import { test } from 'node:test'
import assert from 'node:assert/strict'
import { TRICKS_TO_WIN, checkWinner } from './winCondition.js'

test('no winner before a team reaches 7 tricks', () => {
  assert.equal(checkWinner({ A: { tricks: 6 }, B: { tricks: 4 } }), null)
})

test('team A wins at 7 tricks', () => {
  assert.equal(checkWinner({ A: { tricks: 7 }, B: { tricks: 3 } }), 'A')
})

test('team B wins at 7 tricks', () => {
  assert.equal(checkWinner({ A: { tricks: 2 }, B: { tricks: 7 } }), 'B')
})

test('TRICKS_TO_WIN is 7', () => {
  assert.equal(TRICKS_TO_WIN, 7)
})
