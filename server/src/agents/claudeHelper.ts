import Anthropic from '@anthropic-ai/sdk'

const _client = new Anthropic()

/**
 * Call Claude with a narrow system + user prompt, expecting JSON back.
 * Strips markdown code fences if present.
 */
export async function callClaude<T>(
  systemPrompt: string,
  userMessage: string,
  maxTokens = 1024,
): Promise<T> {
  const response = await _client.messages.create({
    model: 'claude-sonnet-4-6',
    max_tokens: maxTokens,
    system: systemPrompt,
    messages: [{ role: 'user', content: userMessage }],
  })

  const raw = response.content[0].type === 'text' ? response.content[0].text : ''
  const cleaned = raw
    .replace(/^```(?:json)?\s*/m, '')
    .replace(/\s*```\s*$/m, '')
    .trim()

  return JSON.parse(cleaned) as T
}

export { _client as anthropicClient }
