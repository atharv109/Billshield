/**
 * Routing evaluation hooks for BillShield's cost-aware model routing.
 *
 * Records routing events in an in-process ring buffer (max 1000 entries).
 * Data resets on server restart. For persistent evaluation, pipe events
 * to a file or external sink by extending recordRoutingEvent().
 *
 * Designed to answer:
 *   - What is the primary-success rate per provider?
 *   - How often does each agent fall back?
 *   - What fraction of calls are cheap vs paid?
 *   - What is average latency per agent / provider?
 *
 * Compare routing strategies by clearing events, running test cases, then
 * calling getRoutingReport() to inspect results.
 */

import type { RoutingMeta } from '../providers/types'

// ── Event record ──────────────────────────────────────────────────────────────

export interface RoutingEvent {
  agentName: string
  provider: string
  model: string
  fallbackLevel: number
  latencyMs: number
  confidencePenalty: number
  success: boolean
  timestamp: number
}

// ── Report shapes ─────────────────────────────────────────────────────────────

export interface AgentEvalStats {
  totalAttempts: number
  primarySuccesses: number
  fallbackSuccesses: number
  failures: number
  /** Fraction of successes that used a fallback provider. */
  fallbackRate: number
  avgLatencyMs: number
}

export interface ProviderEvalStats {
  totalAttempts: number
  successes: number
  failures: number
  successRate: number
  avgLatencyMs: number
}

export interface RoutingReport {
  totalEvents: number
  totalSuccesses: number
  totalFailures: number
  /** Fraction of successful calls that used a fallback (higher = more primary failures). */
  overallFallbackRate: number
  /** Count of successful calls routed to cheap providers (mirofish, gemini). */
  cheapCallCount: number
  /** Count of successful calls routed to paid providers (anthropic, openai). */
  paidCallCount: number
  /**
   * Human-readable cost profile string, e.g. "73% cheap, 27% paid".
   * Use this to track whether routing is meeting cost-reduction goals.
   */
  estimatedCostProfile: string
  byAgent: Record<string, AgentEvalStats>
  byProvider: Record<string, ProviderEvalStats>
}

// ── In-process ring buffer ────────────────────────────────────────────────────

const MAX_EVENTS = 1000
const events: RoutingEvent[] = []

/** Providers classified as cheap/free tier for cost profiling. */
const CHEAP_PROVIDERS = new Set(['mirofish', 'gemini'])

// ── Public API ────────────────────────────────────────────────────────────────

export function recordRoutingEvent(
  agentName: string,
  meta: Pick<
    RoutingMeta,
    'provider' | 'model' | 'fallbackLevel' | 'latencyMs' | 'confidencePenalty'
  >,
  success: boolean,
): void {
  events.push({
    agentName,
    provider: meta.provider,
    model: meta.model,
    fallbackLevel: meta.fallbackLevel,
    latencyMs: meta.latencyMs,
    confidencePenalty: meta.confidencePenalty,
    success,
    timestamp: Date.now(),
  })

  // Ring buffer: discard oldest when full
  if (events.length > MAX_EVENTS) {
    events.splice(0, events.length - MAX_EVENTS)
  }
}

export function getRoutingReport(): RoutingReport {
  const successEvents = events.filter((e) => e.success)
  const failureEvents = events.filter((e) => !e.success)
  const fallbackSuccesses = successEvents.filter((e) => e.fallbackLevel > 0)

  const overallFallbackRate =
    successEvents.length > 0
      ? fallbackSuccesses.length / successEvents.length
      : 0

  const cheapCallCount = successEvents.filter((e) =>
    CHEAP_PROVIDERS.has(e.provider),
  ).length
  const paidCallCount = successEvents.filter(
    (e) => !CHEAP_PROVIDERS.has(e.provider),
  ).length
  const totalCalls = cheapCallCount + paidCallCount

  const costProfile =
    totalCalls === 0
      ? 'no data yet'
      : `${Math.round((cheapCallCount / totalCalls) * 100)}% cheap, ` +
        `${Math.round((paidCallCount / totalCalls) * 100)}% paid`

  // ── Per-agent stats ──────────────────────────────────────────────────────
  const agentNames = [...new Set(events.map((e) => e.agentName))]
  const byAgent: Record<string, AgentEvalStats> = {}

  for (const agent of agentNames) {
    const ae = events.filter((e) => e.agentName === agent)
    const aeSuccess = ae.filter((e) => e.success)
    const aeFailure = ae.filter((e) => !e.success)
    const aeFallback = aeSuccess.filter((e) => e.fallbackLevel > 0)
    const avgLatency =
      aeSuccess.length > 0
        ? aeSuccess.reduce((s, e) => s + e.latencyMs, 0) / aeSuccess.length
        : 0

    byAgent[agent] = {
      totalAttempts: ae.length,
      primarySuccesses: aeSuccess.filter((e) => e.fallbackLevel === 0).length,
      fallbackSuccesses: aeFallback.length,
      failures: aeFailure.length,
      fallbackRate:
        aeSuccess.length > 0 ? aeFallback.length / aeSuccess.length : 0,
      avgLatencyMs: Math.round(avgLatency),
    }
  }

  // ── Per-provider stats ────────────────────────────────────────────────────
  const providerNames = [...new Set(events.map((e) => e.provider))]
  const byProvider: Record<string, ProviderEvalStats> = {}

  for (const provider of providerNames) {
    const pe = events.filter((e) => e.provider === provider)
    const peSuccess = pe.filter((e) => e.success)
    const avgLatency =
      peSuccess.length > 0
        ? peSuccess.reduce((s, e) => s + e.latencyMs, 0) / peSuccess.length
        : 0

    byProvider[provider] = {
      totalAttempts: pe.length,
      successes: peSuccess.length,
      failures: pe.filter((e) => !e.success).length,
      successRate: pe.length > 0 ? peSuccess.length / pe.length : 0,
      avgLatencyMs: Math.round(avgLatency),
    }
  }

  return {
    totalEvents: events.length,
    totalSuccesses: successEvents.length,
    totalFailures: failureEvents.length,
    overallFallbackRate: Math.round(overallFallbackRate * 100) / 100,
    cheapCallCount,
    paidCallCount,
    estimatedCostProfile: costProfile,
    byAgent,
    byProvider,
  }
}

/** Clears all recorded events. Useful for test isolation and eval comparisons. */
export function clearRoutingEvents(): void {
  events.splice(0, events.length)
}
