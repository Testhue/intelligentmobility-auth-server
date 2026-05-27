const jwt = require('jsonwebtoken')

if (!process.env.JWT_SECRET) {
  console.warn('WARNING: JWT_SECRET not set, using insecure dev fallback. Set JWT_SECRET env var in production.')
}
const JWT_SECRET = process.env.JWT_SECRET || 'harmony-campus-auth-secret-dev'

function generateToken(userId) {
  return jwt.sign({ userId }, JWT_SECRET, { expiresIn: '7d' })
}

function verifyToken(token) {
  return jwt.verify(token, JWT_SECRET)
}

function authMiddleware(req, res, next) {
  const header = req.headers.authorization
  if (!header || !header.startsWith('Bearer ')) {
    return res.status(401).json({ success: false, message: '未提供认证令牌' })
  }
  try {
    const decoded = verifyToken(header.slice(7))
    req.userId = decoded.userId
    next()
  } catch {
    return res.status(401).json({ success: false, message: '令牌无效或已过期' })
  }
}

module.exports = { generateToken, verifyToken, authMiddleware }
