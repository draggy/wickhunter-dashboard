module.exports = {
  parseWebHook: function(text) {
    let updates = [];

    if (text === "Bot Started") {
      updates.push({
        repo_type: "BOT",
        status: "started"
      })
    } else if (text === "Bot Stopped") {
      updates.push({
        repo_type: "BOT",
        status: "stopped"
      })
    } else if (text === "Bot Paused") {
      updates.push({
        repo_type: "BOT",
        status: "paused"
      })
    } else if (text === "Bot Resumed") {
      updates.push({
        repo_type: "BOT",
        status: "resumed"
      })
    } else if (text === "Skipped: Isolation Mode.") {
      updates.push({
        repo_type: "BOT",
        isolation_mode: true
      })
    } else if (text.startsWith("Trade Opened for")) {
      let update = {
        repo_type: "TRADE_OPENED"
      }
      update.symbol = /Trade Opened for (.*)  \*\*Direction/.exec(text)[1]
      update.direction = /Direction:\*\* (.*)  \*\*/.exec(text)[1]
      update.count = /Buy Count:\*\* (.*)/.exec(text)[1]
      updates.push(update)
    } else if (text.startsWith("Trade Closed for")) {
      let update = {
        repo_type: "TRADE_CLOSED"
      }
      update.symbol = /Trade Closed for (.*)  \*\*Direction/.exec(text)[1]
      update.direction = /Direction:\*\* (.*)  \*\*Price/.exec(text)[1]
      update.price = /Price:\*\* (.*)  \*\*Buy Count/.exec(text)[1]
      update.count = /Buy Count:\*\* (.*)  \*\*/.exec(text)[1]
      update.profit = /Profit:\*\* (.*) USDT/.exec(text)[1]
      updates.push(update)
    } else if (text.startsWith("**QUARANTINED**")) {
      const symbols = /\*\*QUARANTINED\*\*: (.*)/.exec(text)[1]
      updates = updates.concat(symbols.split(', ').map(function(symbol) {
        return {
          repo_type: "QUARANTINED",
          symbol: symbol
        }
      }))
    } else if (text.startsWith("**UNQUARANTINED**")) {
      const symbols = /\*\*UNQUARANTINED\*\*: (.*)/.exec(text)[1]
      updates = updates.concat(symbols.split(', ').map(function(symbol) {
        return {
          repo_type: "UNQUARANTINED",
          symbol: symbol
        }
      }))
    } else if (text.startsWith("**OPEN POSITIONS - NOT QUARANTINED**")) {
      const symbols = /\*\*OPEN POSITIONS \- NOT QUARANTINED\*\*: (.*)/.exec(text)[1]
      updates = updates.concat(symbols.split(', ').map(function(symbol) {
        return {
          repo_type: "PENDING_QUARANTINE",
          symbol: symbol
        }
      }))
    } else if (text.startsWith("**TRANSFER**")) {
      let update = {
        repo_type: "TRANSFER"
      }
      update.status = /TRANSFER\*\*: (.*)  \*\*/.exec(text)[1]
      if (update.status === "SUCCESS") {
        update.total_balance = /totalBalance\*\*: (.*)  \*\*/.exec(text)[1]
        update.twenty_four_hour_profit = /24hourProfit\*\*: (.*)  \*\*/.exec(text)[1]
        update.transferred = /transferred\*\*: (.*)  \*\*/.exec(text)[1]
        update.spot_balance = /spotBalance\*\*: (.*)/.exec(text)[1]
      } else {
        update.total_balance = /totalBalance\*\*: (.*)  \*\*/.exec(text)[1]
        update.twenty_four_hour_profit = /24hourProfit\*\*: (.*)/.exec(text)[1]
      }
      updates.push(update)
    }

    return updates
  }
}
