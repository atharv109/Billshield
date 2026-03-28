import { v4 as uuidv4 } from 'uuid'
import type { FinalOutput, Flag, ActionOutput } from '../types/agentTypes'

/**
 * Maps the multi-agent FinalOutput to the shape expected by the frontend
 * (src/data/mockCase.ts:CaseData).
 */
export function mapFinalOutputToFrontendCase(final: FinalOutput): Record<string, unknown> {
  const s = final.final_output.summary
  const flags = final.final_output.flags
  const action = final.final_output.what_to_do_next

  const providerName = final.meta.provider_name ?? 'Medical Provider'
  const insurerName = final.meta.insurer_name ?? 'Insurance Company'
  const serviceDate = final.meta.first_service_date
    ?? new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })

  // ── Issues ────────────────────────────────────────────────────────────────
  const issues = flags.map((flag: Flag, idx: number) => ({
    id: `iss-${idx + 1}`,
    severity: flag.severity,
    title: flag.title,
    description: flag.explanation,
    relatedDocIds: ['doc-1', 'doc-2'],
    confidence: flag.confidence,
    explanation: flag.why_it_matters ?? flag.explanation,
  }))

  // ── Actions ───────────────────────────────────────────────────────────────
  const actions: Record<string, unknown>[] = action
    ? [mapAction(action, issues[0]?.id ?? 'iss-1')]
    : []

  // ── Documents (positional for 3D scene) ──────────────────────────────────
  const documents = [
    {
      id: 'doc-1',
      type: 'bill',
      provider: providerName,
      amount: s.provider_billed ?? 0,
      dateOfService: serviceDate,
      position: [-4, 0.8, 0] as [number, number, number],
    },
    {
      id: 'doc-2',
      type: 'eob',
      insurer: insurerName,
      paidAmount: s.insurance_paid ?? 0,
      patientOwe: s.you_may_owe ?? 0,
      dateOfService: serviceDate,
      position: [4, 0.8, -0.5] as [number, number, number],
    },
  ]

  // ── Timeline ──────────────────────────────────────────────────────────────
  const timeline = [
    { id: 'tl-1', label: 'Bill uploaded', completed: true },
    { id: 'tl-2', label: 'Text extracted', completed: true },
    { id: 'tl-3', label: 'Issues flagged', completed: flags.length > 0 },
    { id: 'tl-4', label: 'Actions generated', completed: actions.length > 0 },
    { id: 'tl-5', label: 'Provider contacted', completed: false },
    { id: 'tl-6', label: 'Insurer contacted', completed: false },
    { id: 'tl-7', label: 'Awaiting reply', completed: false },
    { id: 'tl-8', label: 'Resolved', completed: false },
  ]

  return {
    id: uuidv4(),
    eventType: 'Medical Bill Review',
    dateOfService: serviceDate,
    totalBilled: s.provider_billed ?? 0,
    insurerPaid: s.insurance_paid ?? 0,
    patientOwes: s.you_may_owe ?? 0,
    documents,
    issues,
    actions,
    timeline,
    // Extra: full agent output for debug/scoring UI
    agentOutput: final,
  }
}

function mapAction(action: ActionOutput, issueId: string): Record<string, unknown> {
  const base = {
    id: 'act-1',
    issueId,
    title: action.reason_for_action,
    icon: action.action_type === 'call_script' ? '📞' : '📄',
    whyItMatters: `Based on the documents provided, this action targets your ${action.contact_target} regarding: ${action.reason_for_action}`,
  }

  if (action.action_type === 'call_script') {
    return { ...base, type: 'call', script: action.content }
  }
  return { ...base, type: 'letter', draft: action.content }
}
