const express = require('express')
const { v4: uuidv4 } = require('uuid')

const router = express.Router()

// Simple in-memory store
const cases = []

// GET /api/cases
router.get('/', (req, res) => {
  res.json(cases)
})

// GET /api/cases/:id
router.get('/:id', (req, res) => {
  const c = cases.find((c) => c.id === req.params.id)
  if (!c) return res.status(404).json({ error: 'Case not found' })
  res.json(c)
})

// POST /api/cases  (save a case)
router.post('/', (req, res) => {
  const c = { ...req.body, id: req.body.id || uuidv4(), createdAt: new Date().toISOString() }
  cases.unshift(c)
  res.status(201).json(c)
})

module.exports = router
