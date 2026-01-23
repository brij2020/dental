# DCMS Patient Frontend - Documentation Index

## 📚 Documentation Files

### Quick Start
- **[SETUP.md](./SETUP.md)** - Quick start guide and setup instructions
  - 3-minute setup process
  - Development commands
  - Environment variables reference
  - Feature overview

### Integration Guides
- **[API_INTEGRATION_SETUP.md](./API_INTEGRATION_SETUP.md)** - Comprehensive API integration guide
  - Detailed file descriptions
  - API endpoint documentation
  - Authentication flow
  - Field mapping
  - Error handling
  - Troubleshooting

### Architecture & Design
- **[ARCHITECTURE_DIAGRAM.md](./ARCHITECTURE_DIAGRAM.md)** - System architecture and diagrams
  - System architecture overview
  - Request/response flows
  - Component interactions
  - API schemas
  - Error handling flow

### Migration Info
- **[MIGRATION_SUMMARY.md](./MIGRATION_SUMMARY.md)** - Migration details and summary
  - What changed
  - Data flow examples
  - Benefits of migration
  - Integration points
  - Deployment checklist

---

## 📁 Project Structure

```
DCMS_Patient-main/
├── src/
│   ├── config/
│   │   └── environment.ts          ← Environment configuration
│   ├── lib/
│   │   ├── apiClient.ts             ← Axios instance
│   │   └── supabaseClient.ts         ← Legacy (keep)
│   ├── services/
│   │   ├── clinicService.ts         ← Clinic API service
│   │   └── ...
│   ├── hooks/
│   │   ├── useClinics.ts            ← Updated hook
│   │   └── ...
│   ├── pages/
│   │   ├── ClinicListForAppointments.tsx
│   │   └── ...
│   └── ...
├── .env.example                     ← Environment template
├── SETUP.md                         ← Quick start
├── API_INTEGRATION_SETUP.md         ← Full guide
├── ARCHITECTURE_DIAGRAM.md          ← Diagrams
├── MIGRATION_SUMMARY.md             ← Migration info
└── INDEX.md                         ← This file
```

---

## 🎯 Getting Started (5 Steps)

### 1. Install Dependencies
```bash
npm install
```

### 2. Configure Environment
```bash
cp .env.example .env
# Edit .env and set VITE_API_URL=http://localhost:8080
```

### 3. Start Backend (Dental Project)
```bash
cd ../dental
npm run dev      # or docker-compose up
```

### 4. Start Frontend (This Project)
```bash
npm run dev
```

### 5. Test Integration
- Open http://localhost:5173/book-appointment-clinics
- Login with valid credentials
- Verify clinics load from MongoDB
- Test search filters

---

## 🔑 Key Features

### ✅ Axios API Client
- **File:** `src/lib/apiClient.ts`
- Automatic JWT token injection
- Request/response interceptors
- Error handling with 401 auto-logout
- Timeout management

### ✅ Environment Configuration
- **File:** `src/config/environment.ts`
- Dev/staging/production modes
- API URL and timeout configuration
- Validation and logging
- Getters for all settings

### ✅ Clinic Service Layer
- **File:** `src/services/clinicService.ts`
- Fetch all clinics
- Search with filters (name, state, city, pin, location)
- CRUD operations
- Type-safe responses

### ✅ Updated useClinics Hook
- **File:** `src/hooks/useClinics.ts`
- Replaced Supabase with MongoDB API
- Maintains backward compatibility
- Loading and error states
- Refetch capability

---

## 🔗 API Endpoints

### Base URL
```
http://localhost:8080/api
```

### Available Endpoints
```
GET    /clinics                    # All clinics
GET    /clinics/active             # Active only
GET    /clinics/search/filter      # Search
GET    /clinics/:id                # Single clinic
GET    /clinics/information        # Current clinic info
POST   /clinics                    # Create (admin)
PUT    /clinics/:id                # Update
DELETE /clinics/:id                # Delete
```

### Search Filters
```
?name=Apollo                  # By name
?state=Maharashtra            # By state
?city=Mumbai                  # By city
?pin=400001                   # By postal code
?location=floor1              # By location details
```

---

## 🔐 Authentication

### Login Flow
1. User submits credentials
2. Backend returns JWT token
3. Store in localStorage: `auth_token`
4. Update apiClient: `setAuthToken(token)`
5. Requests include: `Authorization: Bearer {token}`

### Token Management
```typescript
import { setAuthToken } from '@/lib/apiClient';

// After login
const { token } = loginResponse.data;
localStorage.setItem('auth_token', token);
setAuthToken(token);

// Auto-logout on 401
// (handled by apiClient interceptor)
```

---

## 📊 Data Flow

```
Component
  ↓
useClinics Hook
  ↓
clinicService.fetchAllClinics()
  ↓
apiClient.get('/api/clinics')
  ↓
axios instance
  ↓
Dental Backend API
  ↓
MongoDB Clinic Collection
```

---

## 🛠️ Configuration

### Environment Variables (.env)
```env
VITE_API_URL=http://localhost:8080
VITE_API_TIMEOUT=10000
VITE_LOG_LEVEL=info
VITE_MODE=dev
VITE_FRONTEND_URL=http://localhost:5173
VITE_ENABLE_DEV_TOOLS=true
```

### For Production
```env
VITE_MODE=production
VITE_API_URL=https://api.production.com
VITE_LOG_LEVEL=warn
VITE_ENABLE_DEV_TOOLS=false
```

---

## 🧪 Testing

### Manual Testing Checklist
- [ ] Clinics load on page load
- [ ] Search by name works
- [ ] Filter by state works
- [ ] Filter by city works
- [ ] Search by PIN works
- [ ] Search by location works
- [ ] Combined filters work
- [ ] Click clinic opens modal
- [ ] Booking modal displays correctly
- [ ] Appointment submission works
- [ ] Auth token is included in requests
- [ ] 401 triggers logout

---

## 🐛 Troubleshooting

### "Failed to fetch clinics"
- ✓ Check backend running on port 8080
- ✓ Verify API URL in .env
- ✓ Check network tab in DevTools

### "401 Unauthorized"
- ✓ Login again to get new token
- ✓ Check localStorage.auth_token exists
- ✓ Token may be expired

### CORS Error
- ✓ Backend CORS headers needed
- ✓ Check nginx/express config
- ✓ Frontend URL must be whitelisted

### No Clinics in List
- ✓ Verify MongoDB has clinic data
- ✓ Check search filters
- ✓ Review backend logs

---

## 📚 Additional Resources

### Related Documentation
- Dental Backend: `../dental/README.md`
- Clinic API Docs: `../dental/backend/CLINIC_PANEL_API.md`
- API Testing: `../dental/PROCEDURE_API_TESTING.sh`

### Useful Links
- [Axios Documentation](https://axios-http.com/)
- [React Hooks Guide](https://react.dev/reference/react)
- [TypeScript Handbook](https://www.typescriptlang.org/docs/)

---

## 📝 Development Commands

```bash
# Install dependencies
npm install

# Start development server
npm run dev

# Build for production
npm run build

# Preview production build
npm run preview

# Run linter
npm run lint
```

---

## ✨ What's New (vs Old Supabase Approach)

### Before (Supabase)
- Fetched from `clinics` table
- Called Supabase functions for doctors
- Multiple API calls
- Less efficient filtering

### After (MongoDB)
- Single MongoDB clinic collection
- Server-side filtering
- Centralized clinic management
- Better performance

### Benefits
- ✅ Unified clinic management
- ✅ Server-side filtering
- ✅ Better scalability
- ✅ Single source of truth
- ✅ Easier to maintain

---

## 🚀 Deployment Steps

### Before Deploying
1. Test locally with dental backend
2. Run full test suite
3. Build production bundle
4. Verify .env configuration
5. Check CORS settings

### Deployment Checklist
- [ ] API URL updated to production
- [ ] Environment set to `production`
- [ ] Dev tools disabled
- [ ] Build created
- [ ] Tests passing
- [ ] Backend deployment verified
- [ ] CORS configured
- [ ] SSL certificates ready (if HTTPS)

---

## 📞 Support

### Common Issues & Solutions
See [API_INTEGRATION_SETUP.md](./API_INTEGRATION_SETUP.md#troubleshooting) for detailed troubleshooting.

### Ask Questions
1. Check documentation first
2. Review console logs
3. Check DevTools Network tab
4. Review backend logs
5. Check MongoDB logs

---

## 📋 Quick Reference

### Import Statements
```typescript
// Get clinics
import { fetchAllClinics, searchClinics } from '@/services/clinicService';

// Use hook
import useClinics from '@/hooks/useClinics';

// API client
import { get, post, setAuthToken } from '@/lib/apiClient';

// Environment
import { environment } from '@/config/environment';
```

### Common Tasks

**Fetch all clinics:**
```typescript
const clinics = await fetchAllClinics();
```

**Search clinics:**
```typescript
const results = await searchClinics({
  name: 'Apollo',
  state: 'Maharashtra'
});
```

**Use hook in component:**
```typescript
const { clinics, loading, error } = useClinics();
```

**Set auth token:**
```typescript
setAuthToken(jwtToken);
```

---

## 📌 Important Notes

1. **Backend Required:** Dental backend must be running on configured port
2. **Database:** MongoDB must contain clinic data
3. **Auth Token:** Required for most endpoints (except public endpoints)
4. **CORS:** Backend must allow frontend URL
5. **Environment:** Copy .env.example and configure before running

---

## 🎓 Learning Resources

- TypeScript with React: [React + TypeScript Guide](https://react.dev/learn/typescript)
- Axios Interceptors: [Interceptors Guide](https://axios-http.com/docs/interceptors)
- MongoDB Queries: [MongoDB Query Guide](https://docs.mongodb.com/manual/crud/)
- Express Routing: [Express Routing Guide](https://expressjs.com/en/guide/routing.html)

---

**Last Updated:** January 22, 2026  
**Version:** 1.0.0  
**Status:** ✅ Complete

---

## Quick Navigation

| Need | File | Link |
|------|------|------|
| Quick Setup | SETUP.md | [👉](./SETUP.md) |
| Full Integration Guide | API_INTEGRATION_SETUP.md | [👉](./API_INTEGRATION_SETUP.md) |
| Architecture Details | ARCHITECTURE_DIAGRAM.md | [👉](./ARCHITECTURE_DIAGRAM.md) |
| Migration Details | MIGRATION_SUMMARY.md | [👉](./MIGRATION_SUMMARY.md) |
| API Configuration | .env.example | [👉](./.env.example) |
