/**
 * BillShield model router.
 *
 * routedCall() is the single entry point for all agent LLM calls.
 * It:
 *   1. Looks up the agent's provider chain from AGENT_ROUTING.
 *   2. Tries each provider in order (primary → fallbacks).
 *   3. Records every attempt (success or failure) to routingEval.
 *   4. Returns the result paired with RoutingMeta so the agent can
 *      apply the correct confidence penalty.
 *   5. Throws only after ALL configured providers fail — the agent's
 *      catch block then returns its safe template fallback.
 *
 * No agent logic lives here. No prompts live here.
 * This file only owns: provider selection, fallback loop, eval recording.
 */

import { AGENT_ROUTING, type AgentName } from './routingConfig'
import { recordRoutingEvent } from '../eval/routingEval'
import type { ModelProvider, RoutedResult, RoutingMeta } from '../providers/types'

// ── Core routing function ─────────────────────────────────────────────────────

/**
 * Routes a JSON-generation request through the configured provider chain
 * for `agentName`, applying fallback automatically on any provider failure.
 *
 * Returns `{ result, meta }` where:
 *   - `result` is the parsed JSON from the model
 *   - `meta.confidencePenalty` is the multiplier agents should apply to
 *     any confidence value they return (1.0 for primary, < 1.0 for fallbacks)
 *
 * Throws if ALL providers fail. Callers should catch and use their template fallback.
 */
export async function routedCall<T>(
  agentName: AgentName,
  system: string,
  user: string,
  maxTokens: number,
): Promise<RoutedResult<T>> {
  const config = AGENT_ROUTING[agentName]

  // Filter out null (unconfigured) providers
  const providers = config.providers.filter(
    (p): p is ModelProvider => p !== null,
  )

  if (providers.length === 0) {
    throw new Error(
      `No LLM providers are configured for ${agentName}. ` +
        `Check that at least one API key is set in .env.`,
    )
  }

  let lastError: unknown

  for (let i = 0; i < providers.length; i++) {
    const provider = providers[i]
    // If fallbackLevel exceeds penalty array, repeat last penalty value
    const penaltyIdx = Math.min(i, config.confidencePenalties.length - 1)
    const confidencePenalty = config.confidencePenalties[penaltyIdx]
    const start = Date.now()

    try {
      const result = await provider.generateJSON<T>({
        system,
        user,
        maxTokens,
        temperature: 0,
        timeoutMs: config.timeoutMs,
      })

      const meta: RoutingMeta = {
        provider: provider.name,
        model: provider.model,
        fallbackLevel: i,
        latencyMs: Date.now() - start,
        confidencePenalty,
      }

      recordRoutingEvent(agentName, meta, true)
      return { result, meta }
    } catch (err) {
      lastError = err
      recordRoutingEvent(
        agentName,
        {
          provider: provider.name,
          model: provider.model,
          fallbackLevel: i,
          latencyMs: Date.now() - start,
          confidencePenalty,
        },
        false,
      )
      // Continue to next provider in chain
    }
  }

  throw new Error(
    `All ${providers.length} provider(s) failed for ${agentName}: ${String(lastError)}`,
  )
}

// ── Guard helpers used by agents ──────────────────────────────────────────────

/**
 * Returns true if at least one LLM provider is configured for this agent.
 * Agents call this instead of checking process.env.ANTHROPIC_API_KEY directly,
 * so routing is decoupled from any single vendor's key.
 */
export function hasAnyLLMProvider(agentName: AgentName): boolean {
  return AGENT_ROUTING[agentName].providers.some((p) => p !== null)
}

/**
 * Returns the confidence penalty for a given agent at a specific fallback level.
 * Useful when agents need to compute penalties for sub-items (e.g. per-flag
 * confidence in comparisonAgent) outside of the standard routedCall flow.
 */
export function getConfidencePenalty(
  agentName: AgentName,
  fallbackLevel: number,
): number {
  const penalties = AGENT_ROUTING[agentName].confidencePenalties
  return penalties[Math.min(fallbackLevel, penalties.length - 1)]
}
