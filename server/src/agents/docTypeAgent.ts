import type { OcrOutput, DocTypeOutput } from '../types/agentTypes'
import { classifyDocType } from './deterministicRules'
import { callClaude } from './claudeHelper'

const SYSTEM = `You are a document classifier. Given extracted text from a medical document, determine if it is a "bill" (patient-facing invoice from a provider) or an "eob" (Explanation of Benefits from an insurance company). Respond with JSON only:
{
  "doc_type": "bill|eob|unclear",
  "confidence": <0.0-1.0>,
  "markers": ["<key phrase that led to this classification>"]
}
Rules:
- Use null values over invented ones.
- If unsure, return "unclear" with low confidence.
- markers must be short exact phrases found in the text.`

export async function docTypeAgent(ocr: OcrOutput): Promise<DocTypeOutput> {
  // Deterministic pass first
  const det = classifyDocType(ocr.raw_text)

  if (det.confidence >= 0.75) {
    return {
      doc_id: ocr.doc_id,
      doc_type: det.doc_type,
      confidence: det.confidence,
      markers: det.markers,
    }
  }

  // Low confidence: ask Claude
  if (!process.env.ANTHROPIC_API_KEY) {
    return { doc_id: ocr.doc_id, ...det }
  }

  try {
    const snippet = ocr.raw_text.slice(0, 2000)
    const result = await callClaude<{ doc_type: string; confidence: number; markers: string[] }>(
      SYSTEM,
      `Classify this document:\n\n${snippet}`,
      256,
    )
    return {
      doc_id: ocr.doc_id,
      doc_type: (['bill', 'eob', 'unclear'].includes(result.doc_type)
        ? result.doc_type
        : 'unclear') as DocTypeOutput['doc_type'],
      confidence: typeof result.confidence === 'number' ? result.confidence : 0.5,
      markers: Array.isArray(result.markers) ? result.markers : det.markers,
    }
  } catch {
    return { doc_id: ocr.doc_id, ...det }
  }
}
