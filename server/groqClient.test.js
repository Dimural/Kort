import { test } from 'node:test'
import assert from 'node:assert/strict'
import { createGroqClient } from './groqClient.js'

const hand = [
  { id: 'AS', suit: 'spades', rank: 'A', value: 14 },
  { id: 'KH', suit: 'hearts', rank: 'K', value: 13 },
]

test('createGroqClient returns null without an api key', () => {
  assert.equal(createGroqClient({ apiKey: '' }), null)
  assert.equal(createGroqClient({ apiKey: undefined }), null)
})

test('declareSuit parses the suit from a chat completion', async () => {
  const fetchImpl = async () => ({
    ok: true,
    json: async () => ({ choices: [{ message: { content: 'Clubs.' } }] }),
  })
  const client = createGroqClient({ apiKey: 'k', fetchImpl })
  const suit = await client.declareSuit({ hand })
  assert.equal(suit, 'clubs')
})

test('declareSuit throws on a non-ok response', async () => {
  const fetchImpl = async () => ({ ok: false, status: 500, json: async () => ({}) })
  const client = createGroqClient({ apiKey: 'k', fetchImpl })
  await assert.rejects(() => client.declareSuit({ hand }), /500/)
})

test('declareSuit throws when no suit is present in the reply', async () => {
  const fetchImpl = async () => ({
    ok: true,
    json: async () => ({ choices: [{ message: { content: 'banana' } }] }),
  })
  const client = createGroqClient({ apiKey: 'k', fetchImpl })
  await assert.rejects(() => client.declareSuit({ hand }), /suit/i)
})

test('declareSuit sends the api key and a model', async () => {
  let captured = null
  const fetchImpl = async (url, opts) => {
    captured = { url, opts }
    return { ok: true, json: async () => ({ choices: [{ message: { content: 'hearts' } }] }) }
  }
  const client = createGroqClient({ apiKey: 'secret', model: 'test-model', fetchImpl })
  await client.declareSuit({ hand })
  assert.match(captured.url, /groq\.com/)
  assert.equal(captured.opts.headers.Authorization, 'Bearer secret')
  assert.match(captured.opts.body, /test-model/)
})
