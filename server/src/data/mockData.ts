export interface BillIssue {
  id: string
  type: 'duplicate' | 'upcoding' | 'unbundling' | 'not_covered' | 'billing_error' | 'itemization'
  severity: 'high' | 'medium' | 'low'
  title: string
  description: string
  amount: number
  confidence: number
  documentId: string
  actionIds: string[]
}

export interface CaseAction {
  id: string
  issueId: string
  type: 'dispute_letter' | 'appeal' | 'call_script' | 'itemized_bill' | 'eob_request'
  title: string
  description: string
  template: string
  completed: boolean
}

export interface TimelineEvent {
  id: string
  label: string
  date: string
  completed: boolean
}

export interface CaseDocument {
  id: string
  type: 'hospital_bill' | 'eob' | 'radiology_bill' | 'physician_bill'
  provider: string
  totalAmount: number
  dateOfService: string
  dueDate?: string
}

export interface CaseData {
  id: string
  patientName: string
  status: 'active' | 'resolved' | 'pending'
  createdAt: string
  summary: {
    totalBilled: number
    insurerPaid: number
    patientOwes: number
    potentialSavings: number
  }
  documents: CaseDocument[]
  issues: BillIssue[]
  actions: CaseAction[]
  timeline: TimelineEvent[]
}

export const DEMO_CASES: CaseData[] = [
  {
    id: 'case-demo-1',
    patientName: 'Atharv Mittal',
    status: 'active',
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 2).toISOString(),
    summary: {
      totalBilled: 12840,
      insurerPaid: 6200,
      patientOwes: 6640,
      potentialSavings: 4100,
    },
    documents: [
      { id: 'doc-1', type: 'hospital_bill', provider: 'City General Hospital', totalAmount: 8400, dateOfService: '2026-03-10', dueDate: '2026-04-10' },
      { id: 'doc-2', type: 'eob', provider: 'BlueCross BlueShield', totalAmount: 12840, dateOfService: '2026-03-10' },
      { id: 'doc-3', type: 'radiology_bill', provider: 'Advanced Imaging Assoc.', totalAmount: 2200, dateOfService: '2026-03-10', dueDate: '2026-04-10' },
      { id: 'doc-4', type: 'physician_bill', provider: 'ER Physicians Group', totalAmount: 2240, dateOfService: '2026-03-10', dueDate: '2026-04-10' },
    ],
    issues: [
      {
        id: 'issue-1',
        type: 'duplicate',
        severity: 'high',
        title: 'Duplicate Blood Panel Charge',
        description: 'Comprehensive metabolic panel (CPT 80053) billed twice on the same date of service. Insurance only covers one occurrence per day.',
        amount: 420,
        confidence: 94,
        documentId: 'doc-1',
        actionIds: ['action-1'],
      },
      {
        id: 'issue-2',
        type: 'upcoding',
        severity: 'high',
        title: 'Potential Upcoding — ER Level',
        description: 'Billed as Level 4 ER visit (CPT 99284, $1,200) when documentation indicates a Level 2 visit (CPT 99282, ~$280). This is a $920 overcharge.',
        amount: 920,
        confidence: 88,
        documentId: 'doc-1',
        actionIds: ['action-2'],
      },
      {
        id: 'issue-3',
        type: 'not_covered',
        severity: 'medium',
        title: 'Charge Exceeds Auth Limit',
        description: 'Radiology charge of $2,200 exceeds the $1,800 pre-authorization limit. Insurer flagged this on EOB — may be disputable.',
        amount: 400,
        confidence: 76,
        documentId: 'doc-3',
        actionIds: ['action-3'],
      },
    ],
    actions: [
      {
        id: 'action-1',
        issueId: 'issue-1',
        type: 'dispute_letter',
        title: 'Send Duplicate Charge Dispute',
        description: 'Write to the hospital billing department citing the duplicate CPT 80053 entry.',
        template: 'Dear Billing Department,\n\nI am writing to dispute a duplicate charge on my statement dated March 10, 2026...',
        completed: false,
      },
      {
        id: 'action-2',
        issueId: 'issue-2',
        type: 'appeal',
        title: 'Appeal ER Level Upcoding',
        description: 'File a formal appeal with the insurer citing the discrepancy between the documented visit complexity and the billed ER level.',
        template: 'To Whom It May Concern,\n\nI am appealing claim #[CLAIM_ID] for services rendered March 10, 2026...',
        completed: false,
      },
      {
        id: 'action-3',
        issueId: 'issue-3',
        type: 'eob_request',
        title: 'Request Itemized EOB Clarification',
        description: 'Contact your insurer to request a detailed explanation of how the radiology charge was processed against the authorization.',
        template: 'Dear [INSURER_NAME] Member Services,\n\nI am requesting clarification on how claim #[CLAIM_ID] was processed...',
        completed: false,
      },
    ],
    timeline: [
      { id: 'tl-1', label: 'ER Visit', date: '2026-03-10', completed: true },
      { id: 'tl-2', label: 'Bill Received', date: '2026-03-18', completed: true },
      { id: 'tl-3', label: 'EOB Arrived', date: '2026-03-22', completed: true },
      { id: 'tl-4', label: 'AI Analysis', date: '2026-03-28', completed: true },
      { id: 'tl-5', label: 'Dispute Sent', date: '', completed: false },
      { id: 'tl-6', label: 'Appeal Filed', date: '', completed: false },
      { id: 'tl-7', label: 'Response Due', date: '', completed: false },
      { id: 'tl-8', label: 'Resolved', date: '', completed: false },
    ],
  },
]

// Aggregate stats for /api/stats
export const MOCK_STATS = {
  totalBilled: 47320,
  totalSaved: 12840,
  activeCases: 3,
  totalIssues: 14,
  resolvedCases: 2,
  pendingCases: 1,
}
