class BotRepository {
  constructor(dao) {
    this.dao = dao
  }

  createTable() {
    const sql = `
    CREATE TABLE IF NOT EXISTS bots (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT UNIQUE,
      status TEXT,
      status_updated TEXT,
      isolation_activated TEXT)`
    return this.dao.run(sql)
  }

  create(name) {
    return this.dao.run(
      `INSERT INTO bots (name, status, status_updated)
      VALUES (?, "started", datetime('now'))`,
      [name])
  }

  updateStatus(status, id) {
    return this.dao.run(
      `UPDATE bots
      SET status = ?, status_updated = datetime('now')
      WHERE id = ?`,
      [status, id]
    )
  }

  updateIsolationMode(id) {
    return this.dao.run(
      `UPDATE bots
      SET isolation_activated = datetime('now')
      WHERE id = ?`,
      [id]
    )
  }

  removeIsolationMode(id) {
    return this.dao.run(
      `UPDATE bots
      SET isolation_activated = null
      WHERE id = ?`,
      [id]
    )
  }

  getByName(name) {
    return this.dao.get(
      `SELECT * FROM bots WHERE name = ?`,
      [name])
  }

}

module.exports = BotRepository;
