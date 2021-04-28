//import express
const express = require('express');

const app = express();

// import morgan package
const morgan = require('morgan');

//use it
app.use(morgan('dev'));
// import body-parser
const bodyParser = require('body-parser');
// let's use it
app.use(bodyParser.urlencoded({extended:false}));
app.use(bodyParser.json());

// defining routes
//const ordersRoutes = require('./routes/orders')
//app.use('/orders', ordersRoutes);


app.post('/api/', function(req, res) {
  console.log(req.body);

  //res.setHeader('content-type', 'Application/json');
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
    res.status(error.status || 500 );
    res.json({
        error: {
            message: error.message
        }
    })
});

//export app
module.exports = app;
