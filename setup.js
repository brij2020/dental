#!/usr/bin/env node

/**
 * DCMS Monorepo Setup Script
 * 
 * This script helps with initial setup of the monorepo by:
 * 1. Creating .env files from templates
 * 2. Installing dependencies
 * 3. Providing setup information
 */

const fs = require('fs');
const path = require('path');

const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[36m',
};

function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

function checkEnvFile(envPath, examplePath) {
  if (!fs.existsSync(envPath) && fs.existsSync(examplePath)) {
    fs.copyFileSync(examplePath, envPath);
    log(`✓ Created ${envPath}`, 'green');
    return true;
  }
  return false;
}

async function setup() {
  log('\n🦷 DCMS Dental Clinic Management System - Setup\n', 'bright');

  // Check frontend .env.local
  log('Setting up environment files...', 'blue');
  const frontendEnvCreated = checkEnvFile(
    path.join(__dirname, 'frontend', '.env.local'),
    path.join(__dirname, 'frontend', '.env.example')
  );

  // Check backend .env
  const backendEnvCreated = checkEnvFile(
    path.join(__dirname, 'backend', '.env'),
    path.join(__dirname, 'backend', '.env.example')
  );

  if (!frontendEnvCreated && !backendEnvCreated) {
    log('ℹ  Environment files already exist', 'blue');
  }

  log('\n📦 Next Steps:\n', 'bright');
  log('1. Review and update environment variables:', 'yellow');
  log('   - frontend/.env.local', 'blue');
  log('   - backend/.env', 'blue');

  log('\n2. Install dependencies:', 'yellow');
  log('   npm run install-all', 'blue');

  log('\n3. Start the application:', 'yellow');
  log('   npm run dev', 'blue');

  log('\n4. Access the application:', 'yellow');
  log('   Frontend: http://localhost:5173', 'blue');
  log('   Backend: http://localhost:8080', 'blue');
  log('   API Docs: http://localhost:8080/api-docs', 'blue');

  log('\n📚 Documentation:', 'bright');
  log('   - README.md (main documentation)', 'blue');
  log('   - MONOREPO_SETUP.md (detailed setup guide)', 'blue');

  log('\n✨ Setup complete!\n', 'green');
}

setup().catch(err => {
  log(`✗ Setup failed: ${err.message}`, 'yellow');
  process.exit(1);
});
