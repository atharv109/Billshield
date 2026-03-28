/**
 * Provider abstraction for BillShield's cost-aware model routing layer.
 *
 * All LLM integrations implement ModelProvider.
 * No vendor-specific code should leak into agent logic.
 */

export interface ModelRequest {
  /** System / role prompt. Kept narrow and task-specific per agent. */
  system: string
  /** User message / data payload sent to the model. */
  user: string
  /** Maximum output tokens to generate. */
  maxTokens: number
  /**
   * Sampling temperature. Default 0 for deterministic structured output.
   * Use 0 for JSON extraction; small values (0.2–0.4) are acceptable for
   * summary/action wording.
   */
  temperature?: number
  /** Per-request timeout in milliseconds. Provider default is used if omitted. */
  timeoutMs?: number
}

/**
 * All provider adapters implement this interface.
 *
 * generateJSON parses the response as JSON and returns a typed result.
 * Throws on API error, timeout, or invalid/empty JSON.
 * Callers (the router) catch these throws and try the next fallback provider.
 */
export interface ModelProvider {
  /** Human-readable provider identifier (e.g. 'anthropic', 'openai', 'mirofish'). */
  readonly name: string
  /** Model identifier as passed to the provider API. */
  readonly model: string
  generateJSON<T>(request: ModelRequest): Promise<T>
}

/**
 * Metadata attached to every routed model response.
 * Agents use this to apply confidence penalties based on fallback level.
 */
export interface RoutingMeta {
  /** Provider that responded — may differ from primary if a fallback was used. */
  provider: string
  /** Model id that responded. */
  model: string
  /**
   * 0 = primary, 1 = first fallback, 2 = second fallback, etc.
   * Higher level = lower trust = stronger confidence penalty.
   */
  fallbackLevel: number
  /** Wall-clock ms from request dispatch to parsed response. */
  latencyMs: number
  /**
   * Confidence multiplier for outputs produced at this call.
   * 1.0 = primary succeeded (no reduction).
   * < 1.0 = a fallback was used; multiply agent confidence by this value.
   */
  confidencePenalty: number
}

export interface RoutedResult<T> {
  result: T
  meta: RoutingMeta
}
