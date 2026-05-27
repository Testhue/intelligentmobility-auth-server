const Database = require('better-sqlite3')
const path = require('path')

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

module.exports = { getDb, createUser, findUserByUsername, findUserByEmail }
