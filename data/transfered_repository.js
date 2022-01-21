class TransferedRepository {
  constructor(dao) {
    this.dao = dao
  }

  createTable() {
    const sql = `
      CREATE TABLE IF NOT EXISTS transfered (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        created TEXT DEFAULT (datetime('now')),
        status TEXT,
        total_balance REAL,
        twenty_four_hour_profit REAL,
        transferred REAL,
        spot_balance REAL,
        botId INTEGER,
        CONSTRAINT tasks_fk_botId FOREIGN KEY (botId)
          REFERENCES bots(id) ON UPDATE CASCADE ON DELETE CASCADE)`
    return this.dao.run(sql)
  }

  create(status, total_balance, twenty_four_hour_profit, transferred, spot_balance, botId) {
    return this.dao.run(
      `INSERT INTO transfered (status, total_balance, twenty_four_hour_profit,
        transferred, spot_balance, botId)
        VALUES (?, ?, ?, ?, ?, ?)`,
      [status, total_balance, twenty_four_hour_profit, transferred, spot_balance, botId])
  }

  getTransfers(botId) {
    return this.dao.all(
      `SELECT * FROM transfered WHERE botId = ?`,
      [botId])
  }

}

module.exports = TransferedRepository;
