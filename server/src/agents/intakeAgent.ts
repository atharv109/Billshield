import { v4 as uuidv4 } from 'uuid'
import type { IntakeFile, IntakeOutput } from '../types/agentTypes'

export function intakeAgent(files: IntakeFile[]): IntakeOutput {
  if (!files || files.length < 2) {
    return {
      status: 'error',
      file_count: files?.length ?? 0,
      doc_ids: [],
      issues: ['Please upload both your medical bill and your Explanation of Benefits (EOB) to continue.'],
    }
  }

  const doc_ids = files.map((_, i) => `doc_${i + 1}_${uuidv4().slice(0, 8)}`)

  return {
    status: 'ok',
    file_count: files.length,
    doc_ids,
    issues: [],
  }
}
