// Load environment configuration
require('dotenv').config();
const config = require('./app/config/environment');

const express = require("express");
const cors = require("cors");
const path = require("path");
const swaggerSetup = require("./swagger");
const { logger, httpLogger } = require('./app/config/logger');
const app = express();

const isPrivateIpv4 = (hostname) => {
  if (!/^\d{1,3}(\.\d{1,3}){3}$/.test(hostname)) return false;
  const octets = hostname.split('.').map(Number);
  if (octets.some(o => Number.isNaN(o) || o < 0 || o > 255)) return false;
  return (
    octets[0] === 10 ||
    (octets[0] === 172 && octets[1] >= 16 && octets[1] <= 31) ||
    (octets[0] === 192 && octets[1] === 168) ||
    (octets[0] === 127) ||
    (octets[0] === 169 && octets[1] === 254)
  );
};

const isAllowedOrigin = (origin) => {
  if (!origin) return true; // native apps/Postman/server-to-server
  if (config.cors_origin.includes(origin)) return true;
  if (!config.cors_allow_private_network) return false;

  try {
    const parsed = new URL(origin);
    const host = parsed.hostname;
    return host === 'localhost' || host.endsWith('.local') || isPrivateIpv4(host);
  } catch (err) {
    return false;
  }
};

// CORS Configuration based on environment
const corsOptions = {
  origin: (origin, callback) => {
    if (isAllowedOrigin(origin)) return callback(null, true);
    return callback(new Error(`Not allowed by CORS: ${origin}`));
  },
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
  
  res.json({ message: "Welcome Patient App." });
});

app.get("/api/health", (req, res) => {
  res.status(200)
  res.send('OK');
});

require("./app/routes")(app);
//require("./app/routes/turorial.routes")(app);

// set port, listen for requests


swaggerSetup(app);

const PORT = config.port;
const HOST = config.host || '0.0.0.0';

// Export app for testing. Start server only when running directly.
if (require.main === module) {
  app.listen(PORT, HOST, () => {
    logger.info(`🚀 Server started successfully on ${HOST}:${PORT} in ${config.name} mode`);
    logger.info(`📊 Environment: ${config.name.toUpperCase()}`);
    logger.info(`🔗 API URL: ${config.api_url}`);
    logger.info(`📱 Frontend URL: ${config.frontend_url}`);
  });
}

module.exports = app;
