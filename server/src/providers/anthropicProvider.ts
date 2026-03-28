import Anthropic from '@anthropic-ai/sdk'
import type { ModelProvider, ModelRequest } from './types'
import { parseJSONSafe } from './utils'

const DEFAULT_TIMEOUT_MS = 15_000

/**
 * Anthropic provider adapter.
 *
 * Default model: claude-3-5-haiku-20241022
 *   — Cost-effective, strong at structured JSON extraction and classification.
 *   — Used as PRIMARY for high-risk tasks: docType, billExtraction, eobExtraction, comparison.
 *
 * Reads ANTHROPIC_API_KEY from environment (via dotenv at server startup).
 * Throws in constructor if key is absent — caught by tryProvider() in routingConfig.
 */
export class AnthropicProvider implements ModelProvider {
  readonly name = 'anthropic'
  readonly model: string
  private client: Anthropic

  constructor(model = 'claude-3-5-haiku-20241022') {
    this.model = model
    // Anthropic constructor throws if ANTHROPIC_API_KEY is missing
    this.client = new Anthropic()
  }

  async generateJSON<T>(req: ModelRequest): Promise<T> {
    const timeout = req.timeoutMs ?? DEFAULT_TIMEOUT_MS

    const apiCall = async (): Promise<T> => {
      const response = await this.client.messages.create({
        model: this.model,
        max_tokens: req.maxTokens,
        temperature: req.temperature ?? 0,
        system: req.system,
        messages: [{ role: 'user', content: req.user }],
      })
      const raw =
        response.content[0]?.type === 'text' ? response.content[0].text : ''
      return parseJSONSafe<T>(raw, 'Anthropic')
    }

    return Promise.race([
      apiCall(),
      new Promise<never>((_, reject) =>
        setTimeout(
          () => reject(new Error(`AnthropicProvider timeout (${timeout}ms)`)),
          timeout,
        ),
      ),
    ])
  }
}
