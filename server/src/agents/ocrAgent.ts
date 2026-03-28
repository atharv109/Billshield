import type { OcrOutput } from '../types/agentTypes'
import {
  extractAmounts,
  extractDates,
  estimateOcrConfidence,
} from './deterministicRules'

// pdf-parse uses require() in CJS context
// eslint-disable-next-line @typescript-eslint/no-require-imports
const pdfParse: (buf: Buffer) => Promise<{ text: string }> = require('pdf-parse')

export async function ocrAgent(
  doc_id: string,
  filename: string,
  mimetype: string,
  buffer: Buffer,
): Promise<OcrOutput> {
  let raw_text = ''

  try {
    if (mimetype === 'application/pdf' || filename.toLowerCase().endsWith('.pdf')) {
      const result = await pdfParse(buffer)
      raw_text = result.text ?? ''
    } else if (mimetype.startsWith('text/')) {
      raw_text = buffer.toString('utf8')
    } else {
      // Image or unknown: return empty text with low confidence
      raw_text = ''
    }
  } catch {
    raw_text = ''
  }

  const blocks = raw_text
    .split(/\n{2,}/)
    .map((b) => b.trim())
    .filter((b) => b.length > 0)
    .slice(0, 120)

  const amounts_found = extractAmounts(raw_text)
  const dates_found = extractDates(raw_text)
  const extraction_confidence = estimateOcrConfidence(raw_text)

  return {
    doc_id,
    raw_text,
    blocks,
    amounts_found,
    dates_found,
    extraction_confidence,
  }
}
