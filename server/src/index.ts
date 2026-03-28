import express from 'express'
import cors from 'cors'
import casesRouter from './routes/cases'
import uploadRouter from './routes/upload'
import statsRouter from './routes/stats'

const app = express()
const PORT = process.env.PORT ?? 3001

app.use(cors({ origin: ['http://localhost:5173', 'http://127.0.0.1:5173'] }))
app.use(express.json())

// Health check
app.get('/api/health', (_req, res) => {
  res.json({ ok: true, timestamp: new Date().toISOString() })
})

app.use('/api/cases', casesRouter)
app.use('/api/upload', uploadRouter)
app.use('/api/stats', statsRouter)

app.listen(PORT, () => {
  console.log(`BillShield server running on http://localhost:${PORT}`)
  if (!process.env.ANTHROPIC_API_KEY) {
    console.warn('⚠  ANTHROPIC_API_KEY not set — Claude analysis will use demo fallback')
  }
})

export default app
