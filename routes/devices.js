const express = require('express')
const { findDevicesByUserId, findDeviceByUserIdAndDeviceId, addDevice, removeDevice } = require('../db')
const { authMiddleware } = require('../middleware/auth')

const router = express.Router()

// GET /api/devices — 获取当前用户的设备列表
router.get('/', authMiddleware, (req, res) => {
  const devices = findDevicesByUserId(req.userId)
  res.json({ success: true, devices })
})

// POST /api/devices — 添加设备
router.post('/', authMiddleware, (req, res) => {
  const { deviceId, deviceName } = req.body

  if (!deviceId || !deviceId.trim()) {
    return res.status(400).json({ success: false, message: '请输入设备ID' })
  }
  if (!deviceName || !deviceName.trim()) {
    return res.status(400).json({ success: false, message: '请输入设备名称' })
  }

  const existing = findDeviceByUserIdAndDeviceId(req.userId, deviceId.trim())
  if (existing) {
    return res.status(409).json({ success: false, message: '该设备已添加' })
  }

  const id = addDevice(req.userId, deviceId.trim(), deviceName.trim())
  res.status(201).json({ success: true, device: { id, device_id: deviceId.trim(), device_name: deviceName.trim() } })
})

// DELETE /api/devices/:id — 删除设备
router.delete('/:id', authMiddleware, (req, res) => {
  const id = parseInt(req.params.id, 10)
  if (isNaN(id)) {
    return res.status(400).json({ success: false, message: '无效的设备ID' })
  }
  removeDevice(id, req.userId)
  res.json({ success: true, message: '设备已删除' })
})

module.exports = router
