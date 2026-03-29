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

  /**
   * Shallow-merge `patch` into the case identified by `id` (URL id wins; body cannot change id).
   *
   * **Immutable:** `id` and `createdAt` in `patch` are ignored (rejected at HTTP layer with 400).
   * **Arrays:** `issues`, `actions`, `documents`, and `timeline` are **replaced entirely** when
   * present in `patch` — they are not deep-merged. Omit a key to leave that array unchanged.
   */
  update(id: string, patch: Partial<StoredCase>): StoredCase | undefined {
    const existing = cases.get(id)
    if (!existing) return undefined
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
