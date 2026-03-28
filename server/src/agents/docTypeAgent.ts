import type { OcrOutput, DocTypeOutput } from '../types/agentTypes'
import { classifyDocType } from './deterministicRules'
import { routedCall, hasAnyLLMProvider } from '../routing/router'

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
  // ── Deterministic pass first (no LLM needed if confidence is high) ──────
  const det = classifyDocType(ocr.raw_text)

  if (det.confidence >= 0.75) {
    return {
      doc_id: ocr.doc_id,
      doc_type: det.doc_type,
      confidence: det.confidence,
      markers: det.markers,
    }
  }

  // ── Low confidence: route to strong paid model via routing layer ─────────
  if (!hasAnyLLMProvider('docTypeAgent')) {
    return { doc_id: ocr.doc_id, ...det }
  }

  try {
    const snippet = ocr.raw_text.slice(0, 2000)
    const { result, meta } = await routedCall<{
      doc_type: string
      confidence: number
      markers: string[]
    }>('docTypeAgent', SYSTEM, `Classify this document:\n\n${snippet}`, 256)

    return {
      doc_id: ocr.doc_id,
      doc_type: (['bill', 'eob', 'unclear'].includes(result.doc_type)
        ? result.doc_type
        : 'unclear') as DocTypeOutput['doc_type'],
      // Apply confidence penalty: reduces score when a fallback provider was used
      confidence:
        (typeof result.confidence === 'number' ? result.confidence : 0.5) *
        meta.confidencePenalty,
      markers: Array.isArray(result.markers) ? result.markers : det.markers,
    }
  } catch {
    // All providers failed — return deterministic result
    return { doc_id: ocr.doc_id, ...det }
  }
}
