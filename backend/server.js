// Load environment configuration
require('dotenv').config();
const config = require('./app/config/environment');

const express = require("express");
const cors = require("cors");
const path = require("path");
const swaggerSetup = require("./swagger");
const { logger, httpLogger } = require('./app/config/logger');
const app = express();

// CORS Configuration based on environment
const corsOptions = {
  origin: config.cors_origin,
  credentials: true,
  optionsSuccessStatus: 200
};

app.use(cors(corsOptions));

app.use(httpLogger);

// parse requests of content-type - application/json
app.use(express.json());

// parse requests of content-type - application/x-www-form-urlencoded
app.use(express.urlencoded({ extended: true }));

// Serve uploaded files as static assets
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

const db = require("./app/models");
// Connect mongoose unless running tests (tests control connection)
if (process.env.NODE_ENV !== 'test') {
  db.mongoose
    .connect(db.url, {
      useNewUrlParser: true,
      useUnifiedTopology: true
    })
    .then(() => {
      logger.info('Connected to the database!');
    })
    .catch(err => {
      logger.error({ err }, 'Cannot connect to the database!');
      process.exit();
    });
} else {
  logger.info('Skipping DB connect in test environment');
}

// simple route
app.get("/", (req, res) => {
  
  res.json({ message: "Welcome to bezkoder application." });
});

require("./app/routes")(app);
//require("./app/routes/turorial.routes")(app);

// set port, listen for requests


swaggerSetup(app);

const PORT = config.port;

// Export app for testing. Start server only when running directly.
if (require.main === module) {
  app.listen(PORT, () => {
    logger.info(`🚀 Server started successfully on port ${PORT} in ${config.name} mode`);
    logger.info(`📊 Environment: ${config.name.toUpperCase()}`);
    logger.info(`🔗 API URL: ${config.api_url}`);
    logger.info(`📱 Frontend URL: ${config.frontend_url}`);
  });
}

module.exports = app;
