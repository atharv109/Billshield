/**
 * StoredCase — the single canonical type for cases in the server store.
 *
 * Shape matches what services/outputMapper.ts produces, plus two server-only
 * tracking fields: status and createdAt. This ensures the pipeline output
 * (POST /api/upload/analyze) and the cases CRUD (GET /api/cases) share one type.
 */

export interface StoredCaseDocument {
  id: string
  type: 'bill' | 'eob'
  provider?: string
  insurer?: string
  amount?: number
  paidAmount?: number
  patientOwe?: number
  dateOfService: string
  position: [number, number, number]
}

export interface StoredCaseIssue {
  id: string
  severity: 'high' | 'medium' | 'low'
  title: string
  description: string
  relatedDocIds: string[]
  confidence: number
  explanation: string
}

export interface StoredCaseAction {
  id: string
  issueId?: string
  title: string
  icon: string
  type: 'call' | 'letter' | 'dispute'
  whyItMatters: string
  draft?: string
  script?: string
}

export interface StoredCaseTimeline {
  id: string
  label: string
  completed: boolean
}

export interface StoredCase {
  id: string
  eventType: string
  dateOfService: string
  totalBilled: number
  insurerPaid: number
  patientOwes: number
  documents: StoredCaseDocument[]
  issues: StoredCaseIssue[]
  actions: StoredCaseAction[]
  timeline: StoredCaseTimeline[]
  agentOutput?: unknown
  // Server-only tracking fields — not returned by outputMapper, added at persist time
  status: 'active' | 'resolved' | 'pending'
  createdAt: string
}

export const DEMO_CASES: StoredCase[] = [
  {
    id: 'case-demo-1',
    eventType: 'Emergency Room Visit',
    dateOfService: 'Mar 10, 2026',
    totalBilled: 12840,
    insurerPaid: 6200,
    patientOwes: 6640,
    documents: [
      {
        id: 'doc-1',
        type: 'bill',
        provider: 'City General Hospital',
        amount: 8400,
        dateOfService: 'Mar 10, 2026',
        position: [-4, 0.8, 0],
      },
      {
        id: 'doc-2',
        type: 'eob',
        insurer: 'BlueCross BlueShield',
        paidAmount: 6200,
        patientOwe: 6640,
        dateOfService: 'Mar 10, 2026',
        position: [4, 0.8, -0.5],
      },
    ],
    issues: [
      {
        id: 'iss-1',
        severity: 'high',
        title: 'Duplicate Blood Panel Charge',
        description: 'CPT 80053 billed twice on the same date of service.',
        relatedDocIds: ['doc-1'],
        confidence: 0.94,
        explanation:
          'A comprehensive metabolic panel appears twice on the bill. Insurance typically covers one occurrence per day.',
      },
      {
        id: 'iss-2',
        severity: 'high',
        title: 'Potential Upcoding — ER Level',
        description: 'Billed as Level 4 ER visit when documentation may indicate a lower complexity visit.',
        relatedDocIds: ['doc-1', 'doc-2'],
        confidence: 0.88,
        explanation:
          'The ER visit level billed (CPT 99284) may not match the documented complexity. Worth requesting clarification from the provider.',
      },
    ],
    actions: [
      {
        id: 'act-1',
        issueId: 'iss-1',
        title: 'Send Duplicate Charge Dispute',
        icon: '📄',
        type: 'letter',
        whyItMatters: 'Duplicate charges are one of the most common billing errors.',
        draft:
          'Dear Billing Department,\n\nI am writing to dispute a duplicate charge on my statement dated March 10, 2026. CPT code 80053 appears twice...',
      },
    ],
    timeline: [
      { id: 'tl-1', label: 'Bill uploaded', completed: true },
      { id: 'tl-2', label: 'Text extracted', completed: true },
      { id: 'tl-3', label: 'Issues flagged', completed: true },
      { id: 'tl-4', label: 'Actions generated', completed: true },
      { id: 'tl-5', label: 'Provider contacted', completed: false },
      { id: 'tl-6', label: 'Insurer contacted', completed: false },
      { id: 'tl-7', label: 'Awaiting reply', completed: false },
      { id: 'tl-8', label: 'Resolved', completed: false },
    ],
    status: 'active',
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 2).toISOString(),
  },
]
