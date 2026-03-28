import OpenAI from 'openai'
import type { ModelProvider, ModelRequest } from './types'
import { parseJSONSafe } from './utils'

const DEFAULT_TIMEOUT_MS = 12_000

/**
 * MiroFish provider adapter.
 *
 * MiroFish exposes an OpenAI-compatible chat completions endpoint.
 * It is used as the PRIMARY provider for low-risk, low-cost generation tasks:
 *   - summaryAgent (plain-English wording)
 *   - actionAgent  (call script / email draft)
 *
 * Configuration (all required for this provider to initialise):
 *   MIROFISH_API_KEY   — API key issued by MiroFish
 *   MIROFISH_BASE_URL  — Base URL, e.g. https://api.mirofish.ai/v1
 *   MIROFISH_MODEL     — Model name/id (optional, defaults to 'mirofish-default')
 *
 * JSON enforcement note:
 *   response_format is intentionally omitted because not all OpenAI-compatible
 *   endpoints support it. JSON output is enforced via an appended system-prompt
 *   instruction instead, and parsed with parseJSONSafe.
 *
 * If MIROFISH_API_KEY or MIROFISH_BASE_URL are not set, the constructor throws
 * and tryProvider() in routingConfig returns null, skipping this provider.
 */
export class MiroFishProvider implements ModelProvider {
  readonly name = 'mirofish'
  readonly model: string
  private client: OpenAI

  constructor() {
    const apiKey = process.env.MIROFISH_API_KEY
    const baseURL = process.env.MIROFISH_BASE_URL
    const model = process.env.MIROFISH_MODEL ?? 'mirofish-default'

    if (!apiKey) throw new Error('MIROFISH_API_KEY not set')
    if (!baseURL) throw new Error('MIROFISH_BASE_URL not set')

    this.model = model
    this.client = new OpenAI({ apiKey, baseURL })
  }

  async generateJSON<T>(req: ModelRequest): Promise<T> {
    const timeout = req.timeoutMs ?? DEFAULT_TIMEOUT_MS

    const apiCall = async (): Promise<T> => {
      // Append a hard JSON-only instruction since response_format is not used
      const systemWithJsonEnforcement =
        req.system + '\n\nIMPORTANT: Respond with valid JSON only. No markdown. No extra text.'

      const response = await this.client.chat.completions.create({
        model: this.model,
        max_tokens: req.maxTokens,
        temperature: req.temperature ?? 0,
        // response_format intentionally omitted for OpenAI-compatible compatibility
        messages: [
          { role: 'system', content: systemWithJsonEnforcement },
          { role: 'user', content: req.user },
        ],
      })

      const raw = response.choices[0]?.message?.content ?? ''
      return parseJSONSafe<T>(raw, 'MiroFish')
    }

    return Promise.race([
      apiCall(),
      new Promise<never>((_, reject) =>
        setTimeout(
          () => reject(new Error(`MiroFishProvider timeout (${timeout}ms)`)),
          timeout,
        ),
      ),
    ])
  }
}
