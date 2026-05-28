const express = require('express')
const bcrypt = require('bcryptjs')
const { createUser, findUserByUsername, findUserByEmail, findUserById, updatePassword } = require('../db')
const { generateToken, authMiddleware } = require('../middleware/auth')

const router = express.Router()
const SALT_ROUNDS = 10

// POST /api/auth/register
router.post('/register', (req, res) => {
  const { username, email, password } = req.body

  if (!username || !email || !password) {
    return res.status(400).json({ success: false, message: '请填写所有必填字段' })
  }
  if (username.length < 3 || username.length > 20) {
    return res.status(400).json({ success: false, message: '用户名长度需在3-20个字符之间' })
  }
  if (password.length < 6 || password.length > 20) {
    return res.status(400).json({ success: false, message: '密码长度需在6-20个字符之间' })
  }

  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  if (!emailRegex.test(email)) {
    return res.status(400).json({ success: false, message: '邮箱格式不正确' })
  }

  const existingUser = findUserByUsername(username)
  if (existingUser) {
    return res.status(409).json({ success: false, message: '用户名已存在' })
  }

  const existingEmail = findUserByEmail(email)
  if (existingEmail) {
    return res.status(409).json({ success: false, message: '邮箱已被注册' })
  }

  try {
    const passwordHash = bcrypt.hashSync(password, SALT_ROUNDS)
    createUser(username, email, passwordHash)
    res.status(201).json({ success: true, message: '注册成功' })
  } catch (err) {
    console.error('Register error:', err)
    res.status(500).json({ success: false, message: '服务器内部错误' })
  }
})

// POST /api/auth/login
router.post('/login', (req, res) => {
  const { username, password } = req.body

  if (!username || !password) {
    return res.status(400).json({ success: false, message: '请填写用户名和密码' })
  }

  const user = findUserByUsername(username)
  if (!user) {
    return res.status(401).json({ success: false, message: '用户名或密码错误' })
  }

  const valid = bcrypt.compareSync(password, user.password_hash)
  if (!valid) {
    return res.status(401).json({ success: false, message: '用户名或密码错误' })
  }

  const token = generateToken(user.id)
  res.json({ success: true, token, user: { id: user.id, username: user.username, email: user.email }, message: '登录成功' })
})

// GET /api/auth/check-username?username=xxx
router.get('/check-username', (req, res) => {
  const { username } = req.query
  if (!username) {
    return res.status(400).json({ available: false, message: '请提供用户名' })
  }
  const user = findUserByUsername(username)
  res.json({ available: !user })
})

// PUT /api/auth/change-password
router.put('/change-password', authMiddleware, (req, res) => {
  const { oldPassword, newPassword } = req.body

  if (!oldPassword || !newPassword) {
    return res.status(400).json({ success: false, message: '请填写旧密码和新密码' })
  }
  if (newPassword.length < 6 || newPassword.length > 20) {
    return res.status(400).json({ success: false, message: '新密码长度需在6-20个字符之间' })
  }

  const user = findUserById(req.userId)
  if (!user) {
    return res.status(404).json({ success: false, message: '用户不存在' })
  }

  const valid = bcrypt.compareSync(oldPassword, user.password_hash)
  if (!valid) {
    return res.status(403).json({ success: false, message: '旧密码错误' })
  }

  const passwordHash = bcrypt.hashSync(newPassword, SALT_ROUNDS)
  updatePassword(user.id, passwordHash)
  res.json({ success: true, message: '密码修改成功' })
})

module.exports = router
