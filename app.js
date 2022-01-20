const express = require('express');
const morgan = require('morgan');
const bodyParser = require('body-parser');
const config = require('config');
const {
  WebhookClient,
  MessageAttachment,
  MessageEmbed
} = require('discord.js');
const fs = require('fs');

const AppDAO = require('./data/dao')
const BotRepository = require('./data/bot_repository')
const TradeRepository = require('./data/trade_repository')
const QuarantinedRepository = require('./data/quarantined_repository')
const TransferedRepository = require('./data/transfered_repository')
const ParsingHelper = require('./util/parsing_helper')

const dao = new AppDAO('./database.sqlite3')
const botRepository = new BotRepository(dao)
const tradeRepository = new TradeRepository(dao)
const quarantinedRepository = new QuarantinedRepository(dao)
const transferedRepository = new TransferedRepository(dao)

botRepository.createTable()
  .then(() => tradeRepository.createTable())
  .then(() => quarantinedRepository.createTable())
  .then(() => transferedRepository.createTable())
  .catch((err) => {
    console.log('Error: ')
    console.log(JSON.stringify(err))
  })

const app = express();
app.use(morgan('dev'));

// let's use it
app.use(bodyParser.urlencoded({
  extended: false
}));
app.use(bodyParser.json());


app.param('name', function(req, res, next, name) {
  const modified = name.toUpperCase();

  req.name = modified;
  next();
});


const discord_webhook = new WebhookClient({
  id: config.get('discord_webhook.id'),
  token: config.get('discord_webhook.token')
});

app.post('/api/:name', function(req, res) {
  console.log("---" + req.name + "---");
  const content = req.body.content || req.body
  console.log(content);
  botRepository.getByName(req.name)
    .then((bot) => {
      if (!bot) {
        return botRepository.create(req.name).then((newBot) => {
          return {
            id: newBot.id,
            name: req.name
          }
        })
      } else {
        return bot
      }
    })
    .then((bot) => {
      console.debug(bot)

      let updates = ParsingHelper.parseWebHook(content)
      console.debug(updates)

      const {
        id,
        name
      } = bot
      let {
        isolation_activated
      } = bot

      // Add update to sqlite db
      const promises = updates.map((update) => {
        switch (update.repo_type) {
          case "BOT":
            if (update.status) {
              return botRepository.updateStatus(update.status, id)
            } else if (update.isolation_mode && !isolation_activated) {
              isolation_activated = true
              return botRepository.updateIsolationMode(id)
            }
            break;
          case "TRADE_OPENED":
            return tradeRepository.getOpenTrade(update.symbol, update.direction, id)
              .then((trade) => {
                if (trade) {
                  return tradeRepository.updateCount(update.count, id)
                } else {
                  return tradeRepository.create(update.symbol, update.direction, id)
                }
              })
              .then(() => {
                if (isolation_activated) {
                  isolation_activated = false
                  return botRepository.removeIsolationMode(id)
                } else {
                  return Promise.resolve()
                }
              })
            break;
          case "TRADE_CLOSED":
            return tradeRepository.getOpenTrade(update.symbol, update.direction, id)
              .then((trade) => {
                if (trade) {
                  return tradeRepository.closeTrade(update.count, update.price, update.profit, id)
                } else {
                  Promise.resolve()
                }
              })
            break;
          case "QUARANTINED":
            return quarantinedRepository.getQuarantinedBySymbol(update.symbol, id)
              .then((quarantined) => {
                if (quarantined) {
                  return quarantinedRepository.setQuarantined(quarantined.id)
                } else {
                  return quarantinedRepository.create(update.symbol, false, id)
                }
              })
            break;
          case "UNQUARANTINED":
            return quarantinedRepository.getQuarantinedBySymbol(update.symbol, id)
              .then((quarantined) => {
                if (quarantined) {
                  return quarantinedRepository.setUnquarantined(quarantined.id)
                } else {
                  return Promise.resolve()
                }
              })
            break;
          case "PENDING_QUARANTINE":
            return quarantinedRepository.getQuarantinedBySymbol(update.symbol, id)
              .then((quarantined) => {
                if (quarantined) {
                  return quarantinedRepository.setPending(quarantined.id)
                } else {
                  return quarantinedRepository.create(update.symbol, true, id)
                }
              })
            break;
          case "TRANSFER":
            return transferedRepository.create(update.status,
              update.total_balance,
              update.twenty_four_hour_profit,
              update.transferred,
              update.spot_balance,
              id)
            break;
          default:
            return Promise.resolve()
        }
      });

      // Send discord notification
      promises.push(updates.map((update) => {
        if (update.repo_type === "TRADE_CLOSED") {
          const embed = new MessageEmbed()
            .setTitle(update.direction + ' trade closed for ' + update.symbol)
            .setDescription('Bot: ' + bot.name)
            .addField('Qty', update.count + ' @ $' + update.price, true)
            .addField('Profit', '$' + update.profit, true)
            .setFooter({
              text: '💰 Current Balance: $'
            });

          let files = [];
          if (update.symbol.endsWith('USDT')) {
            const lower_name = update.symbol.substring(0, update.symbol.length - 4).toLowerCase()
            const file_path = './node_modules/cryptocurrency-icons/32@2x/color/' + lower_name + '@2x.png';
            const custom_file_path = './images/symbols/' + lower_name + '.png';
            if (fs.existsSync(file_path)) {
              embed.setThumbnail('attachment://' + lower_name + '2x.png')
              files.push(new MessageAttachment(file_path));
            } else if (fs.existsSync(custom_file_path)) {
              embed.setThumbnail('attachment://' + lower_name + '.png')
              files.push(new MessageAttachment(custom_file_path));
            }
          }

          if (update.direction === 'Long') {
            embed.setColor('#58d531')
          } else {
            embed.setColor('#C50027')
          }

          return discord_webhook.send({
            embeds: [embed],
            files: files
          });
        } else {
          return Promise.resolve()
        }
      }))

      //TODO add pushbullet logic

      return Promise.all(promises)
    })

  res.statusCode = 200;
  res.end();
});

//CORS
app.use((req, res, next) => {
  res.header("Access-Control-Allow-Origin", "*");
  res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept");
  next();
});

app.use((req, res, next) => {
  const error = new Error("Not found");
  error.status = 404;
  next(error);
});

app.use((error, req, res, next) => {
  res.status(error.status || 500);
  res.json({
    error: {
      message: error.message
    }
  })
});

//export app
module.exports = app;
