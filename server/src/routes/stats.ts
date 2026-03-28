import { Router } from 'express'
import { store } from '../data/store'

const router = Router()

// GET /api/stats — aggregate stats across all cases
router.get('/', (_req, res) => {
  const cases = store.getAll()

  let totalBilled = 0
  let totalSaved = 0
  let totalIssues = 0
  let activeCases = 0
  let resolvedCases = 0

  for (const c of cases) {
    totalBilled += c.summary.totalBilled
    totalSaved += c.summary.potentialSavings
    totalIssues += c.issues.length
    if (c.status === 'active') activeCases++
    if (c.status === 'resolved') resolvedCases++
  }

  res.json({
    totalBilled,
    totalSaved,
    totalIssues,
    activeCases,
    resolvedCases,
    totalCases: cases.length,
  })
})

export default router
