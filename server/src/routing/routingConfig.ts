/**
 * BillShield cost-aware model routing configuration.
 *
 * ╔══════════════════════════════════════════════════════════════════════════╗
 * ║  ROUTING POLICY                                                          ║
 * ║                                                                          ║
 * ║  DETERMINISTIC  →  NO model (math, regex, thresholds, scoring)           ║
 * ║  HIGH-RISK      →  Strong paid model first (extraction, classification)  ║
 * ║  LOW-RISK       →  Cheap/free model first (summary, action wording)      ║
 * ╚══════════════════════════════════════════════════════════════════════════╝
 *
 * Providers are initialised eagerly at module load time (after dotenv runs).
 * tryProvider() wraps construction so a missing API key returns null rather
 * than crashing the server. Null entries are filtered out by the router.
 *
 * To change routing for an agent, edit AGENT_ROUTING below — no agent logic
 * changes needed.
 */

import { AnthropicProvider } from '../providers/anthropicProvider'
import { OpenAIProvider } from '../providers/openaiProvider'
import { GeminiProvider } from '../providers/geminiProvider'
import { MiroFishProvider } from '../providers/mirofishProvider'
import type { ModelProvider } from '../providers/types'

// ── Agent name registry ───────────────────────────────────────────────────────

export type AgentName =
  | 'docTypeAgent'
  | 'billExtractionAgent'
  | 'eobExtractionAgent'
  | 'comparisonAgent'
  | 'summaryAgent'
  | 'actionAgent'

// ── Per-agent config ──────────────────────────────────────────────────────────

export interface AgentRoutingConfig {
  /**
   * Ordered provider list: primary first, fallbacks after.
   * Null entries (unconfigured providers) are skipped by the router.
   */
  providers: (ModelProvider | null)[]
  /**
   * Confidence penalty multipliers, indexed by fallback level.
   *   Index 0 → primary provider     (typically 1.0 = no penalty)
   *   Index 1 → first fallback       (e.g. 0.85)
   *   Index 2 → second fallback      (e.g. 0.80)
   * If fallbackLevel exceeds array length, the last value repeats.
   */
  confidencePenalties: number[]
  /** Timeout in milliseconds applied to each individual provider call. */
  timeoutMs: number
}

// ── Safe provider factory ─────────────────────────────────────────────────────

/**
 * Wraps provider construction in try/catch.
 * Returns null if the provider cannot be initialised (e.g. missing API key).
 * The router skips null providers and moves to the next in the chain.
 */
function tryProvider<T extends ModelProvider>(factory: () => T): T | null {
  try {
    return factory()
  } catch {
    return null
  }
}

// ── Provider instances (initialised once at server startup) ───────────────────

// HIGH-RISK tier: strong, reliable structured output
// Primary for extraction and classification agents
const strongPrimary = tryProvider(
  () => new AnthropicProvider('claude-3-5-haiku-20241022'),
)

// Strong fallback: same risk tier, different vendor
const strongFallback = tryProvider(() => new OpenAIProvider('gpt-4o-mini'))

// LOW-RISK tier: cheap/free provider for wording and drafting
// Primary for summary and action agents
const cheapPrimary = tryProvider(() => new MiroFishProvider())

// Mid-tier cheap: Gemini Flash — very cheap, used between MiroFish and paid Anthropic
const geminiMidTier = tryProvider(() => new GeminiProvider('gemini-1.5-flash'))

// ── Routing table ─────────────────────────────────────────────────────────────

export const AGENT_ROUTING: Record<AgentName, AgentRoutingConfig> = {
  /**
   * docTypeAgent
   * Risk: MEDIUM-HIGH — wrong classification routes bill/EOB to wrong extractor,
   *   breaking the entire pipeline output.
   * Routing: strong paid → strong paid fallback
   * No cheap-tier model: classification errors here have downstream cascade effects.
   */
  docTypeAgent: {
    providers: [strongPrimary, strongFallback],
    confidencePenalties: [1.0, 0.85],
    timeoutMs: 10_000,
  },

  /**
   * billExtractionAgent
   * Risk: HIGH — extracted amounts and dates are shown directly to the patient.
   *   Hallucinated numbers = wrong financial guidance.
   * Routing: strong paid → strong paid fallback
   */
  billExtractionAgent: {
    providers: [strongPrimary, strongFallback],
    confidencePenalties: [1.0, 0.85],
    timeoutMs: 15_000,
  },

  /**
   * eobExtractionAgent
   * Risk: HIGH — patient responsibility extracted here drives the "you may owe" figure.
   *   Hallucinated values = wrong financial guidance.
   * Routing: strong paid → strong paid fallback
   */
  eobExtractionAgent: {
    providers: [strongPrimary, strongFallback],
    confidencePenalties: [1.0, 0.85],
    timeoutMs: 15_000,
  },

  /**
   * comparisonAgent
   * Risk: MEDIUM-HIGH — LLM generates additional flags beyond deterministic rules.
   *   Bad flags = bad patient advice.
   *   Deterministic rules always run first; LLM adds cautious supplementary flags.
   * Routing: strong paid → strong paid fallback
   */
  comparisonAgent: {
    providers: [strongPrimary, strongFallback],
    confidencePenalties: [1.0, 0.85],
    timeoutMs: 12_000,
  },

  /**
   * summaryAgent
   * Risk: LOW — wording task only. Numbers come from already-extracted, validated data.
   *   The model cannot invent amounts here; it only rephrases what it receives.
   * Routing: cheap (MiroFish) → mid-tier cheap (Gemini) → strong paid (Anthropic)
   *   → template fallback (handled in agent itself, not the router)
   * Slight confidence penalty even on primary (0.9) to reflect that cheap model
   *   wording may be less precise; triggers needs_human_review sooner.
   */
  summaryAgent: {
    providers: [cheapPrimary, geminiMidTier, strongPrimary],
    confidencePenalties: [0.9, 0.85, 0.8],
    timeoutMs: 12_000,
  },

  /**
   * actionAgent
   * Risk: LOW — call script / email draft wording only. Targets provider or insurer
   *   based on the top flag, which is already determined upstream.
   * Routing: cheap (MiroFish) → mid-tier cheap (Gemini) → strong paid (Anthropic)
   *   → template fallback (handled in agent itself)
   */
  actionAgent: {
    providers: [cheapPrimary, geminiMidTier, strongPrimary],
    confidencePenalties: [0.9, 0.85, 0.8],
    timeoutMs: 12_000,
  },
}
