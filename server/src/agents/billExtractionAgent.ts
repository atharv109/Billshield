import type { OcrOutput, BillExtractionOutput } from '../types/agentTypes'
import { routedCall, hasAnyLLMProvider } from '../routing/router'

const SYSTEM = `You are a bill data extractor. Extract structured fields from a medical bill. Respond with JSON only. Use null for any field not found in the text. Do not invent values.

Output schema:
{
  "provider_name": string|null,
  "statement_date": string|null,
  "service_dates": string[],
  "total_billed": number|null,
  "balance_due": number|null,
  "patient_name": string|null,
  "account_number": string|null,
  "line_items": [{ "date": string|null, "description": string|null, "amount": number|null, "code": string|null }],
  "confidence": number,
  "evidence": {
    "total_billed": [string],
    "balance_due": [string]
  }
}

Rules:
- amounts as plain numbers (no $ or commas)
- confidence: 0.0–1.0 based on how complete and clear the extraction is
- evidence: include short verbatim text snippets that back the values
- line_items: max 20 items
- do not include any field not in the schema`

export async function billExtractionAgent(
  ocr: OcrOutput,
): Promise<BillExtractionOutput> {
  // ── Deterministic fallback: used when no LLM is available ────────────────
  // Confidence 0.2 — regex amounts are a rough proxy, not reliable extraction.
  const fallback: BillExtractionOutput = {
    doc_id: ocr.doc_id,
    provider_name: null,
    statement_date: null,
    service_dates: ocr.dates_found.slice(0, 5),
    total_billed:
      ocr.amounts_found.length > 0 ? Math.max(...ocr.amounts_found) : null,
    balance_due: null,
    patient_name: null,
    account_number: null,
    line_items: [],
    confidence: 0.2,
    evidence: { total_billed: [], balance_due: [] },
  }

  // ── Route to strong paid model (primary: Anthropic, fallback: OpenAI) ────
  if (!hasAnyLLMProvider('billExtractionAgent')) return fallback

  try {
    // Send first 3000 chars — covers key fields while keeping token cost tight
    const snippet = ocr.raw_text.slice(0, 3000)
    const { result, meta } = await routedCall<Omit<BillExtractionOutput, 'doc_id'>>(
      'billExtractionAgent',
      SYSTEM,
      `Extract fields from this medical bill:\n\n${snippet}`,
      1024,
    )

    return {
      doc_id: ocr.doc_id,
      provider_name: result.provider_name ?? null,
      statement_date: result.statement_date ?? null,
      service_dates: Array.isArray(result.service_dates)
        ? result.service_dates
        : ocr.dates_found.slice(0, 5),
      total_billed:
        typeof result.total_billed === 'number'
          ? result.total_billed
          : fallback.total_billed,
      balance_due:
        typeof result.balance_due === 'number' ? result.balance_due : null,
      patient_name: result.patient_name ?? null,
      account_number: result.account_number ?? null,
      line_items: Array.isArray(result.line_items)
        ? result.line_items.slice(0, 20)
        : [],
      // Apply confidence penalty: reduces score when fallback provider was used,
      // which propagates to scoringAgent and may trigger needs_human_review.
      confidence:
        (typeof result.confidence === 'number' ? result.confidence : 0.5) *
        meta.confidencePenalty,
      evidence: {
        total_billed: Array.isArray(result.evidence?.total_billed)
          ? result.evidence.total_billed
          : [],
        balance_due: Array.isArray(result.evidence?.balance_due)
          ? result.evidence.balance_due
          : [],
      },
    }
  } catch {
    // All providers failed — return deterministic-only output
    return fallback
  }
}
