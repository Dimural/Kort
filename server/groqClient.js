// Minimal Groq (OpenAI-compatible) client used only for a Hard bot's trump call.
// Returns null when no API key is configured so callers fall back to heuristics.
const GROQ_URL = 'https://api.groq.com/openai/v1/chat/completions'
const DEFAULT_MODEL = 'llama-3.3-70b-versatile'
const SUITS = ['spades', 'hearts', 'diamonds', 'clubs']

export function createGroqClient({
  apiKey = process.env.GROQ_API_KEY,
  model = process.env.GROQ_MODEL || DEFAULT_MODEL,
  fetchImpl = globalThis.fetch,
  timeoutMs = 3000,
} = {}) {
  if (!apiKey) return null

  return {
    async declareSuit({ hand }) {
      const handStr = hand.map((c) => `${c.rank} of ${c.suit}`).join(', ')
      const messages = [
        {
          role: 'system',
          content:
            'You are an expert player of Kort, a Uyghur trick-taking card game. ' +
            'A team needs 7 of 13 tricks to win. The trump ("game") suit beats all ' +
            'other suits. Choose the trump suit that most likely wins your team the ' +
            'most tricks given the hand. Reply with exactly one word: ' +
            'spades, hearts, diamonds, or clubs.',
        },
        { role: 'user', content: `Your hand: ${handStr}. Which suit should be trump?` },
      ]

      const controller = new AbortController()
      const timer = setTimeout(() => controller.abort(), timeoutMs)
      try {
        const res = await fetchImpl(GROQ_URL, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${apiKey}`,
          },
          body: JSON.stringify({ model, messages, temperature: 0.3, max_tokens: 5 }),
          signal: controller.signal,
        })
        if (!res.ok) throw new Error(`Groq request failed: ${res.status}`)
        const data = await res.json()
        const text = (data?.choices?.[0]?.message?.content ?? '').toLowerCase()
        const suit = SUITS.find((s) => text.includes(s))
        if (!suit) throw new Error('No suit found in Groq response')
        return suit
      } finally {
        clearTimeout(timer)
      }
    },
  }
}
