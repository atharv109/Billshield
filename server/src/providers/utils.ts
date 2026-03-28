/**
 * Shared utility for all provider adapters.
 */

/**
 * Strip optional markdown code fences and parse the result as JSON.
 * Throws with a descriptive message if the string is empty or invalid JSON.
 */
export function parseJSONSafe<T>(raw: string, providerName = 'model'): T {
  const cleaned = raw
    .replace(/^```(?:json)?\s*/m, '')
    .replace(/\s*```\s*$/m, '')
    .trim()

  if (!cleaned) throw new Error(`Empty response from ${providerName}`)

  try {
    return JSON.parse(cleaned) as T
  } catch (e) {
    throw new Error(
      `${providerName} response is not valid JSON: ${String(e).slice(0, 120)}`,
    )
  }
}
