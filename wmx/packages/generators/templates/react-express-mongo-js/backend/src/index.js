const express = require('express')
const cors = require('cors')
const dotenv = require('dotenv')
const { connectDB } = require('./db')

dotenv.config()

const app = express()
const PORT = process.env.PORT || 5000

app.use(cors())
app.use(express.json())

app.get('/api/health', (_req, res) => {
  res.json({ status: 'ok', project: '__PROJECT_NAME__' })
})

connectDB().then(() => {
  app.listen(PORT, () => {
    console.log(`__PROJECT_NAME__ backend running on http://localhost:${PORT}`)
  })
})
