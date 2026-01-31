/**
 * Environment Configuration
 * Centralized configuration for different environments: local, staging, production
 */

require('dotenv').config();

let NODE_ENV = process.env.NODE_ENV || 'dev';

// Map common environment names to supported values
const envMap = {
  'development': 'dev',
  'dev': 'dev',
  'local': 'dev',
  'test': 'dev',
  'staging': 'staging',
  'stg': 'staging',
  'stage': 'staging',
  'production': 'production',
  'prod': 'production'
};

// Normalize NODE_ENV
NODE_ENV = envMap[NODE_ENV.toLowerCase()] || NODE_ENV;

// Environment configurations
const environments = {
  dev: {
    name: 'dev',
    port: process.env.PORT || 8080,
    mongodb_uri: process.env.MONGODB_URI || 'mongodb://localhost:27017/dcms',
    db_name: process.env.DB_NAME || 'dcms',
    jwt_secret: process.env.JWT_SECRET || 'local-dev-secret-key-change-in-prod',
    cors_origin: process.env.CORS_ORIGIN ? process.env.CORS_ORIGIN.split(',').map(url => url.trim()) : [
      'http://localhost:5173',  // frontend
      'http://localhost:5174'   // patient portal
    ],
    log_level: process.env.LOG_LEVEL || 'debug',
    is_production: false,
    is_staging: false,
    is_dev: true,
    api_url: 'http://localhost:8080',
    frontend_url: 'http://localhost:5173'
  },
  staging: {
    name: 'staging',
    port: process.env.PORT || 8080,
    mongodb_uri: process.env.MONGODB_URI || 'mongodb://staging-db:27017/dcms_staging',
    db_name: process.env.DB_NAME || 'dcms_staging',
    jwt_secret: process.env.JWT_SECRET || 'staging-secret-key-change-in-prod',
    cors_origin: process.env.CORS_ORIGIN ? process.env.CORS_ORIGIN.split(',').map(url => url.trim()) : [
      'https://staging.example.com',
      'https://patient-staging.example.com'
    ],
    log_level: process.env.LOG_LEVEL || 'info',
    is_production: false,
    is_staging: true,
    is_dev: false,
    api_url: process.env.API_URL || 'https://api-staging.example.com',
    frontend_url: process.env.FRONTEND_URL || 'https://staging.example.com'
  },
  production: {
    name: 'production',
    port: process.env.PORT || 8080,
    mongodb_uri: process.env.MONGODB_URI || 'mongodb://prod-db:27017/dcms_prod',
    db_name: process.env.DB_NAME || 'dcms_prod',
    jwt_secret: process.env.JWT_SECRET, // MUST be set in environment
    cors_origin: process.env.CORS_ORIGIN ? process.env.CORS_ORIGIN.split(',').map(url => url.trim()) : [
      'https://example.com',
      'https://patient.example.com'
    ],
    log_level: process.env.LOG_LEVEL || 'warn',
    is_production: true,
    is_staging: false,
    is_dev: false,
    api_url: process.env.API_URL || 'https://api.example.com',
    frontend_url: process.env.FRONTEND_URL || 'https://example.com'
  }
};

// Get configuration for current environment
const getConfig = () => {
  const config = environments[NODE_ENV];
  
  if (!config) {
    // During tests we prefer to fallback to dev rather than exiting the process
    if (NODE_ENV === 'test') {
      console.warn(`Unknown environment: ${NODE_ENV}. Falling back to 'dev' configuration for tests.`);
      return environments.dev;
    }
    console.error(`Unknown environment: ${NODE_ENV}`);
    process.exit(1);
  }

  // Validate production environment
  if (config.is_production && !process.env.JWT_SECRET) {
    console.error('ERROR: JWT_SECRET must be set in production environment');
    process.exit(1);
  }

  return config;
};

const config = getConfig();

// Log environment on startup
console.log(`\n========================================`);
console.log(`🔧 Environment: ${config.name.toUpperCase()}`);
console.log(`🗄️  Database URL: ${config.mongodb_uri}`);
console.log(`🔗 API URL: ${config.api_url}`);
console.log(`📱 Frontend URL: ${config.frontend_url}`);
console.log(`📊 Log Level: ${config.log_level}`);
console.log(`========================================\n`);

module.exports = config;
