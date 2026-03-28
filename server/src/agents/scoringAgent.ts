import type {
  DocTypeOutput,
  BillExtractionOutput,
  EobExtractionOutput,
  ComparisonOutput,
  SummaryOutput,
  ActionOutput,
  ScoringOutput,
  ScoreKeys,
  OcrOutput,
} from '../types/agentTypes'

function clamp(v: number): number {
  return Math.max(0, Math.min(100, Math.round(v)))
}

export function scoringAgent(params: {
  docTypes: DocTypeOutput[]
  bill: BillExtractionOutput | null
  eob: EobExtractionOutput | null
  comparison: ComparisonOutput | null
  summary: SummaryOutput | null
  action: ActionOutput | null
  ocrOutputs: OcrOutput[]
}): ScoringOutput {
  const { docTypes, bill, eob, comparison, summary, action, ocrOutputs } = params

  // ── Document Classification Score ────────────────────────────────────────
  const classConfs = docTypes.map((d) => d.confidence)
  const avgClassConf = classConfs.length > 0 ? classConfs.reduce((a, b) => a + b, 0) / classConfs.length : 0
  const hasCorrectTypes = docTypes.some((d) => d.doc_type === 'bill') && docTypes.some((d) => d.doc_type === 'eob')
  const document_classification_score = clamp(
    hasCorrectTypes ? avgClassConf * 90 + 10 : avgClassConf * 50,
  )

  // ── Bill Extraction Score ─────────────────────────────────────────────────
  let billScore = 0
  if (bill) {
    const fields: (unknown)[] = [
      bill.provider_name,
      bill.statement_date,
      bill.total_billed,
      bill.balance_due,
    ]
    const filled = fields.filter((f) => f != null).length
    const completeness = (filled / fields.length) * 50
    const hasEvidence = (bill.evidence.total_billed.length + bill.evidence.balance_due.length) > 0 ? 20 : 0
    const confBonus = bill.confidence * 30
    billScore = clamp(completeness + hasEvidence + confBonus)
  }

  // ── EOB Extraction Score ──────────────────────────────────────────────────
  let eobScore = 0
  if (eob) {
    const fields: (unknown)[] = [
      eob.insurer_name,
      eob.insurance_paid,
      eob.patient_responsibility,
      eob.billed_amount,
      eob.allowed_amount,
    ]
    const filled = fields.filter((f) => f != null).length
    const completeness = (filled / fields.length) * 50
    const hasEvidence = (eob.evidence.insurance_paid.length + eob.evidence.patient_responsibility.length) > 0 ? 20 : 0
    const confBonus = eob.confidence * 30
    eobScore = clamp(completeness + hasEvidence + confBonus)
  }

  // ── Comparison Flag Score ─────────────────────────────────────────────────
  let flagScore = 0
  if (comparison) {
    const flags = comparison.flags
    const count = flags.length
    if (count >= 3 && count <= 5) flagScore += 30
    else if (count > 0) flagScore += 15

    const avgConf = count > 0 ? flags.reduce((a, b) => a + b.confidence, 0) / count : 0
    flagScore += avgConf * 40

    const hasEvidence = flags.filter((f) => f.evidence.length > 0).length
    flagScore += (hasEvidence / Math.max(count, 1)) * 30

    flagScore = clamp(flagScore)
  }

  // ── Summary Quality Score ─────────────────────────────────────────────────
  let summaryScore = 0
  if (summary) {
    const s = summary.summary
    if (s.plain_english_summary && s.plain_english_summary.length > 50) summaryScore += 40
    if (s.provider_billed != null) summaryScore += 15
    if (s.insurance_paid != null) summaryScore += 15
    if (s.you_may_owe != null) summaryScore += 15
    summaryScore += summary.confidence * 15
    summaryScore = clamp(summaryScore)
  }

  // ── Action Quality Score ──────────────────────────────────────────────────
  let actionScore = 0
  if (action) {
    if (action.content && action.content.length > 80) actionScore += 40
    if (action.reason_for_action && action.reason_for_action.length > 5) actionScore += 20
    if (['call_script', 'email_draft'].includes(action.action_type)) actionScore += 20
    actionScore += action.confidence * 20
    actionScore = clamp(actionScore)
  }

  // ── Weighted overall ──────────────────────────────────────────────────────
  const overall_case_score = clamp(
    document_classification_score * 0.1 +
      billScore * 0.2 +
      eobScore * 0.2 +
      flagScore * 0.2 +
      summaryScore * 0.15 +
      actionScore * 0.15,
  )

  const scores: ScoreKeys = {
    document_classification_score,
    bill_extraction_score: billScore,
    eob_extraction_score: eobScore,
    comparison_flag_score: flagScore,
    summary_quality_score: summaryScore,
    action_quality_score: actionScore,
    overall_case_score,
  }

  const avgOcrConf = ocrOutputs.length > 0
    ? ocrOutputs.reduce((a, b) => a + b.extraction_confidence, 0) / ocrOutputs.length
    : 0

  const needs_human_review =
    billScore < 60 ||
    eobScore < 60 ||
    document_classification_score < 60 ||
    avgOcrConf < 0.4 ||
    actionScore < 50 ||
    flagScore < 40

  const score_explanations: Record<keyof ScoreKeys, string> = {
    document_classification_score: hasCorrectTypes
      ? `Both bill and EOB were identified with avg confidence ${(avgClassConf * 100).toFixed(0)}%.`
      : `Document types were unclear or both documents appear to be the same type.`,
    bill_extraction_score: bill
      ? `Extracted ${[bill.provider_name, bill.total_billed, bill.balance_due].filter(Boolean).length}/3 key fields with confidence ${(bill.confidence * 100).toFixed(0)}%.`
      : 'Bill extraction was not attempted.',
    eob_extraction_score: eob
      ? `Extracted ${[eob.insurer_name, eob.insurance_paid, eob.patient_responsibility].filter(Boolean).length}/3 key fields with confidence ${(eob.confidence * 100).toFixed(0)}%.`
      : 'EOB extraction was not attempted.',
    comparison_flag_score: comparison
      ? `Generated ${comparison.flags.length} flag(s) with avg confidence ${comparison.flags.length > 0 ? (comparison.flags.reduce((a, b) => a + b.confidence, 0) / comparison.flags.length * 100).toFixed(0) : 0}%.`
      : 'Comparison was not run.',
    summary_quality_score: summary
      ? `Summary generated with confidence ${(summary.confidence * 100).toFixed(0)}%.`
      : 'Summary was not generated.',
    action_quality_score: action
      ? `Action "${action.action_type}" generated targeting ${action.contact_target}.`
      : 'Action was not generated.',
    overall_case_score: `Weighted score across all agents: ${overall_case_score}/100.`,
  }

  return { scores, score_explanations, needs_human_review }
}
