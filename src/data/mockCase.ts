export type DocumentType = 'bill' | 'eob' | 'estimate' | 'radiology'
export type IssueSeverity = 'high' | 'medium' | 'low'

export interface CaseDocument {
  id: string
  type: DocumentType
  provider?: string
  insurer?: string
  amount?: number
  paidAmount?: number
  patientOwe?: number
  dueDate?: string
  dateOfService?: string
  position: [number, number, number]
  lineItems?: LineItem[]
}

export interface LineItem {
  id: string
  code: string
  description: string
  amount: number
  flagged?: boolean
}

export interface Issue {
  id: string
  severity: IssueSeverity
  title: string
  description: string
  relatedDocIds: string[]
  confidence: number
  explanation: string
}

export interface Action {
  id: string
  title: string
  icon: string
  type: 'letter' | 'call' | 'dispute'
  draft?: string
  script?: string
  whyItMatters: string
}

export interface TimelineEvent {
  id: string
  label: string
  completed: boolean
}

export interface CaseData {
  id: string
  eventType: string
  dateOfService: string
  totalBilled: number
  insurerPaid: number
  patientOwes: number
  documents: CaseDocument[]
  issues: Issue[]
  actions: Action[]
  timeline: TimelineEvent[]
  // Optional: full agent output attached by the backend
  agentOutput?: {
    final_output?: {
      summary?: { plain_english_summary?: string; uncertainties?: string[] }
      what_this_may_mean?: string
    }
    internal_scores?: {
      scores?: { overall_case_score?: number }
      needs_human_review?: boolean
    }
    needs_human_review?: boolean
  }
}

export const DEMO_CASE: CaseData = {
  id: 'demo-er-001',
  eventType: 'Emergency Room Visit',
  dateOfService: 'Mar 3, 2025',
  totalBilled: 4870,
  insurerPaid: 2840,
  patientOwes: 860,
  documents: [
    {
      id: 'bill-1',
      type: 'bill',
      provider: 'St. Vincent Hospital',
      amount: 2840,
      dueDate: 'Mar 28',
      dateOfService: 'Mar 3, 2025',
      position: [-4, 0.8, 0],
      lineItems: [
        { id: 'li-1', code: '99285', description: 'ER Visit – High Complexity', amount: 1200 },
        { id: 'li-2', code: '71046', description: 'Chest X-Ray, 2 views', amount: 380 },
        { id: 'li-3', code: '93010', description: 'ECG w/ interpretation', amount: 210 },
        { id: 'li-4', code: '71046', description: 'Chest X-Ray, 2 views', amount: 380, flagged: true },
        { id: 'li-5', code: '36415', description: 'Venipuncture', amount: 85 },
        { id: 'li-6', code: '85025', description: 'CBC w/ differential', amount: 145 },
        { id: 'li-7', code: '80053', description: 'Comprehensive metabolic panel', amount: 220 },
        { id: 'li-8', code: 'ROOM', description: 'Facility / Room Fee', amount: 220 },
      ],
    },
    {
      id: 'eob-1',
      type: 'eob',
      insurer: 'BlueCross BlueShield',
      paidAmount: 1980,
      patientOwe: 860,
      dateOfService: 'Mar 3, 2025',
      position: [4, 0.8, -0.5],
    },
    {
      id: 'bill-2',
      type: 'radiology',
      provider: 'Valley Radiology Associates',
      amount: 650,
      dueDate: 'Apr 5',
      dateOfService: 'Mar 3, 2025',
      position: [0.5, 3.2, -3],
      lineItems: [
        { id: 'li-r1', code: '71046', description: 'Chest X-Ray, 2 views', amount: 380, flagged: true },
        { id: 'li-r2', code: '71250', description: 'CT Chest w/o contrast', amount: 270 },
      ],
    },
    {
      id: 'bill-3',
      type: 'bill',
      provider: 'ER Physicians Group',
      amount: 1380,
      dueDate: 'Mar 31',
      dateOfService: 'Mar 3, 2025',
      position: [-0.5, -2.2, -3],
      lineItems: [
        { id: 'li-p1', code: '99285', description: 'ER Physician – Evaluation & Management', amount: 950 },
        { id: 'li-p2', code: '93000', description: 'ECG interpretation', amount: 130 },
        { id: 'li-p3', code: 'CONSULT', description: 'Specialist Consultation', amount: 300 },
      ],
    },
  ],
  issues: [
    {
      id: 'iss-1',
      severity: 'high',
      title: 'Possible duplicate charge',
      description: 'Chest X-Ray (71046) billed by both St. Vincent and Valley Radiology.',
      relatedDocIds: ['bill-1', 'bill-2'],
      confidence: 0.87,
      explanation:
        'Code 71046 (Chest X-Ray, 2 views) appears on both your hospital bill ($380) and your radiology bill ($380). This type of duplicate billing is one of the most common billing errors and may not be your responsibility to pay twice.',
    },
    {
      id: 'iss-2',
      severity: 'medium',
      title: 'Out-of-network physician concern',
      description: 'ER Physicians Group may not be in-network with your plan.',
      relatedDocIds: ['bill-3', 'eob-1'],
      confidence: 0.71,
      explanation:
        'Your EOB shows a higher patient responsibility for ER Physicians Group charges, which may indicate they are out-of-network. Even if the hospital is in-network, the physician group can be contracted separately. You may be able to appeal this under the No Surprises Act.',
    },
    {
      id: 'iss-3',
      severity: 'low',
      title: 'Itemized bill not provided',
      description: 'St. Vincent Hospital sent a summary bill, not a line-item breakdown.',
      relatedDocIds: ['bill-1'],
      confidence: 0.95,
      explanation:
        'You have a right to request a detailed itemized bill from any healthcare provider. This bill only shows category totals, which makes it difficult to verify individual charges. Requesting itemization often reveals billing errors.',
    },
  ],
  actions: [
    {
      id: 'act-1',
      title: 'Request itemized bill',
      icon: '📄',
      type: 'letter',
      whyItMatters:
        'This bill contains unclear line items. Itemization helps verify what each charge represents and often reveals hidden errors.',
      draft: `Dear St. Vincent Hospital Billing Department,

I am writing to formally request a complete, itemized bill for services rendered on March 3, 2025 (Account #[YOUR ACCOUNT NUMBER]).

I would like an itemized statement that includes:
• Each individual service or procedure with its billing code (CPT/ICD)
• The date each service was performed
• The charge amount for each individual item
• The name of the provider who performed each service

This is a right guaranteed under healthcare billing regulations. Please provide this information within 30 days.

If you have any questions, you can reach me at [YOUR CONTACT INFO].

Thank you for your prompt attention to this matter.

Sincerely,
[YOUR NAME]`,
    },
    {
      id: 'act-2',
      title: 'Dispute duplicate radiology charge',
      icon: '⚠️',
      type: 'dispute',
      whyItMatters:
        'Duplicate billing (same service charged twice) is a common error. You should only be responsible for one Chest X-Ray charge.',
      draft: `Dear Billing Department,

I have carefully reviewed my bill dated March 3, 2025 and have identified what appears to be a duplicate charge.

The issue: CPT code 71046 (Chest X-Ray, 2 views, $380) appears on both:
• My hospital bill from St. Vincent Hospital
• My separate radiology bill from Valley Radiology Associates

I am requesting that you review this charge and confirm whether both bills are correct, or whether this represents a duplicate billing error. If duplicate, please adjust the balance accordingly.

Please respond in writing within 30 days.

Sincerely,
[YOUR NAME]`,
    },
    {
      id: 'act-3',
      title: 'Appeal out-of-network charges',
      icon: '📞',
      type: 'call',
      whyItMatters:
        'Under the No Surprises Act, you may be protected from unexpected out-of-network charges at in-network facilities.',
      script: `When calling your insurer (number on back of insurance card):

Opening:
"Hello, I'm calling about a claim for an ER visit on March 3, 2025. My name is [NAME] and my member ID is [ID]. I'd like to understand why ER Physicians Group was processed as out-of-network when St. Vincent Hospital is in-network."

Key questions to ask:
1. "Is ER Physicians Group contracted with your network?"
2. "Does the No Surprises Act apply to my situation?"
3. "What is my appeal deadline for this claim?"
4. "Can I request a review of this claim?"

Reference: No Surprises Act (effective Jan 1, 2022) — protects patients from surprise bills when receiving emergency care at in-network facilities, even if the treating physician is out-of-network.`,
    },
  ],
  timeline: [
    { id: 'tl-1', label: 'Bill uploaded', completed: true },
    { id: 'tl-2', label: 'Bill reviewed', completed: true },
    { id: 'tl-3', label: 'Issues flagged', completed: true },
    { id: 'tl-4', label: 'Actions generated', completed: true },
    { id: 'tl-5', label: 'Provider contacted', completed: false },
    { id: 'tl-6', label: 'Insurer contacted', completed: false },
    { id: 'tl-7', label: 'Awaiting reply', completed: false },
    { id: 'tl-8', label: 'Resolved', completed: false },
  ],
}

export const BILL_STORM_FRAGMENTS = [
  '$4,220', '$1,380', '$650', '$2,840', 'Due Now',
  'Patient Responsibility', 'CPT 99285', 'Out-of-Network',
  'Adjustment', '$380', 'EOB', 'Claim #882741',
  'Past Due', 'CPT 71046', '$210', 'Deductible',
  'Coinsurance', '$85', 'Authorization Required',
  'CPT 93010', 'Balance Due', '$145', 'Denial',
  'Appeal Deadline', '$220', 'In-Network',
  'CPT 85025', '$950', 'Facility Fee', '$300',
  'Referral', 'Prior Auth', '$130', 'Secondary Insurance',
  'Copay', '$1,200', 'Non-covered Service',
]
