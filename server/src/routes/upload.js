const express = require('express')
const upload = require('../middleware/upload')
const { analyzeBill } = require('../services/analysis')

const router = express.Router()

// POST /api/upload
// Upload + analyze in one request — required for Vercel (no persistent memory between calls)
router.post('/', (req, res) => {
  upload.array('files', 5)(req, res, async (err) => {
    if (err) return res.status(400).json({ error: err.message })

    const files = req.files
    if (!files || files.length === 0) {
      return res.status(400).json({ error: 'No files uploaded' })
    }

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
  }
})

module.exports = router
