require('dotenv').config()
const express = require('express')
const cors = require('cors')

const uploadRouter = require('./routes/upload')
const casesRouter = require('./routes/cases')

const app = express()
const PORT = process.env.PORT || 3001

// Allow all origins — frontend can be on any domain
app.use(cors())
app.use(express.json())

app.use((req, res, next) => {
  const start = Date.now()
  res.on('finish', () => console.log(`${req.method} ${req.path} ${res.statusCode} ${Date.now()-start}ms`))
  next()
})

app.get('/api/health', (req, res) => res.json({ ok: true }))
app.use('/api/upload', uploadRouter)
app.use('/api/cases', casesRouter)

app.use((err, req, res, next) => {
  console.error(err)
  res.status(err.status || 500).json({ error: err.message || 'Internal server error' })
})

app.listen(PORT, () => {
  console.log(`BillShield server running on port ${PORT}`)
  if (!process.env.GROQ_API_KEY) console.warn('⚠  GROQ_API_KEY not set')
})
