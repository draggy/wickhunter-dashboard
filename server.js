// require http modules first

const http = require('http');

const config = require('config');

//import app.js file
const app = require('./app');

//define port to be used
const port = config.get('server.port');
const host = config.get('server.host');

const server = http.createServer(app);

server.listen(port, host, () => {
    //    let's print a message when the server run successfully
    console.log("Server restarted successfully")
});
