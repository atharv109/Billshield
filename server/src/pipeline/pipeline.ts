import { intakeAgent } from '../agents/intakeAgent'
import { ocrAgent } from '../agents/ocrAgent'
import { docTypeAgent } from '../agents/docTypeAgent'
import { billExtractionAgent } from '../agents/billExtractionAgent'
import { eobExtractionAgent } from '../agents/eobExtractionAgent'
import { comparisonAgent } from '../agents/comparisonAgent'
import { summaryAgent } from '../agents/summaryAgent'
import { actionAgent } from '../agents/actionAgent'
import { scoringAgent } from '../agents/scoringAgent'
import { orchestratorAgent } from '../agents/orchestratorAgent'
import type {
  IntakeFile,
  OcrOutput,
  DocTypeOutput,
  BillExtractionOutput,
  EobExtractionOutput,
  FinalOutput,
} from '../types/agentTypes'

export interface PipelineError {
  error: true
  message: string
}

export async function runPipeline(
  files: IntakeFile[],
): Promise<FinalOutput | PipelineError> {
  // ── Step 1: Intake ─────────────────────────────────────────────────────────
  const intake = intakeAgent(files)
  if (intake.status === 'error') {
    return { error: true, message: intake.issues[0] ?? 'Upload error.' }
  }

  // ── Step 2: OCR — both files in parallel ───────────────────────────────────
  const ocrResults: OcrOutput[] = await Promise.all(
    files.map((f, i) =>
      ocrAgent(intake.doc_ids[i], f.filename, f.mimetype, f.buffer),
    ),
  )

  const ocrMap: Record<string, OcrOutput> = {}
  for (const o of ocrResults) ocrMap[o.doc_id] = o

  // ── Step 3: Document Type classification ───────────────────────────────────
  const docTypeResults: DocTypeOutput[] = await Promise.all(
    ocrResults.map((o) => docTypeAgent(o)),
  )

  // Assign bill/eob docs
  let billOcr: OcrOutput | null = null
  let eobOcr: OcrOutput | null = null

  for (let i = 0; i < docTypeResults.length; i++) {
    const dt = docTypeResults[i]
    if (dt.doc_type === 'bill' && !billOcr) billOcr = ocrResults[i]
    else if (dt.doc_type === 'eob' && !eobOcr) eobOcr = ocrResults[i]
  }

  // Fallback: if types unclear, assign by order
  if (!billOcr && !eobOcr) {
    billOcr = ocrResults[0] ?? null
    eobOcr = ocrResults[1] ?? null
  } else if (!billOcr) {
    billOcr = ocrResults.find((o) => o.doc_id !== eobOcr!.doc_id) ?? null
  } else if (!eobOcr) {
    eobOcr = ocrResults.find((o) => o.doc_id !== billOcr!.doc_id) ?? null
  }

  // ── Step 4: Extraction — bill and EOB in parallel ──────────────────────────
  const [billExtraction, eobExtraction] = await Promise.all([
    billOcr ? billExtractionAgent(billOcr) : Promise.resolve(null as BillExtractionOutput | null),
    eobOcr ? eobExtractionAgent(eobOcr) : Promise.resolve(null as EobExtractionOutput | null),
  ])

  if (!billExtraction || !eobExtraction) {
    return { error: true, message: 'Could not extract data from one or both documents.' }
  }

  // ── Step 5: Comparison ─────────────────────────────────────────────────────
  const comparison = await comparisonAgent(billExtraction, eobExtraction)

  // ── Step 6: Summary + Action in parallel ───────────────────────────────────
  const topFlag = comparison.flags[0] ?? null
  const [summary, action] = await Promise.all([
    summaryAgent(billExtraction, eobExtraction),
    topFlag
      ? actionAgent(topFlag, billExtraction.provider_name, eobExtraction.insurer_name)
      : Promise.resolve(null),
  ])

  // ── Step 7: Scoring ────────────────────────────────────────────────────────
  const scoring = scoringAgent({
    docTypes: docTypeResults,
    bill: billExtraction,
    eob: eobExtraction,
    comparison,
    summary,
    action,
    ocrOutputs: ocrResults,
  })

  // ── Step 8: Orchestrate final output ───────────────────────────────────────
  const final = orchestratorAgent({
    summary,
    comparison,
    action,
    scoring,
    bill: billExtraction,
    eob: eobExtraction,
  })

  return final
}
