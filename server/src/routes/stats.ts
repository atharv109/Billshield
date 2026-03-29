import { Router } from 'express'
import { store } from '../data/store'

const router = Router()

// GET /api/stats — aggregate stats across all cases in the store
router.get('/', (_req, res) => {
  const cases = store.getAll()

  let totalBilled = 0
  let totalInsurerPaid = 0
  let totalPatientOwes = 0
  let totalIssues = 0
  let activeCases = 0
  let resolvedCases = 0

  for (const c of cases) {
    totalBilled += c.totalBilled
    totalInsurerPaid += c.insurerPaid
    totalPatientOwes += c.patientOwes
    totalIssues += c.issues.length
    if (c.status === 'active') activeCases++
    if (c.status === 'resolved') resolvedCases++
  }

  res.json({
    totalBilled,
    totalInsurerPaid,
    totalPatientOwes,
    totalIssues,
    activeCases,
    resolvedCases,
    totalCases: cases.length,
  })
})

export default router
