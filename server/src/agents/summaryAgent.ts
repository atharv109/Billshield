import type {
  BillExtractionOutput,
  EobExtractionOutput,
  SummaryOutput,
} from '../types/agentTypes'
import { routedCall, hasAnyLLMProvider } from '../routing/router'

const SYSTEM = `You are a patient-facing medical billing explainer. Given structured data extracted from a bill and EOB, write a plain-English summary that helps the patient understand their situation.

Tone: calm, supportive, non-technical, clear.

Rules:
- Never give medical or legal advice
- Use cautious language: "based on the documents provided", "appears to show", "worth confirming"
- Do not invent numbers not present in the input
- List genuine uncertainties honestly

Output schema (JSON only):
{
  "summary": {
    "provider_billed": number|null,
    "insurance_paid": number|null,
    "you_may_owe": number|null,
    "plain_english_summary": string,
    "uncertainties": [string]
  },
  "confidence": number
}`

/**
 * Safe template fallback — used when all LLM providers fail.
 * Confidence is set to 0.35 to signal weak output to the scoring agent.
 * Numbers come from already-extracted data; only the wording is templated.
 */
function buildTemplateSummary(
  bill: BillExtractionOutput,
  eob: EobExtractionOutput,
): SummaryOutput {
  const providerBilled = bill.total_billed ?? eob.billed_amount
  const insurancePaid = eob.insurance_paid
  const youMayOwe = eob.patient_responsibility ?? bill.balance_due

  const parts: string[] = [
    'Based on the documents provided, we extracted billing information from your bill and insurance EOB.',
  ]
  if (providerBilled != null)
    parts.push(
      `The total billed amount appears to be $${providerBilled.toLocaleString()}.`,
    )
  if (insurancePaid != null)
    parts.push(
      `Your insurance appears to have paid $${insurancePaid.toLocaleString()}.`,
    )
  if (youMayOwe != null)
    parts.push(
      `Based on the EOB, your patient responsibility may be approximately $${youMayOwe.toLocaleString()}. ` +
        `Please confirm this amount with the relevant party before making payment.`,
    )

  parts.push('Please review the flags below for items that may require your attention.')

  const uncertainties: string[] =
    bill.confidence < 0.5 || eob.confidence < 0.5
      ? ['Some fields could not be clearly extracted from the uploaded documents.']
      : []

  return {
    summary: {
      provider_billed: providerBilled,
      insurance_paid: insurancePaid,
      you_may_owe: youMayOwe,
      plain_english_summary: parts.join(' '),
      uncertainties,
    },
    confidence: 0.35,
  }
}

export async function summaryAgent(
  bill: BillExtractionOutput,
  eob: EobExtractionOutput,
): Promise<SummaryOutput> {
  // ── No LLM configured — return template ──────────────────────────────────
  if (!hasAnyLLMProvider('summaryAgent')) return buildTemplateSummary(bill, eob)

  try {
    const input = {
      provider: bill.provider_name,
      insurer: eob.insurer_name,
      service_dates: [
        ...new Set([...bill.service_dates, ...eob.service_dates]),
      ].slice(0, 3),
      total_billed: bill.total_billed,
      allowed_amount: eob.allowed_amount,
      insurance_paid: eob.insurance_paid,
      patient_responsibility: eob.patient_responsibility,
      balance_due: bill.balance_due,
      deductible: eob.deductible,
      copay: eob.copay,
      coinsurance: eob.coinsurance,
      network_status: eob.network_status,
      bill_confidence: bill.confidence,
      eob_confidence: eob.confidence,
    }

    // ── Route: cheap/free primary (MiroFish) → Gemini → paid fallback (Anthropic)
    const { result, meta } = await routedCall<SummaryOutput>(
      'summaryAgent',
      SYSTEM,
      `Write a plain-English summary for this patient based on their bill and EOB data:\n\n${JSON.stringify(input, null, 2)}`,
      512,
    )

    const template = buildTemplateSummary(bill, eob)

    return {
      summary: {
        provider_billed:
          typeof result.summary?.provider_billed === 'number'
            ? result.summary.provider_billed
            : template.summary.provider_billed,
        insurance_paid:
          typeof result.summary?.insurance_paid === 'number'
            ? result.summary.insurance_paid
            : template.summary.insurance_paid,
        you_may_owe:
          typeof result.summary?.you_may_owe === 'number'
            ? result.summary.you_may_owe
            : template.summary.you_may_owe,
        plain_english_summary:
          typeof result.summary?.plain_english_summary === 'string' &&
          result.summary.plain_english_summary.length > 20
            ? result.summary.plain_english_summary
            : template.summary.plain_english_summary,
        uncertainties: Array.isArray(result.summary?.uncertainties)
          ? result.summary.uncertainties
          : template.summary.uncertainties,
      },
      // Apply routing confidence penalty.
      // summaryAgent primary (MiroFish) already carries a 0.9 penalty in config
      // to reflect that cheap wording may be less precise — this propagates to
      // summary_quality_score in scoringAgent.
      confidence:
        (typeof result.confidence === 'number' ? result.confidence : 0.6) *
        meta.confidencePenalty,
    }
  } catch {
    // All providers failed — return safe template with low confidence
    return buildTemplateSummary(bill, eob)
  }
}
