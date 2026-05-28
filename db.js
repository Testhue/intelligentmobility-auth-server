const Database = require('better-sqlite3')
const path = require('path')
const fs = require('fs')

const DB_PATH = path.join(__dirname, 'data.db')

let db

function getDb() {
  if (!db) {
    db = new Database(DB_PATH)
    db.pragma('journal_mode = WAL')
    db.pragma('foreign_keys = ON')
    initDb()
  }
  return db
}

function initDb() {
  db.exec(`
    CREATE TABLE IF NOT EXISTS users (
      id            INTEGER PRIMARY KEY AUTOINCREMENT,
      username      TEXT UNIQUE NOT NULL,
      email         TEXT UNIQUE NOT NULL,
      password_hash TEXT NOT NULL,
      created_at    DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at    DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `)
  db.exec(`
    CREATE TRIGGER IF NOT EXISTS users_updated_at
      AFTER UPDATE ON users
      FOR EACH ROW
      BEGIN
        UPDATE users SET updated_at = CURRENT_TIMESTAMP WHERE id = OLD.id;
      END
  `)
  db.exec(`
    CREATE TABLE IF NOT EXISTS user_devices (
      id          INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id     INTEGER NOT NULL,
      device_id   TEXT NOT NULL,
      device_name TEXT NOT NULL DEFAULT '',
      created_at  DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users(id),
      UNIQUE(user_id, device_id)
    )
  `)
  seedUsers()
}

function seedUsers() {
  const seedPath = path.join(__dirname, 'seed-users.json')
  if (!fs.existsSync(seedPath)) return

  const count = db.prepare('SELECT COUNT(*) as count FROM users').get()
  if (count.count > 0) return

  const users = JSON.parse(fs.readFileSync(seedPath, 'utf-8'))
  const insert = db.prepare(
    'INSERT OR IGNORE INTO users (username, email, password_hash) VALUES (?, ?, ?)'
  )
  const tx = db.transaction(() => {
    for (const u of users) {
      insert.run(u.username, u.email, u.password_hash)
    }
  })
  tx()
  console.log(`[seed] Inserted ${users.length} users from seed-users.json`)
}

function createUser(username, email, passwordHash) {
  const stmt = getDb().prepare(
    'INSERT INTO users (username, email, password_hash) VALUES (?, ?, ?)'
  )
  const result = stmt.run(username, email, passwordHash)
  return result.lastInsertRowid
}

function findUserByUsername(username) {
  const stmt = getDb().prepare('SELECT * FROM users WHERE username = ?')
  return stmt.get(username)
}

function findUserByEmail(email) {
  const stmt = getDb().prepare('SELECT * FROM users WHERE email = ?')
  return stmt.get(email)
}

function findUserById(id) {
  const stmt = getDb().prepare('SELECT * FROM users WHERE id = ?')
  return stmt.get(id)
}

function updatePassword(id, passwordHash) {
  const stmt = getDb().prepare('UPDATE users SET password_hash = ? WHERE id = ?')
  stmt.run(passwordHash, id)
}

function findDevicesByUserId(userId) {
  const stmt = getDb().prepare('SELECT * FROM user_devices WHERE user_id = ? ORDER BY created_at ASC')
  return stmt.all(userId)
}

function findDeviceByUserIdAndDeviceId(userId, deviceId) {
  const stmt = getDb().prepare('SELECT * FROM user_devices WHERE user_id = ? AND device_id = ?')
  return stmt.get(userId, deviceId)
}

function addDevice(userId, deviceId, deviceName) {
  const stmt = getDb().prepare('INSERT INTO user_devices (user_id, device_id, device_name) VALUES (?, ?, ?)')
  const result = stmt.run(userId, deviceId, deviceName)
  return result.lastInsertRowid
}

function removeDevice(id, userId) {
  const stmt = getDb().prepare('DELETE FROM user_devices WHERE id = ? AND user_id = ?')
  stmt.run(id, userId)
}

module.exports = { getDb, createUser, findUserByUsername, findUserByEmail, findUserById, updatePassword, findDevicesByUserId, findDeviceByUserIdAndDeviceId, addDevice, removeDevice }
