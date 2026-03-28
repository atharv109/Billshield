import type { StoredCase } from './mockData'
import { DEMO_CASES } from './mockData'

// In-memory case store, seeded with demo data
const cases = new Map<string, StoredCase>()
DEMO_CASES.forEach((c) => cases.set(c.id, c))

export const store = {
  getAll(): StoredCase[] {
    return Array.from(cases.values())
  },

  getById(id: string): StoredCase | undefined {
    return cases.get(id)
  },

  create(c: StoredCase): StoredCase {
    cases.set(c.id, c)
    return c
  },

  update(id: string, patch: Partial<StoredCase>): StoredCase | undefined {
    const existing = cases.get(id)
    if (!existing) return undefined
    // id and createdAt are immutable — strip from patch before merging.
    // Note: array fields (issues, actions, documents) are fully replaced by the
    // patch, not merged. This is intentional — callers must send the full array.
    const { id: _id, createdAt: _createdAt, ...safePatch } = patch
    void _id
    void _createdAt
    const updated: StoredCase = { ...existing, ...safePatch }
    cases.set(id, updated)
    return updated
  },

  delete(id: string): boolean {
    return cases.delete(id)
  },
}
