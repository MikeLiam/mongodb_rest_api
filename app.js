'use strict';
// load modules
const express = require('express');
const morgan = require('morgan'); 
const routes = require('./routes')
var cors = require('cors')

// variable to enable global error logging
const enableGlobalErrorLogging = process.env.ENABLE_GLOBAL_ERROR_LOGGING === 'true';

// create the Express app
var app = express();

// Enable ALL CORS Requests
app.use(cors({
  exposedHeaders:['Location'],
}))
// setup morgan which gives us http request logging
app.use(morgan('dev'));
// request json
app.use(express.json())

// setup a friendly greeting for the root route
app.get('/', (req, res) => {
  res.json({
    message: 'Welcome to the REST API project!',
  });
});

// Api route
app.use('/api', routes)

// route not found send 404
app.use((req, res) => {
  res.status(404).json({
    message: 'Route Not Found',
  });
});

// global error handler
app.use((err, req, res, next) => {
  if (enableGlobalErrorLogging) {
    console.error(`Global error handler: ${JSON.stringify(err.stack)}`);
  }
  if(err.name === "SequelizeValidationError") {
      err.status = 400;
      err.message = [...err.errors.map(error => error.message)]
  }
  res.status(err.status || 500).json({
    message: err.message,
    error: err,
  });
});

// set port
app.set('port', process.env.PORT || 5000);

// start listening on port
const server = app.listen(app.get('port'), () => {
  console.log(`Express server is listening on port ${server.address().port}`);
});
// module.exports = app;