const rjson = require('relaxed-json')

module.exports = {
  parseWebHook: function(content) {
    let updates = [];

    if (!content) {
      return updates
    }

    let json = null
    if (typeof content === "object") {
      json = object
    } else if (typeof content === "string" && content.indexOf('{') === 0) {
      try {
        const cleaned = rjson.transform(content)
          .replace(/(\r\n|\n|\r|\'|\s\s)/gm, "")
          .replaceAll('\\n', '\\\\n')
        json = JSON.parse(cleaned)
      } catch (e) {
        console.log(e)
        console.log('Unable to parse content');
      }
    }

    if (json && json.embeds && json.embeds[0]) {
      const embed = json.embeds[0];

      if (embed.title.includes("Skipped: Isolation Mode")) {
        updates.push({
          repo_type: "BOT",
          isolation_mode: true
        })
      } else if (embed.title.includes("Opened")) {
        const update = this.parseDescription(embed.description)
        update.repo_type = "TRADE_OPENED"
        updates.push(update)
      } else if (embed.title.includes("Closed")) {
        const update = this.parseDescription(embed.description)
        update.repo_type = "TRADE_CLOSED"
        updates.push(update)
      }
    } else if (typeof content === "string") {
      if (content.includes("Bot Started")) {
        updates.push({
          repo_type: "BOT",
          status: "started"
        })
      } else if (content.includes("Bot Stopped")) {
        updates.push({
          repo_type: "BOT",
          status: "stopped"
        })
      } else if (content.includes("Bot Paused")) {
        updates.push({
          repo_type: "BOT",
          status: "paused"
        })
      } else if (content.includes("Bot Resumed")) {
        updates.push({
          repo_type: "BOT",
          status: "resumed"
        })
      } else if (content.startsWith("**QUARANTINED**")) {
        const symbols = /\*\*QUARANTINED\*\*: (.*)/.exec(content)[1]
        updates = updates.concat(symbols.split(', ').map(function(symbol) {
          return {
            repo_type: "QUARANTINED",
            symbol: symbol
          }
        }))
      } else if (content.startsWith("**UNQUARANTINED**")) {
        const symbols = /\*\*UNQUARANTINED\*\*: (.*)/.exec(content)[1]
        updates = updates.concat(symbols.split(', ').map(function(symbol) {
          return {
            repo_type: "UNQUARANTINED",
            symbol: symbol
          }
        }))
      } else if (content.startsWith("**OPEN POSITIONS - NOT QUARANTINED**")) {
        const symbols = /\*\*OPEN POSITIONS \- NOT QUARANTINED\*\*: (.*)/.exec(content)[1]
        updates = updates.concat(symbols.split(', ').map(function(symbol) {
          return {
            repo_type: "PENDING_QUARANTINE",
            symbol: symbol
          }
        }))
      } else if (content.startsWith("**TRANSFER**")) {
        let update = {
          repo_type: "TRANSFER"
        }
        update.status = /TRANSFER\*\*: (.*)  \*\*/.exec(content)[1]
        if (update.status === "SUCCESS") {
          update.total_balance = /totalBalance\*\*: (.*)  \*\*/.exec(content)[1]
          update.twenty_four_hour_profit = /24hourProfit\*\*: (.*)  \*\*/.exec(content)[1]
          update.transferred = /transferred\*\*: (.*)  \*\*/.exec(content)[1]
          update.spot_balance = /spotBalance\*\*: (.*)/.exec(content)[1]
        } else {
          update.total_balance = /totalBalance\*\*: (.*)  \*\*/.exec(content)[1]
          update.twenty_four_hour_profit = /24hourProfit\*\*: (.*)/.exec(content)[1]
        }
        updates.push(update)
      }
    } else {
      console.log("Content received is not JSON or string")
      console.log(typeof content)
    }
    return updates
  },
  parseDescription: function(description) {
    const update = {}
    description.split("\n").map(function(line) {
      const l = line.split(': ')
      if (l[0] === 'Pair') {
        update.symbol = l[1]
      } else if (l[0] === 'Direction') {
        update.direction = l[1]
      } else if (l[0] === 'Profit') {
        update.profit = l[1]
      } else if (l[0] === 'Number of Buys') {
        update.count = l[1]
      }
    });
    return update;
  }
}
