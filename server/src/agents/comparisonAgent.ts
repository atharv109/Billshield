import type {
  BillExtractionOutput,
  EobExtractionOutput,
  ComparisonOutput,
  Flag,
  FlagType,
  Severity,
} from '../types/agentTypes'
import { amountMismatch, balanceInconsistent, detectDuplicates } from './deterministicRules'
import { routedCall, hasAnyLLMProvider } from '../routing/router'

const SYSTEM = `You are a medical billing comparison agent. Given structured fields extracted from a bill and an EOB, generate 3–5 cautious review flags where something may warrant the patient's attention.

You MUST:
- Use cautious language: "may require review", "appears inconsistent", "worth confirming", "based on the documents provided"
- Never accuse anyone of fraud or wrongdoing
- Never give medical or legal advice
- Return null instead of inventing values
- Base every flag on specific evidence from the input data

Output schema (JSON only):
{
  "flags": [
    {
      "flag_type": "amount_mismatch|duplicate_charge|unclear_balance|missing_adjustment|network_inconsistency|responsibility_unclear|date_service_mismatch",
      "title": string,
      "explanation": string,
      "why_it_matters": string,
      "contact_target": "provider|insurer",
      "severity": "low|medium|high",
      "confidence": number,
      "evidence": [string]
    }
  ]
}

Maximum 5 flags. Rank most important first.`

function buildDeterministicFlags(
  bill: BillExtractionOutput,
  eob: EobExtractionOutput,
): Flag[] {
  const flags: Flag[] = []

  // 1. Amount mismatch
  if (amountMismatch(bill.total_billed, eob.billed_amount)) {
    const diff = Math.abs((bill.total_billed ?? 0) - (eob.billed_amount ?? 0))
    flags.push({
      flag_type: 'amount_mismatch',
      title: 'Billed amounts may not match',
      explanation: `Your bill shows $${bill.total_billed?.toLocaleString()} but the EOB shows $${eob.billed_amount?.toLocaleString()} as the billed amount. This difference of $${diff.toFixed(2)} may require review.`,
      why_it_matters: 'When the billed amount on your bill differs from the EOB, it may indicate a data entry error, a missing charge, or a timing difference worth confirming with the provider.',
      contact_target: 'provider',
      severity: diff > 200 ? 'high' : 'medium',
      confidence: 0.85,
      evidence: [
        bill.total_billed != null ? `Bill total billed: $${bill.total_billed}` : '',
        eob.billed_amount != null ? `EOB billed amount: $${eob.billed_amount}` : '',
      ].filter(Boolean),
    })
  }

  // 2. Balance inconsistency
  if (balanceInconsistent(eob.insurance_paid, eob.patient_responsibility, eob.billed_amount)) {
    flags.push({
      flag_type: 'unclear_balance',
      title: 'Patient responsibility amount appears inconsistent',
      explanation: `Based on the EOB, insurance paid $${eob.insurance_paid?.toLocaleString()} and your responsibility is listed as $${eob.patient_responsibility?.toLocaleString()}, but these do not clearly add up to the billed amount of $${eob.billed_amount?.toLocaleString()}. This may be worth confirming.`,
      why_it_matters: 'An unclear balance may mean adjustments, write-offs, or coordination of benefits are not fully explained. It is worth asking your insurer for a detailed breakdown.',
      contact_target: 'insurer',
      severity: 'medium',
      confidence: 0.8,
      evidence: [
        `Insurance paid: $${eob.insurance_paid}`,
        `Patient responsibility: $${eob.patient_responsibility}`,
        `EOB billed: $${eob.billed_amount}`,
      ],
    })
  }

  // 3. Duplicate line items
  if (bill.line_items && bill.line_items.length > 0) {
    const dupes = detectDuplicates(bill.line_items)
    if (dupes.length > 0) {
      const [i, j] = dupes[0]
      const item = bill.line_items[i]
      flags.push({
        flag_type: 'duplicate_charge',
        title: 'Possible duplicate charge on bill',
        explanation: `The charge "${item.description ?? item.code}" ($${item.amount}) appears more than once on your bill. This may be a duplicate entry worth reviewing.`,
        why_it_matters: 'Duplicate charges are one of the most common billing errors. If the same service was billed twice, you may only be responsible for one occurrence.',
        contact_target: 'provider',
        severity: 'high',
        confidence: 0.9,
        evidence: [
          `Line ${i + 1}: ${item.code ?? ''} ${item.description ?? ''} $${item.amount}`,
          `Line ${j + 1}: ${bill.line_items[j].code ?? ''} ${bill.line_items[j].description ?? ''} $${bill.line_items[j].amount}`,
        ],
      })
    }
  }

  // 4. Out-of-network flag
  if (eob.network_status === 'out_of_network' || eob.network_status === 'mixed') {
    flags.push({
      flag_type: 'network_inconsistency',
      title: 'Out-of-network indicator found in EOB',
      explanation: `Your EOB contains out-of-network language, which may mean one or more providers were not in your insurance plan's network. This can result in higher patient costs.`,
      why_it_matters: 'Under the No Surprises Act (effective 2022), you may have protections against unexpected out-of-network charges in certain situations. Worth confirming with your insurer.',
      contact_target: 'insurer',
      severity: 'medium',
      confidence: 0.75,
      evidence: ['EOB network status: ' + eob.network_status],
    })
  }

  return flags.slice(0, 3)
}

// ── Fallback pool: evidence-backed, cautious flags used when total < 3 ─────────
function buildFallbackFlags(
  bill: BillExtractionOutput,
  eob: EobExtractionOutput,
  existing: Flag[],
): Flag[] {
  const existingTypes = new Set(existing.map((f) => f.flag_type))
  const candidates: Flag[] = []

  // Candidate 1: patient responsibility confirmation
  if (!existingTypes.has('responsibility_unclear') && eob.patient_responsibility != null) {
    candidates.push({
      flag_type: 'responsibility_unclear',
      title: 'Patient responsibility amount worth confirming before payment',
      explanation: `Your EOB lists a patient responsibility of $${eob.patient_responsibility.toLocaleString()}. It is worth confirming this matches your bill balance before making any payment.`,
      why_it_matters:
        'Paying before confirming the correct amount can make disputes harder to resolve later. Comparing your bill and EOB first helps ensure you pay what you actually owe.',
      contact_target: 'provider',
      severity: 'low',
      confidence: 0.65,
      evidence: [
        `EOB patient responsibility: $${eob.patient_responsibility}`,
        ...(bill.balance_due != null ? [`Bill balance due: $${bill.balance_due}`] : []),
      ],
    })
  }

  // Candidate 2: itemized bill review
  if (!existingTypes.has('unclear_balance') && bill.line_items.length === 0) {
    candidates.push({
      flag_type: 'unclear_balance',
      title: 'Itemized bill review may be worth requesting',
      explanation:
        'No detailed line items were identified in the uploaded bill. An itemized bill lists each service and charge individually, which can make it easier to verify what was billed.',
      why_it_matters:
        'You have the right to request an itemized bill. Reviewing individual charges can help identify entries that may warrant follow-up.',
      contact_target: 'provider',
      severity: 'low',
      confidence: 0.7,
      evidence: ['No individual line items were extracted from the bill'],
    })
  }

  // Candidate 3: contractual adjustment review
  if (
    !existingTypes.has('missing_adjustment') &&
    bill.total_billed != null &&
    eob.insurance_paid != null
  ) {
    candidates.push({
      flag_type: 'missing_adjustment',
      title: 'Contractual adjustments worth confirming',
      explanation:
        'The difference between what was billed and what was paid may include contractual adjustments or write-offs. Confirming these adjustments were applied correctly is generally worth doing.',
      why_it_matters:
        'Contractual adjustments reduce your bill based on agreements between your provider and insurer. If they were not applied, you may be billed more than you owe.',
      contact_target: 'insurer',
      severity: 'low',
      confidence: 0.6,
      evidence: [
        `Total billed: $${bill.total_billed}`,
        `Insurance paid: $${eob.insurance_paid}`,
        ...(eob.patient_responsibility != null
          ? [`Patient responsibility: $${eob.patient_responsibility}`]
          : []),
      ],
    })
  }

  // Candidate 4: service date alignment
  if (
    !existingTypes.has('date_service_mismatch') &&
    bill.service_dates.length > 0 &&
    eob.service_dates.length > 0
  ) {
    candidates.push({
      flag_type: 'date_service_mismatch',
      title: 'Service dates worth verifying across documents',
      explanation:
        'Your bill and EOB both reference service dates. It is worth confirming these match to ensure the claim was processed for the correct date of service.',
      why_it_matters:
        'A mismatch in service dates between your bill and EOB could indicate a processing error that may affect how your claim was adjudicated.',
      contact_target: 'provider',
      severity: 'low',
      confidence: 0.6,
      evidence: [
        `Bill service dates: ${bill.service_dates.slice(0, 2).join(', ')}`,
        `EOB service dates: ${eob.service_dates.slice(0, 2).join(', ')}`,
      ],
    })
  }

  return candidates
}

function ensureMinimumFlags(
  flags: Flag[],
  bill: BillExtractionOutput,
  eob: EobExtractionOutput,
): Flag[] {
  if (flags.length >= 3) return flags
  const needed = 3 - flags.length
  const fallbacks = buildFallbackFlags(bill, eob, flags)
  return [...flags, ...fallbacks.slice(0, needed)]
}

export async function comparisonAgent(
  bill: BillExtractionOutput,
  eob: EobExtractionOutput,
): Promise<ComparisonOutput> {
  const deterministicFlags = buildDeterministicFlags(bill, eob)

  // ── Route to strong paid model (primary: Anthropic, fallback: OpenAI) ────
  if (!hasAnyLLMProvider('comparisonAgent')) {
    return { flags: ensureMinimumFlags(deterministicFlags, bill, eob) }
  }

  try {
    const input = {
      bill: {
        provider_name: bill.provider_name,
        statement_date: bill.statement_date,
        service_dates: bill.service_dates,
        total_billed: bill.total_billed,
        balance_due: bill.balance_due,
        line_item_count: bill.line_items.length,
        line_items: bill.line_items.slice(0, 10),
      },
      eob: {
        insurer_name: eob.insurer_name,
        claim_number: eob.claim_number,
        service_dates: eob.service_dates,
        billed_amount: eob.billed_amount,
        allowed_amount: eob.allowed_amount,
        insurance_paid: eob.insurance_paid,
        patient_responsibility: eob.patient_responsibility,
        deductible: eob.deductible,
        network_status: eob.network_status,
      },
      already_detected: deterministicFlags.map((f) => f.flag_type),
    }

    const { result, meta } = await routedCall<ComparisonOutput>(
      'comparisonAgent',
      SYSTEM,
      `Compare these extracted bill and EOB fields. Do NOT re-flag already_detected issues unless you have additional evidence. Generate 1–3 additional cautious flags if warranted:\n\n${JSON.stringify(input, null, 2)}`,
      1024,
    )

    const llmFlags: Flag[] = Array.isArray(result?.flags)
      ? result.flags
          .filter((f) => f && f.title && f.explanation)
          .map((f) => ({
            flag_type: (f.flag_type as FlagType) ?? 'unclear_balance',
            title: f.title,
            explanation: f.explanation,
            why_it_matters: f.why_it_matters ?? '',
            contact_target: (f.contact_target as 'provider' | 'insurer') ?? 'provider',
            severity: (['low', 'medium', 'high'].includes(f.severity)
              ? f.severity
              : 'low') as Severity,
            // Apply routing penalty to each LLM flag's confidence.
            // Deterministic flags are not penalised — they are always trusted.
            confidence:
              (typeof f.confidence === 'number' ? f.confidence : 0.5) *
              meta.confidencePenalty,
            evidence: Array.isArray(f.evidence) ? f.evidence : [],
          }))
      : []

    const combined = [...deterministicFlags, ...llmFlags].slice(0, 5)
    return { flags: ensureMinimumFlags(combined, bill, eob) }
  } catch {
    return { flags: ensureMinimumFlags(deterministicFlags, bill, eob) }
  }
}
