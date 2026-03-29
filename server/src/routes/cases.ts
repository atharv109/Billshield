import { Router } from 'express'
import { v4 as uuidv4 } from 'uuid'
import { store } from '../data/store'
import type { StoredCase } from '../data/mockData'

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

// POST /api/cases — manual case creation (not used by upload pipeline)
router.post('/', (req, res) => {
  const { id: _id, createdAt: _createdAt, ...body } = req.body as Partial<StoredCase>
  const newCase: StoredCase = {
    id: uuidv4(),
    eventType: body.eventType ?? 'Medical Bill Review',
    dateOfService: body.dateOfService ?? new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }),
    totalBilled: body.totalBilled ?? 0,
    insurerPaid: body.insurerPaid ?? 0,
    patientOwes: body.patientOwes ?? 0,
    documents: body.documents ?? [],
    issues: body.issues ?? [],
    actions: body.actions ?? [],
    timeline: body.timeline ?? [],
    status: body.status ?? 'active',
    createdAt: new Date().toISOString(),
  }
  store.create(newCase)
  res.status(201).json(newCase)
})

// PATCH /api/cases/:id — shallow merge; array fields replace wholesale when sent (see store.update)
router.patch('/:id', (req, res) => {
  const body = req.body as Record<string, unknown>
  if (
    Object.prototype.hasOwnProperty.call(body, 'id') ||
    Object.prototype.hasOwnProperty.call(body, 'createdAt')
  ) {
    res.status(400).json({
      error: 'Immutable fields cannot be patched',
      detail:
        'Remove id and createdAt from the body. The case id is only the URL :id. createdAt is set at creation.',
    })
    return
  }

  const updated = store.update(req.params.id, body as Partial<StoredCase>)
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
