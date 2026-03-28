import { Router } from 'express'
import { v4 as uuidv4 } from 'uuid'
import { store } from '../data/store'
import type { CaseData } from '../data/mockData'

const router = Router()

// GET /api/cases
router.get('/', (_req, res) => {
  res.json(store.getAll())
})

// GET /api/cases/:id
router.get('/:id', (req, res) => {
  const c = store.getById(req.params.id)
  if (!c) {
    res.status(404).json({ error: 'Case not found' })
    return
  }
  res.json(c)
})

// POST /api/cases
router.post('/', (req, res) => {
  const body = req.body as Partial<CaseData>
  const newCase: CaseData = {
    id: uuidv4(),
    patientName: body.patientName ?? 'Unknown Patient',
    status: body.status ?? 'active',
    createdAt: new Date().toISOString(),
    summary: body.summary ?? { totalBilled: 0, insurerPaid: 0, patientOwes: 0, potentialSavings: 0 },
    documents: body.documents ?? [],
    issues: body.issues ?? [],
    actions: body.actions ?? [],
    timeline: body.timeline ?? [],
  }
  store.create(newCase)
  res.status(201).json(newCase)
})

// PATCH /api/cases/:id
router.patch('/:id', (req, res) => {
  const updated = store.update(req.params.id, req.body as Partial<CaseData>)
  if (!updated) {
    res.status(404).json({ error: 'Case not found' })
    return
  }
  res.json(updated)
})

// DELETE /api/cases/:id
router.delete('/:id', (req, res) => {
  const deleted = store.delete(req.params.id)
  if (!deleted) {
    res.status(404).json({ error: 'Case not found' })
    return
  }
  res.status(204).send()
})

export default router
