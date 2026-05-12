import express from 'express'
import cors from 'cors'
import cookieParser from 'cookie-parser'
import { logger } from './lib/logger.js'

const app = express()

const allowedOrigin = process.env.CLIENT_URL || 'http://localhost:5173'
if (allowedOrigin === '*') {
  throw new Error('CLIENT_URL must be a specific origin, not a wildcard')
}

app.use(cors({
  origin: allowedOrigin,
  credentials: true,
}))
app.use(express.json())
app.use(cookieParser())

// Routes will be mounted here in subsequent tasks
app.get('/api/health', (req, res) => res.json({ status: 'ok' }))

app.use((err, req, res, next) => {
  logger.error(err)
  res.status(err.status || 500).json({ error: err.message || 'Internal server error' })
})

const PORT = process.env.PORT || 3001
app.listen(PORT, () => logger.info(`Server running on port ${PORT}`))

export default app
