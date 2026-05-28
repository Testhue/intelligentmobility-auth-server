const express = require('express')
const cors = require('cors')

const authRoutes = require('./routes/auth')
const deviceRoutes = require('./routes/devices')

const app = express()
const PORT = process.env.PORT || 3000

app.use(cors())
app.use(express.json())

app.use('/api/auth', authRoutes)
app.use('/api/devices', deviceRoutes)

app.get('/api/health', (req, res) => {
  res.json({ status: 'ok' })
})

app.use((err, req, res, next) => {
  console.error('Unhandled error:', err)
  res.status(500).json({ success: false, message: '服务器内部错误' })
})

app.listen(PORT, '0.0.0.0', () => {
  console.log(`Auth server running on http://0.0.0.0:${PORT}`)
})
