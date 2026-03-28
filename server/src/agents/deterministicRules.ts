/**
 * Deterministic rules layer — cheap, fast, no LLM needed.
 * Used by agents before calling Claude to reduce cost and latency.
 */

// ─── Dollar amount extraction ─────────────────────────────────────────────────
const AMOUNT_RE = /\$\s*([\d,]+(?:\.\d{2})?)/g

export function extractAmounts(text: string): number[] {
  const results: number[] = []
  let match: RegExpExecArray | null
  AMOUNT_RE.lastIndex = 0
  while ((match = AMOUNT_RE.exec(text)) !== null) {
    const val = parseFloat(match[1].replace(/,/g, ''))
    if (!isNaN(val)) results.push(val)
  }
  return results
}

// ─── Date extraction ──────────────────────────────────────────────────────────
const DATE_RE =
  /\b(?:(?:Jan(?:uary)?|Feb(?:ruary)?|Mar(?:ch)?|Apr(?:il)?|May|Jun(?:e)?|Jul(?:y)?|Aug(?:ust)?|Sep(?:tember)?|Oct(?:ober)?|Nov(?:ember)?|Dec(?:ember)?)\s+\d{1,2},?\s+\d{4}|\d{1,2}[\/\-]\d{1,2}[\/\-]\d{2,4})\b/gi

export function extractDates(text: string): string[] {
  return [...new Set((text.match(DATE_RE) ?? []).map((d) => d.trim()))]
}

// ─── EOB marker detection ─────────────────────────────────────────────────────
const EOB_KEYWORDS = [
  'explanation of benefits',
  'eob',
  'allowed amount',
  'insurance paid',
  'member responsibility',
  'deductible',
  'claim number',
  'claim #',
  'plan paid',
  'benefit paid',
  'not covered amount',
  'network savings',
  'remark code',
]

export function detectEobMarkers(text: string): string[] {
  const lower = text.toLowerCase()
  return EOB_KEYWORDS.filter((kw) => lower.includes(kw))
}

// ─── Bill marker detection ────────────────────────────────────────────────────
const BILL_KEYWORDS = [
  'balance due',
  'amount due',
  'amount owed',
  'please pay',
  'remit payment',
  'statement date',
  'account number',
  'patient account',
  'total charges',
  'provider',
  'due date',
  'pay by',
  'pay online',
  'billing department',
]

export function detectBillMarkers(text: string): string[] {
  const lower = text.toLowerCase()
  return BILL_KEYWORDS.filter((kw) => lower.includes(kw))
}

// ─── Doc type classification (deterministic) ──────────────────────────────────
export function classifyDocType(text: string): {
  doc_type: 'bill' | 'eob' | 'unclear'
  confidence: number
  markers: string[]
} {
  const eobMarkers = detectEobMarkers(text)
  const billMarkers = detectBillMarkers(text)
  const eobScore = eobMarkers.length
  const billScore = billMarkers.length

  if (eobScore > billScore && eobScore >= 2) {
    return {
      doc_type: 'eob',
      confidence: Math.min(0.5 + eobScore * 0.08, 0.95),
      markers: eobMarkers,
    }
  }
  if (billScore > eobScore && billScore >= 2) {
    return {
      doc_type: 'bill',
      confidence: Math.min(0.5 + billScore * 0.08, 0.95),
      markers: billMarkers,
    }
  }
  return {
    doc_type: 'unclear',
    confidence: 0.3,
    markers: [...eobMarkers, ...billMarkers],
  }
}

// ─── Duplicate line item detection ────────────────────────────────────────────
export interface LineItemCandidate {
  code?: string | null
  description?: string | null
  amount?: number | null
}

export function detectDuplicates(items: LineItemCandidate[]): [number, number][] {
  const pairs: [number, number][] = []
  for (let i = 0; i < items.length; i++) {
    for (let j = i + 1; j < items.length; j++) {
      const a = items[i]
      const b = items[j]
      if (a.code && b.code && a.code === b.code && a.amount === b.amount) {
        pairs.push([i, j])
      }
    }
  }
  return pairs
}

// ─── Amount mismatch check ────────────────────────────────────────────────────
export function amountMismatch(
  billTotal: number | null,
  eobBilled: number | null,
  tolerancePct = 0.01,
): boolean {
  if (billTotal == null || eobBilled == null) return false
  const diff = Math.abs(billTotal - eobBilled)
  return diff > Math.max(1, Math.abs(billTotal) * tolerancePct)
}

// ─── Balance sanity check ─────────────────────────────────────────────────────
export function balanceInconsistent(
  insurancePaid: number | null,
  patientOwes: number | null,
  totalBilled: number | null,
  tolerancePct = 0.05,
): boolean {
  if (insurancePaid == null || patientOwes == null || totalBilled == null) return false
  const implied = insurancePaid + patientOwes
  const diff = Math.abs(implied - totalBilled)
  return diff > Math.max(1, totalBilled * tolerancePct)
}

// ─── Network keyword scan ─────────────────────────────────────────────────────
const OUT_NETWORK_RE = /out[- ]of[- ]network|non[- ]participating|non[- ]par\b/gi
const IN_NETWORK_RE = /in[- ]network|participating provider|par\b/gi

export function detectNetworkStatus(
  text: string,
): 'in_network' | 'out_of_network' | 'mixed' | 'unclear' {
  const hasOut = OUT_NETWORK_RE.test(text)
  const hasIn = IN_NETWORK_RE.test(text)
  OUT_NETWORK_RE.lastIndex = 0
  IN_NETWORK_RE.lastIndex = 0
  if (hasOut && hasIn) return 'mixed'
  if (hasOut) return 'out_of_network'
  if (hasIn) return 'in_network'
  return 'unclear'
}

// ─── Adjustment/payment marker scan ──────────────────────────────────────────
export function hasAdjustmentMarkers(text: string): boolean {
  const lower = text.toLowerCase()
  return (
    lower.includes('adjustment') ||
    lower.includes('contractual') ||
    lower.includes('write-off') ||
    lower.includes('writeoff') ||
    lower.includes('discount')
  )
}

// ─── OCR quality score heuristic ─────────────────────────────────────────────
export function estimateOcrConfidence(text: string): number {
  if (!text || text.trim().length < 50) return 0.1
  const wordCount = text.trim().split(/\s+/).length
  const dollarCount = (text.match(/\$/g) ?? []).length
  const hasNumbers = /\d/.test(text)
  const hasPunctuation = /[.,:]/.test(text)

  let score = 0.4
  if (wordCount > 100) score += 0.15
  if (wordCount > 300) score += 0.15
  if (dollarCount >= 2) score += 0.15
  if (hasNumbers) score += 0.05
  if (hasPunctuation) score += 0.1

  return Math.min(score, 0.95)
}
