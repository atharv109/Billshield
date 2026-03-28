import type { ModelProvider, ModelRequest } from './types'
import { parseJSONSafe } from './utils'

const GEMINI_API = 'https://generativelanguage.googleapis.com/v1beta/models'
const DEFAULT_TIMEOUT_MS = 15_000

interface GeminiCandidate {
  content?: { parts?: Array<{ text?: string }> }
  finishReason?: string
}

interface GeminiResponseBody {
  candidates?: GeminiCandidate[]
  error?: { message?: string; code?: number }
}

/**
 * Google Gemini provider adapter (fetch-based, no extra SDK required).
 *
 * Default model: gemini-1.5-flash
 *   — Very cheap ($0.075/1M input tokens), strong at structured output.
 *   — Used as cheap-tier fallback between MiroFish and paid Anthropic.
 *
 * Reads GEMINI_API_KEY from environment.
 * Throws in constructor if key is absent — caught by tryProvider() in routingConfig.
 * Uses responseMimeType: 'application/json' for native JSON mode.
 *
 * Requires Node 18+ global fetch (provided by @types/node ^22 in this project).
 */
export class GeminiProvider implements ModelProvider {
  readonly name = 'gemini'
  readonly model: string
  private apiKey: string

  constructor(model = 'gemini-1.5-flash') {
    const key = process.env.GEMINI_API_KEY
    if (!key) throw new Error('GEMINI_API_KEY not set')
    this.model = model
    this.apiKey = key
  }

  async generateJSON<T>(req: ModelRequest): Promise<T> {
    const timeout = req.timeoutMs ?? DEFAULT_TIMEOUT_MS
    const url = `${GEMINI_API}/${this.model}:generateContent?key=${this.apiKey}`
    const controller = new AbortController()
    const timer = setTimeout(() => controller.abort(), timeout)

    try {
      const body = {
        // System instruction goes at the top level for Gemini
        system_instruction: { parts: [{ text: req.system }] },
        contents: [{ role: 'user', parts: [{ text: req.user }] }],
        generationConfig: {
          maxOutputTokens: req.maxTokens,
          temperature: req.temperature ?? 0,
          // Native JSON mode — enforces well-formed JSON response
          responseMimeType: 'application/json',
        },
      }

      const resp = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
        signal: controller.signal,
      })

      if (!resp.ok) {
        const errText = await resp.text().catch(() => 'unknown error')
        throw new Error(`Gemini HTTP ${resp.status}: ${errText.slice(0, 200)}`)
      }

      const data = (await resp.json()) as GeminiResponseBody

      if (data.error) {
        throw new Error(`Gemini API error: ${data.error.message ?? data.error.code}`)
      }

      const raw = data.candidates?.[0]?.content?.parts?.[0]?.text ?? ''
      return parseJSONSafe<T>(raw, 'Gemini')
    } finally {
      clearTimeout(timer)
    }
  }
}
