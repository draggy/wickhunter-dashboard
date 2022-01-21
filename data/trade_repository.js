class TradeRepository {
  constructor(dao) {
    this.dao = dao
  }

  createTable() {
    const sql = `
      CREATE TABLE IF NOT EXISTS trades (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        created TEXT DEFAULT (datetime('now')),
        closed TEXT,
        symbol TEXT,
        direction TEXT,
        count INTEGER DEFAULT 1,
        price REAL,
        profit REAL,
        botId INTEGER,
        CONSTRAINT tasks_fk_botId FOREIGN KEY (botId)
          REFERENCES bots(id) ON UPDATE CASCADE ON DELETE CASCADE)`
    return this.dao.run(sql)
  }

  create(symbol, direction, botId) {
    return this.dao.run(
      `INSERT INTO trades (symbol, direction, botId)
        VALUES (?, ?, ?)`,
      [symbol, direction, botId])
  }

  updateCount(count, id) {
    return this.dao.run(
      `UPDATE trades
      SET count = ?
      WHERE id = ?`,
      [count, id]
    )
  }

  closeTrade(count, price, profit, id) {
    return this.dao.run(
      `UPDATE trades
      SET closed = datetime('now'), count = ?, price = ?, profit = ?
      WHERE id = ?`,
      [count, price, profit, id]
    )
  }

  getTrades(botId) {
    return this.dao.all(
      `SELECT * FROM trades WHERE botId = ?`,
      [botId])
  }

  getOpenTrade(symbol, direction, botId) {
    return this.dao.get(
      `SELECT * FROM trades
      WHERE closed is null and symbol=? and direction = ? and botId = ?`,
      [symbol, direction, botId])
  }

  getOpenTrades(botId) {
    return this.dao.all(
      `SELECT * FROM trades WHERE closed is null and botId = ?`,
      [botId])
  }

  getTotalProfit(botId) {
    return this.dao.get(
      `SELECT SUM(profit) FROM trades
      WHERE closed is not null and botId = ?`,
      [botId])
  }

  getTotalProfitBySymbol(symbol, botId) {
    return this.dao.all(
      `SELECT symbol, SUM(profit) FROM trades
      WHERE closed is not null and symbol = ? and botId = ?
      GROUP BY symbol`,
      [symbol, botId])
  }

}

module.exports = TradeRepository;
