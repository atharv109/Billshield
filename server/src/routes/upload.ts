import { Router } from 'express'
import { v4 as uuidv4 } from 'uuid'
import { upload } from '../middleware/upload'
import { runPipeline } from '../pipeline/pipeline'
import { mapFinalOutputToFrontendCase } from '../services/outputMapper'
import { store } from '../data/store'
import type { IntakeFile } from '../types/agentTypes'
import type { StoredCase } from '../data/mockData'

const router = Router()

// In-memory store of uploaded file buffers
const uploadedFiles = new Map<string, IntakeFile>()

// POST /api/upload — upload one or more files
// Multer is invoked manually so fileFilter errors return 400 instead of 500.
router.post(
  '/',
  (req, res, next) => {
    upload.array('files', 10)(req, res, (err: unknown) => {
      if (err) {
        res.status(400).json({ error: err instanceof Error ? err.message : 'File upload failed' })
        return
      }
      next()
    })
  },
  (req, res) => {
    const files = req.files as Express.Multer.File[]
    if (!files || files.length === 0) {
      res.status(400).json({ error: 'No files uploaded' })
      return
    }

    const results = files.map((file) => {
      const fileId = uuidv4()
      uploadedFiles.set(fileId, {
        file_id: fileId,
        filename: file.originalname,
        mimetype: file.mimetype,
        size: file.size,
        buffer: file.buffer,
      })
      // Expire buffer after 10 minutes if analyze is never called
      setTimeout(() => uploadedFiles.delete(fileId), 10 * 60 * 1000)
      return { fileId, name: file.originalname, size: file.size, type: file.mimetype }
    })

    res.json({ files: results })
  },
)

// POST /api/upload/analyze — run multi-agent pipeline on uploaded files
router.post('/analyze', async (req, res) => {
  const { fileIds } = req.body as { fileIds?: string[] }

  if (!fileIds || !Array.isArray(fileIds) || fileIds.length === 0) {
    res.status(400).json({ error: 'No fileIds provided' })
    return
  }

  if (fileIds.some((id) => typeof id !== 'string')) {
    res.status(400).json({ error: 'All fileIds must be strings' })
    return
  }

  const intakeFiles: IntakeFile[] = []
  for (const id of fileIds) {
    const f = uploadedFiles.get(id)
    if (f) intakeFiles.push(f)
  }

  if (intakeFiles.length === 0) {
    res.status(400).json({ error: 'No uploaded files found for the given fileIds' })
    return
  }

  try {
    const result = await runPipeline(intakeFiles)

    if ('error' in result && result.error) {
      res.status(422).json({ error: result.message })
      return
    }

    const caseData = mapFinalOutputToFrontendCase(result as Exclude<typeof result, { error: true }>)

    // Persist to store so /api/cases and /api/stats reflect real analyses.
    store.create({ ...caseData, status: 'active', createdAt: new Date().toISOString() } as StoredCase)

    res.json(caseData)
  } catch (err) {
    console.error('Pipeline error:', err)
    res.status(500).json({ error: 'Analysis failed', detail: String(err) })
  } finally {
    // Release file buffers regardless of outcome — prevents memory accumulation
    for (const id of fileIds) uploadedFiles.delete(id)
  }
})

export default router

