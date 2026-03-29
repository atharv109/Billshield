import 'dotenv/config'
import express, { type ErrorRequestHandler } from 'express'
import cors from 'cors'
import rateLimit from 'express-rate-limit'
import casesRouter from './routes/cases'
import uploadRouter from './routes/upload'
import statsRouter from './routes/stats'

/** Comma-separated URLs in CORS_ORIGIN, or default dev origins. */
function parseCorsOrigins(): string[] {
  const raw = process.env.CORS_ORIGIN
  if (!raw?.trim()) {
    return ['http://localhost:5173', 'http://127.0.0.1:5173']
  }
  return raw
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean)
}

const app = express()
const PORT = process.env.PORT ?? 3001

const fifteenMinutes = 15 * 60 * 1000

const uploadLimiter = rateLimit({
  windowMs: fifteenMinutes,
  max: 10,
  message: { error: 'Too many upload requests from this IP, try again later.' },
  standardHeaders: 'draft-7',
  legacyHeaders: false,
})

const generalLimiter = rateLimit({
  windowMs: fifteenMinutes,
  max: 100,
  message: { error: 'Too many requests from this IP, try again later.' },
  standardHeaders: 'draft-7',
  legacyHeaders: false,
})

app.use(cors({ origin: parseCorsOrigins() }))
app.use(express.json())

// Request logging
app.use((req, res, next) => {
  const start = Date.now()
  res.on('finish', () => {
    console.log(`${req.method} ${req.path} ${res.statusCode} ${Date.now() - start}ms`)
  })
  next()
})

// Health check
app.get('/api/health', generalLimiter, (_req, res) => {
  res.json({ ok: true, timestamp: new Date().toISOString() })
})

app.use('/api/cases', generalLimiter, casesRouter)
app.use('/api/upload', uploadLimiter, uploadRouter)
app.use('/api/stats', generalLimiter, statsRouter)

const errorHandler: ErrorRequestHandler = (err, req, res, _next) => {
  console.error(`[error] ${req.method} ${req.path}`, err)
  if (res.headersSent) {
    return
  }
  const status =
    err && typeof err === 'object' && 'status' in err && typeof (err as { status: unknown }).status === 'number'
      ? (err as { status: number }).status
      : err && typeof err === 'object' && 'statusCode' in err && typeof (err as { statusCode: unknown }).statusCode === 'number'
        ? (err as { statusCode: number }).statusCode
        : 500
  const safeStatus = status >= 400 && status < 600 ? status : 500
  const message = err instanceof Error ? err.message : 'Internal server error'
  res.status(safeStatus).json({ error: message })
}

app.use(errorHandler)

if (require.main === module) {
  app.listen(PORT, () => {
    console.log(`BillShield server running on http://localhost:${PORT}`)
    if (!process.env.ANTHROPIC_API_KEY) {
      console.warn('⚠  ANTHROPIC_API_KEY not set — Claude agents will use deterministic fallback')
    }
  })
}

export default app
