import OpenAI from 'openai'
import type { ModelProvider, ModelRequest } from './types'
import { parseJSONSafe } from './utils'

const DEFAULT_TIMEOUT_MS = 15_000

/**
 * OpenAI provider adapter.
 *
 * Default model: gpt-4o-mini
 *   — Cost-effective, reliable JSON-object mode output.
 *   — Used as FALLBACK for high-risk tasks (docType, bill/EOB extraction, comparison).
 *   — Also used as final paid fallback for low-risk tasks (summary, action).
 *
 * Reads OPENAI_API_KEY from environment.
 * Throws in constructor if key is absent — caught by tryProvider() in routingConfig.
 *
 * Can also be pointed at any OpenAI-compatible endpoint by providing
 * `options.apiKey` and `options.baseURL` (used internally by MiroFishProvider).
 */
export class OpenAIProvider implements ModelProvider {
  readonly name = 'openai'
  readonly model: string
  protected client: OpenAI

  constructor(
    model = 'gpt-4o-mini',
    options?: { apiKey?: string; baseURL?: string },
  ) {
    this.model = model
    this.client = new OpenAI({
      apiKey: options?.apiKey,
      baseURL: options?.baseURL,
    })
  }

  async generateJSON<T>(req: ModelRequest): Promise<T> {
    const timeout = req.timeoutMs ?? DEFAULT_TIMEOUT_MS

    const apiCall = async (): Promise<T> => {
      const response = await this.client.chat.completions.create({
        model: this.model,
        max_tokens: req.maxTokens,
        temperature: req.temperature ?? 0,
        // json_object mode: model is required to emit valid JSON.
        // All agent system prompts include "Output schema (JSON only)" which satisfies
        // OpenAI's requirement that the word "json" appears in the messages.
        response_format: { type: 'json_object' },
        messages: [
          { role: 'system', content: req.system },
          { role: 'user', content: req.user },
        ],
      })
      const raw = response.choices[0]?.message?.content ?? ''
      return parseJSONSafe<T>(raw, 'OpenAI')
    }

    return Promise.race([
      apiCall(),
      new Promise<never>((_, reject) =>
        setTimeout(
          () => reject(new Error(`OpenAIProvider timeout (${timeout}ms)`)),
          timeout,
        ),
      ),
    ])
  }
}
