import { Router } from 'express'
import { v4 as uuidv4 } from 'uuid'
import { upload } from '../middleware/upload'
import { runPipeline } from '../pipeline/pipeline'
import { mapFinalOutputToFrontendCase } from '../services/outputMapper'
import type { IntakeFile } from '../types/agentTypes'

const router = Router()

// In-memory store of uploaded file buffers
const uploadedFiles = new Map<string, IntakeFile>()

// POST /api/upload — upload one or more files
router.post('/', upload.array('files', 10), (req, res) => {
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
    return { fileId, name: file.originalname, size: file.size, type: file.mimetype }
  })

  res.json({ files: results })
})

// POST /api/upload/analyze — run multi-agent pipeline on uploaded files
router.post('/analyze', async (req, res) => {
  const { fileIds } = req.body as { fileIds?: string[] }

  if (!fileIds || !Array.isArray(fileIds) || fileIds.length === 0) {
    res.status(400).json({ error: 'No fileIds provided' })
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
    res.json(caseData)
  } catch (err) {
    console.error('Pipeline error:', err)
    res.status(500).json({ error: 'Analysis failed', detail: String(err) })
  }
})

export default router

