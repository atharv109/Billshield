import { Router } from 'express'
import { v4 as uuidv4 } from 'uuid'
import { upload } from '../middleware/upload'
import { analyzeBill } from '../services/claude'
import { store } from '../data/store'

const router = Router()

// In-memory file buffer store (just metadata + content for analysis)
const uploadedFiles = new Map<string, { name: string; mimetype: string; size: number; content: string }>()

// POST /api/upload — upload one or more files
router.post('/', upload.array('files', 10), (req, res) => {
  const files = req.files as Express.Multer.File[]
  if (!files || files.length === 0) {
    res.status(400).json({ error: 'No files uploaded' })
    return
  }

  const results = files.map((file) => {
    const fileId = uuidv4()
    // Store file content as base64 for potential Claude analysis
    uploadedFiles.set(fileId, {
      name: file.originalname,
      mimetype: file.mimetype,
      size: file.size,
      content: file.buffer.toString('base64'),
    })
    return { fileId, name: file.originalname, size: file.size, type: file.mimetype }
  })

  res.json({ files: results })
})

// POST /api/analyze — analyze uploaded files with Claude
router.post('/analyze', async (req, res) => {
  const { fileIds } = req.body as { fileIds?: string[] }

  // Build descriptions for Claude from file metadata
  const descriptions: string[] = []
  if (fileIds && Array.isArray(fileIds)) {
    for (const id of fileIds) {
      const f = uploadedFiles.get(id)
      if (f) {
        descriptions.push(`File: ${f.name} (${f.mimetype}, ${Math.round(f.size / 1024)}KB)`)
      }
    }
  }

  try {
    const caseData = await analyzeBill(descriptions)
    store.create(caseData)
    res.json(caseData)
  } catch (err) {
    res.status(500).json({ error: 'Analysis failed', detail: String(err) })
  }
})

export default router
