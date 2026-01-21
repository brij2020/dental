// Load environment configuration
require('dotenv').config();
const config = require('./environment');
console.log(`Database Configuration Loaded for Environment: ${config}`);
module.exports = {
  url: config.mongodb_uri,
  dbName: config.db_name,
  environment: config.name,
  isProduction: config.is_production,
  isStaging: config.is_staging,
  isLocal: config.is_local
};
