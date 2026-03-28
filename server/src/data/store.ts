import type { CaseData } from './mockData'
import { DEMO_CASES } from './mockData'

// In-memory case store, seeded with demo data
const cases = new Map<string, CaseData>()
DEMO_CASES.forEach((c) => cases.set(c.id, c))

export const store = {
  getAll(): CaseData[] {
    return Array.from(cases.values())
  },

  getById(id: string): CaseData | undefined {
    return cases.get(id)
  },

  create(c: CaseData): CaseData {
    cases.set(c.id, c)
    return c
  },

  update(id: string, patch: Partial<CaseData>): CaseData | undefined {
    const existing = cases.get(id)
    if (!existing) return undefined
    const updated = { ...existing, ...patch }
    cases.set(id, updated)
    return updated
  },

  delete(id: string): boolean {
    return cases.delete(id)
  },
}
