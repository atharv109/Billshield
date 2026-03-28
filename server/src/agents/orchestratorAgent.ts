import type {
  BillExtractionOutput,
  EobExtractionOutput,
  ComparisonOutput,
  SummaryOutput,
  ActionOutput,
  ScoringOutput,
  FinalOutput,
  Flag,
} from '../types/agentTypes'

export function orchestratorAgent(params: {
  summary: SummaryOutput | null
  comparison: ComparisonOutput | null
  action: ActionOutput | null
  scoring: ScoringOutput
  bill: BillExtractionOutput | null
  eob: EobExtractionOutput | null
}): FinalOutput {
  const { summary, comparison, action, scoring, bill, eob } = params

  // ── Select top flags (max 5, filter low-confidence if extraction was weak) ──
  const minConfidence = scoring.scores.overall_case_score < 50 ? 0.6 : 0.4
  const allFlags: Flag[] = comparison?.flags ?? []
  const topFlags = allFlags
    .filter((f) => f.confidence >= minConfidence)
    .sort((a, b) => {
      const sev = { high: 3, medium: 2, low: 1 }
      return (sev[b.severity] - sev[a.severity]) || (b.confidence - a.confidence)
    })
    .slice(0, 5)

  // ── Build "what this may mean" paragraph ─────────────────────────────────
  const flagCount = topFlags.length
  const highSeverity = topFlags.filter((f) => f.severity === 'high').length

  let whatThisMayMean = 'Based on the documents provided, '
  if (flagCount === 0) {
    whatThisMayMean += 'no specific issues were detected in the information extracted from your documents. This does not guarantee the bill is error-free — consider reviewing the original documents carefully.'
  } else {
    whatThisMayMean += `we identified ${flagCount} item${flagCount > 1 ? 's' : ''} that may be worth reviewing`
    if (highSeverity > 0) {
      whatThisMayMean += `, including ${highSeverity} higher-priority item${highSeverity > 1 ? 's' : ''}`
    }
    whatThisMayMean += '. These are not definitive errors — they are patterns that are worth confirming with the relevant party.'
  }

  // ── Choose best action ────────────────────────────────────────────────────
  // Downgrade confidence if extraction was weak
  const finalAction = action
    ? {
        ...action,
        confidence:
          scoring.scores.overall_case_score < 50
            ? Math.min(action.confidence, 0.5)
            : action.confidence,
      }
    : null

  // ── Resolve summary ───────────────────────────────────────────────────────
  const resolvedSummary = summary?.summary ?? {
    provider_billed: bill?.total_billed ?? eob?.billed_amount ?? null,
    insurance_paid: eob?.insurance_paid ?? null,
    you_may_owe: eob?.patient_responsibility ?? bill?.balance_due ?? null,
    plain_english_summary:
      'We were unable to generate a complete summary based on the uploaded documents. Please review the flags below for any items we detected.',
    uncertainties: ['Summary could not be fully generated from the provided documents.'],
  }

  // ── Extract display metadata for frontend ────────────────────────────────
  const firstServiceDate =
    bill?.service_dates[0] ?? eob?.service_dates[0] ?? null

  return {
    final_output: {
      summary: resolvedSummary,
      flags: topFlags,
      what_this_may_mean: whatThisMayMean,
      what_to_do_next: finalAction ?? {
        action_type: 'call_script',
        contact_target: 'provider',
        reason_for_action: 'General billing review',
        content:
          'Contact the billing department for the provider listed on your bill and ask them to walk you through each charge. Request an itemized bill if one was not provided.',
        confidence: 0.4,
      },
    },
    internal_scores: scoring,
    needs_human_review: scoring.needs_human_review,
    meta: {
      provider_name: bill?.provider_name ?? null,
      insurer_name: eob?.insurer_name ?? null,
      first_service_date: firstServiceDate,
    },
  }
}
