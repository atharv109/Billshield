const express = require('express')
<<<<<<< HEAD
const { v4: uuidv4 } = require('uuid')
=======
>>>>>>> c108011
const upload = require('../middleware/upload')
const { analyzeBill } = require('../services/analysis')

const router = express.Router()

<<<<<<< HEAD
// In-memory file store (cleared after analysis to save memory)
const fileStore = new Map()

// POST /api/upload
// Accepts multipart/form-data with field name "files"
router.post('/', (req, res, next) => {
  upload.array('files', 5)(req, res, (err) => {
    if (err) {
      return res.status(400).json({ error: err.message })
    }
=======
// POST /api/upload
// Upload + analyze in one request — required for Vercel (no persistent memory between calls)
router.post('/', (req, res) => {
  upload.array('files', 5)(req, res, async (err) => {
    if (err) return res.status(400).json({ error: err.message })
>>>>>>> c108011

    const files = req.files
    if (!files || files.length === 0) {
      return res.status(400).json({ error: 'No files uploaded' })
    }

<<<<<<< HEAD
    const results = files.map((file) => {
      const fileId = uuidv4()
      fileStore.set(fileId, {
        buffer: file.buffer,
        mimetype: file.mimetype,
        originalname: file.originalname,
        size: file.size,
      })
      return { fileId, name: file.originalname, size: file.size }
    })

    res.json({ files: results })
  })
})

// POST /api/upload/analyze
// Body: { fileIds: string[] }
router.post('/analyze', async (req, res, next) => {
  const { fileIds } = req.body

  if (!fileIds || !Array.isArray(fileIds) || fileIds.length === 0) {
    return res.status(400).json({ error: 'No fileIds provided' })
  }

  const files = fileIds.map((id) => fileStore.get(id)).filter(Boolean)

  if (files.length === 0) {
    return res.status(400).json({ error: 'Files not found — they may have expired' })
  }

  try {
    const caseData = await analyzeBill(files)
    // Clean up memory
    fileIds.forEach((id) => fileStore.delete(id))
    res.json(caseData)
  } catch (err) {
    console.error('Analysis error:', err)
    fileIds.forEach((id) => fileStore.delete(id))
    res.status(500).json({ error: 'Analysis failed: ' + err.message })
=======
    try {
      const caseData = await analyzeBill(files)
      res.json(caseData)
    } catch (e) {
      console.error('Analysis error:', e)
      res.status(500).json({ error: 'Analysis failed: ' + e.message })
    }
  })
})

// POST /api/upload/analyze — kept for backwards compat, redirects to same logic
// but accepts base64-encoded files in JSON body (useful if multipart fails on some hosts)
router.post('/analyze', express.json({ limit: '10mb' }), async (req, res) => {
  const { files: b64files } = req.body

  if (!b64files || !Array.isArray(b64files) || b64files.length === 0) {
    return res.status(400).json({ error: 'No files provided' })
  }

  try {
    const files = b64files.map(f => ({
      buffer: Buffer.from(f.data, 'base64'),
      mimetype: f.mimetype,
      originalname: f.name,
      size: f.size,
    }))
    const caseData = await analyzeBill(files)
    res.json(caseData)
  } catch (e) {
    console.error('Analysis error:', e)
    res.status(500).json({ error: 'Analysis failed: ' + e.message })
>>>>>>> c108011
  }
})

module.exports = router
