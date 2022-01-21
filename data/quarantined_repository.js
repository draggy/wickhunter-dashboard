class QuarantinedRepository {
  constructor(dao) {
    this.dao = dao
  }

  createTable() {
    const sql = `
      CREATE TABLE IF NOT EXISTS quarantined (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        updated TEXT DEFAULT (datetime('now')),
        symbol TEXT,
        pending BOOLEAN DEFAULT 0,
        unquarantined BOOLEAN DEFAULT 0,
        botId INTEGER,
        CONSTRAINT tasks_fk_botId FOREIGN KEY (botId)
          REFERENCES bots(id) ON UPDATE CASCADE ON DELETE CASCADE)`
    return this.dao.run(sql)
  }

  create(symbol, pending, botId) {
    return this.dao.run(
      `INSERT INTO quarantined (symbol, pending, botId)
        VALUES (?, ?, ?)`,
      [symbol, pending, botId])
  }

  getQuarantined(botId) {
    return this.dao.all(
      `SELECT * FROM quarantined WHERE pending = 0 and unquarantined = null and botId = ?`,
      [botId])
  }

  getQuarantinedBySymbol(symbol, botId) {
    return this.dao.get(
      `SELECT * FROM quarantined WHERE symbol = ? and botId = ?`,
      [symbol, botId])
  }

  getPendingQuarantined(botId) {
    return this.dao.all(
      `SELECT * FROM quarantined WHERE pending = 1 and unquarantined = null and botId = ?`,
      [botId])
  }

  getAllQuarantined(botId) {
    return this.dao.all(
      `SELECT * FROM quarantined WHERE unquarantined = null and botId = ?`,
      [botId])
  }

  setQuarantined(id) {
    return this.dao.run(
      `UPDATE quarantined
        SET updated = datetime('now'),
        unquarantined = 0,
        pending = 0
      WHERE id = ?`,
      [id]
    )
  }

  setUnquarantined(id) {
    return this.dao.run(
      `UPDATE quarantined
        SET updated = datetime('now'),
        unquarantined = 1,
        pending = 0
      WHERE id = ?`,
      [id]
    )
  }

  setPending(id) {
    return this.dao.run(
      `UPDATE quarantined
        SET updated = datetime('now'),
        unquarantined = 0,
        pending = 1
      WHERE id = ?`,
      [id]
    )
  }

}

module.exports = QuarantinedRepository;
