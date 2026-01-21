# Environment Configuration Guide

## Overview

This project uses a multi-environment configuration system to support **dev (development)**, **staging**, and **production** deployments with different settings for each environment.

## Environment Files

The project includes environment-specific configuration files:

### Frontend (`frontend/`)
- `.env.local` - Development environment (default, loads `.env.dev`)
- `.env.staging` - Staging environment
- `.env.production` - Production environment

### Backend (`backend/`)
- `.env.local` - Development environment (default)
- `.env.staging` - Staging environment
- `.env.production` - Production environment

## Frontend Setup

### Available Commands

```bash
# Development (default)
npm run dev

# Staging Environment
npm run dev:staging
# or
npm run stg

# Build for Development
npm run build:dev

# Build for Staging
npm run build:staging

# Build for Production
npm run build:prod
```

### Frontend Environment Variables

```env
VITE_MODE                  # Environment: local | staging | production
VITE_API_URL              # Backend API URL
VITE_FRONTEND_URL         # Frontend URL
VITE_LOG_LEVEL            # Logging level: debug | info | warn | error
VITE_SUPABASE_URL         # Supabase project URL
VITE_SUPABASE_ANON_KEY    # Supabase anonymous key
VITE_ENABLE_DEV_TOOLS     # Enable developer tools: true | false
VITE_API_TIMEOUT          # API request timeout in milliseconds
```

### Using Environment Config in Code

```typescript
import { environment } from '@/config/environment';

// Get configuration
const apiUrl = environment.getApiUrl();
const isProduction = environment.isProduction();
const config = environment.getConfig();

// Check environment
if (environment.isLocal()) {
  console.log('Running in local mode');
}

if (environment.isDevelopment()) {
  console.log('Running in development mode (local or staging)');
}

if (environment.shouldEnableDevTools()) {
  console.log('Developer tools are enabled');
}
```

## Backend Setup

### Available Commands

```bash
# Development (default)
npm run dev          # Run once
npm run dev:watch   # Run with auto-reload

# Staging Environment
npm run stg         # Run once
npm run stg:watch   # Run with auto-reload

# Production
npm run prod
```

### Backend Environment Variables

```env
NODE_ENV                 # Environment: local | staging | production
PORT                     # Server port (default: 8080)
MONGODB_URI             # MongoDB connection string
DB_NAME                 # Database name
JWT_SECRET              # JWT signing secret (REQUIRED for production)
CORS_ORIGIN             # Allowed CORS origin
API_URL                 # API URL for external services
FRONTEND_URL            # Frontend URL for CORS
LOG_LEVEL               # Logging level: debug | info | warn | error
EMAIL_USER              # Email service username
EMAIL_PASS              # Email service password
```

### Using Environment Config in Code

```javascript
const config = require('./app/config/environment');

// Get configuration
const apiUrl = config.api_url;
const isProduction = config.is_production;

// Check environment
if (config.is_local) {
  logger.debug('Running in local mode');
}

if (config.is_staging) {
  logger.info('Running in staging mode');
}
```

## Environment Mapping

The system automatically maps common environment names:

| Input | Mapped To |
|-------|-----------|
| `development`, `dev`, `local` | `dev` |
| `staging`, `stg`, `stage` | `staging` |
| `production`, `prod` | `production` |

## Local Development Setup

### Prerequisites
1. Node.js 18+
2. MongoDB running locally on `mongodb://localhost:27017`
3. Both frontend and backend `.env.local` files configured

### Quick Start

```bash
# Terminal 1 - Backend
cd backend
npm install
npm run dev:watch

# Terminal 2 - Frontend
cd frontend
npm install
npm run dev
```

Visit `http://localhost:5173` in your browser.

## Staging Deployment

### Environment Configuration

Update `.env.staging` files with staging server details:

**Frontend:**
```env
VITE_MODE=staging
VITE_API_URL=https://api-staging.dentalclinic.com
VITE_FRONTEND_URL=https://staging.dentalclinic.com
```

**Backend:**
```env
NODE_ENV=staging
MONGODB_URI=mongodb://staging-db:27017/dcms_staging
CORS_ORIGIN=https://staging.dentalclinic.com
```

### Deploy

```bash
# Frontend
cd frontend
npm run build:staging

# Backend
cd backend
npm run stg:watch
```

## Production Deployment

### Critical Security Notes

⚠️ **IMPORTANT**: Never commit `.env.production` to version control!

**Instead:**
1. Use environment variables provided by your deployment platform (Docker, K8s, AWS, Heroku, etc.)
2. Set critical variables at deployment time:
   - `JWT_SECRET` - Strong random string
   - `MONGODB_URI` - Production database URL
   - `CORS_ORIGIN` - Your production domain
   - `VITE_SUPABASE_ANON_KEY` - Production Supabase key

### Environment Variables

**Frontend (.env.production):**
```env
VITE_MODE=production
VITE_API_URL=https://api.dentalclinic.com
VITE_FRONTEND_URL=https://dentalclinic.com
VITE_LOG_LEVEL=error
VITE_ENABLE_DEV_TOOLS=false
```

**Backend (.env.production):**
```env
NODE_ENV=production
PORT=8080
MONGODB_URI=<SET_AT_DEPLOYMENT>
JWT_SECRET=<SET_AT_DEPLOYMENT>
CORS_ORIGIN=https://dentalclinic.com
LOG_LEVEL=warn
```

### Build for Production

```bash
# Frontend
cd frontend
npm run build:prod

# Backend (use deployment platform's environment setup)
cd backend
npm run prod
```

## Validation

The system validates configuration on startup:

- ✅ Logs environment and URLs
- ✅ Checks for required variables
- ✅ Validates HTTPS URLs in production
- ✅ Warns about missing optional variables
- ✅ Exits on critical configuration errors

## Troubleshooting

### Error: "Unknown environment: development"

**Solution:** Update `.env` files to use supported environment names:
- Use `dev` instead of `development`
- Use `staging` instead of `stage`
- Use `production` instead of `prod`

### API connection fails

**Check:**
1. `VITE_API_URL` matches backend's API URL
2. Backend is running on the correct port
3. CORS configuration allows your frontend URL

### Missing environment variables

**Solution:**
1. Copy appropriate `.env.example` or `.env.[mode]` file
2. Update with your specific values
3. Restart the development server
4. Check browser console for warnings

## Best Practices

1. **Never commit secrets** - Use `.env.production` only for templates
2. **Use .env.local for local testing** - Keep your local setup clean
3. **Version control .env.example** - Document required variables
4. **Rotate secrets regularly** - Especially JWT_SECRET in production
5. **Use HTTPS in production** - Enforce HTTPS URLs
6. **Monitor logs** - Check production logs for errors
7. **Test environment switching** - Verify each environment works before deployment

## References

- [Vite Environment Variables](https://vitejs.dev/guide/env-and-mode.html)
- [Node.js dotenv](https://github.com/motdotla/dotenv)
- [Express.js Production Best Practices](https://expressjs.com/en/advanced/best-practice-security.html)
