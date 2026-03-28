import type {
  BillExtractionOutput,
  EobExtractionOutput,
  SummaryOutput,
} from '../types/agentTypes'
import { callClaude } from './claudeHelper'

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

export async function summaryAgent(
  bill: BillExtractionOutput,
  eob: EobExtractionOutput,
): Promise<SummaryOutput> {
  const fallback: SummaryOutput = {
    summary: {
      provider_billed: bill.total_billed ?? eob.billed_amount,
      insurance_paid: eob.insurance_paid,
      you_may_owe: eob.patient_responsibility ?? bill.balance_due,
      plain_english_summary:
        'Based on the documents provided, we extracted billing information from your bill and insurance EOB. Please review the flags below for items that may require your attention.',
      uncertainties:
        bill.confidence < 0.5 || eob.confidence < 0.5
          ? ['Some fields could not be clearly extracted from the uploaded documents.']
          : [],
    },
    confidence: 0.4,
  }

  if (!process.env.ANTHROPIC_API_KEY) return fallback

  try {
    const input = {
      provider: bill.provider_name,
      insurer: eob.insurer_name,
      service_dates: [...new Set([...bill.service_dates, ...eob.service_dates])].slice(0, 3),
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

    const result = await callClaude<SummaryOutput>(
      SYSTEM,
      `Write a plain-English summary for this patient based on their bill and EOB data:\n\n${JSON.stringify(input, null, 2)}`,
      512,
    )

    return {
      summary: {
        provider_billed:
          typeof result.summary?.provider_billed === 'number'
            ? result.summary.provider_billed
            : fallback.summary.provider_billed,
        insurance_paid:
          typeof result.summary?.insurance_paid === 'number'
            ? result.summary.insurance_paid
            : fallback.summary.insurance_paid,
        you_may_owe:
          typeof result.summary?.you_may_owe === 'number'
            ? result.summary.you_may_owe
            : fallback.summary.you_may_owe,
        plain_english_summary:
          typeof result.summary?.plain_english_summary === 'string'
            ? result.summary.plain_english_summary
            : fallback.summary.plain_english_summary,
        uncertainties: Array.isArray(result.summary?.uncertainties)
          ? result.summary.uncertainties
          : fallback.summary.uncertainties,
      },
      confidence: typeof result.confidence === 'number' ? result.confidence : 0.6,
    }
  } catch {
    return fallback
  }
}
