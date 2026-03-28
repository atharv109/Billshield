import type { OcrOutput, EobExtractionOutput } from '../types/agentTypes'
import { routedCall, hasAnyLLMProvider } from '../routing/router'
import { detectNetworkStatus } from './deterministicRules'

const SYSTEM = `You are an EOB (Explanation of Benefits) data extractor. Extract structured fields from an insurance EOB document. Respond with JSON only. Use null for any field not found. Do not invent values.

Output schema:
{
  "insurer_name": string|null,
  "claim_number": string|null,
  "service_dates": string[],
  "billed_amount": number|null,
  "allowed_amount": number|null,
  "insurance_paid": number|null,
  "patient_responsibility": number|null,
  "deductible": number|null,
  "coinsurance": number|null,
  "copay": number|null,
  "network_status": "in_network|out_of_network|mixed|unclear",
  "confidence": number,
  "evidence": {
    "insurance_paid": [string],
    "patient_responsibility": [string]
  }
}

Rules:
- amounts as plain numbers (no $ or commas)
- confidence: 0.0–1.0
- evidence: short verbatim snippets backing the values
- do not include any field not in the schema`

export async function eobExtractionAgent(
  ocr: OcrOutput,
): Promise<EobExtractionOutput> {
  // ── Deterministic layer: network status detected before any LLM call ─────
  const networkStatus = detectNetworkStatus(ocr.raw_text)

  // ── Deterministic fallback: used when no LLM is available ────────────────
  const fallback: EobExtractionOutput = {
    doc_id: ocr.doc_id,
    insurer_name: null,
    claim_number: null,
    service_dates: ocr.dates_found.slice(0, 5),
    billed_amount:
      ocr.amounts_found.length > 0 ? Math.max(...ocr.amounts_found) : null,
    allowed_amount: null,
    insurance_paid: null,
    patient_responsibility: null,
    deductible: null,
    coinsurance: null,
    copay: null,
    network_status: networkStatus,
    confidence: 0.2,
    evidence: { insurance_paid: [], patient_responsibility: [] },
  }

  // ── Route to strong paid model (primary: Anthropic, fallback: OpenAI) ────
  if (!hasAnyLLMProvider('eobExtractionAgent')) return fallback

  try {
    const snippet = ocr.raw_text.slice(0, 3000)
    const { result, meta } = await routedCall<Omit<EobExtractionOutput, 'doc_id'>>(
      'eobExtractionAgent',
      SYSTEM,
      `Extract fields from this EOB document:\n\n${snippet}`,
      1024,
    )

    return {
      doc_id: ocr.doc_id,
      insurer_name: result.insurer_name ?? null,
      claim_number: result.claim_number ?? null,
      service_dates: Array.isArray(result.service_dates)
        ? result.service_dates
        : ocr.dates_found.slice(0, 5),
      billed_amount:
        typeof result.billed_amount === 'number'
          ? result.billed_amount
          : fallback.billed_amount,
      allowed_amount:
        typeof result.allowed_amount === 'number' ? result.allowed_amount : null,
      insurance_paid:
        typeof result.insurance_paid === 'number' ? result.insurance_paid : null,
      patient_responsibility:
        typeof result.patient_responsibility === 'number'
          ? result.patient_responsibility
          : null,
      deductible:
        typeof result.deductible === 'number' ? result.deductible : null,
      coinsurance:
        typeof result.coinsurance === 'number' ? result.coinsurance : null,
      copay: typeof result.copay === 'number' ? result.copay : null,
      network_status: (
        ['in_network', 'out_of_network', 'mixed', 'unclear'].includes(
          result.network_status,
        )
          ? result.network_status
          : networkStatus
      ) as EobExtractionOutput['network_status'],
      // Apply confidence penalty: reduces score when fallback provider was used.
      confidence:
        (typeof result.confidence === 'number' ? result.confidence : 0.5) *
        meta.confidencePenalty,
      evidence: {
        insurance_paid: Array.isArray(result.evidence?.insurance_paid)
          ? result.evidence.insurance_paid
          : [],
        patient_responsibility: Array.isArray(
          result.evidence?.patient_responsibility,
        )
          ? result.evidence.patient_responsibility
          : [],
      },
    }
  } catch {
    // All providers failed — return deterministic-only output
    return fallback
  }
}
