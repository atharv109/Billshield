// ─── Intake Agent ────────────────────────────────────────────────────────────
export interface IntakeFile {
  file_id: string
  filename: string
  mimetype: string
  size: number
  buffer: Buffer
}

export interface IntakeOutput {
  status: 'ok' | 'error'
  file_count: number
  doc_ids: string[]
  issues: string[]
}

// ─── OCR / Text Extraction ───────────────────────────────────────────────────
export interface OcrOutput {
  doc_id: string
  raw_text: string
  blocks: string[]
  amounts_found: number[]
  dates_found: string[]
  extraction_confidence: number
}

// ─── Document Type Agent ─────────────────────────────────────────────────────
export type DocType = 'bill' | 'eob' | 'unclear'

export interface DocTypeOutput {
  doc_id: string
  doc_type: DocType
  confidence: number
  markers: string[]
}

// ─── Bill Extraction Agent ───────────────────────────────────────────────────
export interface LineItem {
  date: string | null
  description: string | null
  amount: number | null
  code: string | null
}

export interface BillExtractionOutput {
  doc_id: string
  provider_name: string | null
  statement_date: string | null
  service_dates: string[]
  total_billed: number | null
  balance_due: number | null
  patient_name: string | null
  account_number: string | null
  line_items: LineItem[]
  confidence: number
  evidence: {
    total_billed: string[]
    balance_due: string[]
  }
}

// ─── EOB Extraction Agent ────────────────────────────────────────────────────
export type NetworkStatus = 'in_network' | 'out_of_network' | 'mixed' | 'unclear'

export interface EobExtractionOutput {
  doc_id: string
  insurer_name: string | null
  claim_number: string | null
  service_dates: string[]
  billed_amount: number | null
  allowed_amount: number | null
  insurance_paid: number | null
  patient_responsibility: number | null
  deductible: number | null
  coinsurance: number | null
  copay: number | null
  network_status: NetworkStatus
  confidence: number
  evidence: {
    insurance_paid: string[]
    patient_responsibility: string[]
  }
}

// ─── Comparison / Flag Agent ─────────────────────────────────────────────────
export type FlagType =
  | 'amount_mismatch'
  | 'duplicate_charge'
  | 'unclear_balance'
  | 'missing_adjustment'
  | 'network_inconsistency'
  | 'responsibility_unclear'
  | 'date_service_mismatch'

export type Severity = 'low' | 'medium' | 'high'
export type ContactTarget = 'provider' | 'insurer'

export interface Flag {
  flag_type: FlagType
  title: string
  explanation: string
  why_it_matters: string
  contact_target: ContactTarget
  severity: Severity
  confidence: number
  evidence: string[]
}

export interface ComparisonOutput {
  flags: Flag[]
}

// ─── Summary Agent ───────────────────────────────────────────────────────────
export interface SummaryOutput {
  summary: {
    provider_billed: number | null
    insurance_paid: number | null
    you_may_owe: number | null
    plain_english_summary: string
    uncertainties: string[]
  }
  confidence: number
}

// ─── Action Agent ────────────────────────────────────────────────────────────
export type ActionType = 'call_script' | 'email_draft'

export interface ActionOutput {
  action_type: ActionType
  contact_target: ContactTarget
  reason_for_action: string
  content: string
  confidence: number
}

// ─── Scoring Agent ───────────────────────────────────────────────────────────
export interface ScoreKeys {
  document_classification_score: number
  bill_extraction_score: number
  eob_extraction_score: number
  comparison_flag_score: number
  summary_quality_score: number
  action_quality_score: number
  overall_case_score: number
}

export interface ScoringOutput {
  scores: ScoreKeys
  score_explanations: Record<keyof ScoreKeys, string>
  needs_human_review: boolean
}

// ─── Orchestrator Final Output ────────────────────────────────────────────────
export interface FinalOutput {
  final_output: {
    summary: SummaryOutput['summary']
    flags: Flag[]
    what_this_may_mean: string
    what_to_do_next: ActionOutput
  }
  internal_scores: ScoringOutput
  needs_human_review: boolean
}

// ─── Pipeline Context ─────────────────────────────────────────────────────────
export interface PipelineContext {
  intake: IntakeOutput
  ocr: Record<string, OcrOutput>
  docTypes: Record<string, DocTypeOutput>
  billExtraction: BillExtractionOutput | null
  eobExtraction: EobExtractionOutput | null
  comparison: ComparisonOutput | null
  summary: SummaryOutput | null
  action: ActionOutput | null
  scoring: ScoringOutput | null
  final: FinalOutput | null
}
