# DCMS Patient - Quick Start Guide

## Setup Steps

### 1. Install Dependencies
```bash
npm install
```

### 2. Configure Environment
```bash
# Copy the example env file
cp .env.example .env

# Edit .env and set your API URL
# VITE_API_URL=http://localhost:8080
```

### 3. Start Development Server
```bash
npm run dev
```

The app will be available at `http://localhost:5173`

## Key Features Implemented

### ✅ Axios API Client
- Located: `src/lib/apiClient.ts`
- Features:
  - Automatic JWT token injection
  - Request/response interceptors
  - Auto-logout on 401 errors
  - Timeout handling

### ✅ Environment Configuration
- Located: `src/config/environment.ts`
- Features:
  - Environment-based API URLs
  - Timeout management
  - Dev tools configuration
  - Logging levels

### ✅ Clinic Service
- Located: `src/services/clinicService.ts`
- Features:
  - Fetch all clinics
  - Search by name, state, city, pin, location
  - CRUD operations
  - Type-safe responses

### ✅ Updated useClinics Hook
- Located: `src/hooks/useClinics.ts`
- Features:
  - MongoDB clinic API integration
  - Loading states
  - Error handling
  - Backward compatible

## API Endpoints

### Available Clinic Endpoints

```
GET  /api/clinics                    # All clinics
GET  /api/clinics/active             # Active clinics only
GET  /api/clinics/search/filter      # Search clinics
GET  /api/clinics/:id                # Get single clinic
GET  /api/clinics/information        # Current clinic info
POST /api/clinics                    # Create clinic (admin)
PUT  /api/clinics/:id                # Update clinic
DELETE /api/clinics/:id              # Delete clinic
```

### Search Examples

```typescript
import { searchClinics } from '@/services/clinicService';

// Search by name
await searchClinics({ name: 'Apollo' });

// Search by location
await searchClinics({ state: 'Maharashtra', city: 'Mumbai' });

// Combined search
await searchClinics({
  name: 'Apollo',
  state: 'Maharashtra',
  city: 'Mumbai',
  pin: '400001'
});
```

## File Structure

```
src/
├── config/
│   └── environment.ts          # Environment configuration
├── lib/
│   ├── apiClient.ts            # Axios instance & helpers
│   └── supabaseClient.ts        # Supabase (keep for legacy)
├── services/
│   ├── clinicService.ts        # NEW: Clinic API service
│   └── ...
├── hooks/
│   ├── useClinics.ts           # UPDATED: Uses clinicService
│   └── ...
├── pages/
│   ├── ClinicListForAppointments.tsx
│   └── ...
└── ...
```

## Authentication

### Login Flow
1. User submits credentials
2. Backend returns JWT token
3. Store token: `localStorage.setItem('auth_token', token)`
4. Update apiClient: `setAuthToken(token)`
5. All subsequent requests include token automatically

### Example Login Handler
```typescript
import { setAuthToken } from '@/lib/apiClient';

const handleLogin = async (email, password) => {
  try {
    const response = await post('/api/auth/login', { email, password });
    const { token } = response.data;
    
    localStorage.setItem('auth_token', token);
    setAuthToken(token);
    
    // Redirect to dashboard
    navigate('/dashboard');
  } catch (error) {
    // Handle error
  }
};
```

## Clinic Listing Page

The `ClinicListForAppointments` component now:
- Fetches clinics from MongoDB via `useClinics` hook
- Supports filtering by:
  - State (dropdown)
  - City (dropdown, depends on state)
  - PIN code (6-digit text input)
  - Location (text search)
  - Clinic Name (text search)
- Displays results in card layout
- Shows booking modal when clinic is selected

## Troubleshooting

### Issue: "Failed to fetch clinics"
**Solution:** 
- Check dental backend is running on port 8080
- Verify `VITE_API_URL=http://localhost:8080` in `.env`
- Check network tab in DevTools

### Issue: "Unauthorized (401)"
**Solution:**
- User token has expired
- Logout and login again
- Check `localStorage.auth_token` exists

### Issue: No clinics showing
**Solution:**
- Verify clinic data in MongoDB
- Check filters aren't too restrictive
- Review API response in DevTools Network tab

## Development Commands

```bash
# Start dev server
npm run dev

# Build for production
npm run build

# Preview production build
npm run preview

# Run linter
npm run lint
```

## Environment Variables Reference

| Variable | Default | Description |
|----------|---------|-------------|
| `VITE_MODE` | `dev` | App mode: dev, staging, production |
| `VITE_API_URL` | `http://localhost:8080` | Backend API base URL |
| `VITE_FRONTEND_URL` | `http://localhost:5173` | Frontend URL |
| `VITE_API_TIMEOUT` | `10000` | API timeout in ms |
| `VITE_LOG_LEVEL` | `info` | Log level: debug, info, warn, error |
| `VITE_SUPABASE_URL` | - | Supabase URL (optional) |
| `VITE_SUPABASE_ANON_KEY` | - | Supabase key (optional) |
| `VITE_ENABLE_DEV_TOOLS` | `true` | Enable debug tools |

## Next Steps

1. ✅ Install dependencies
2. ✅ Configure `.env` file
3. ✅ Start dev server
4. ✅ Test clinic listing page
5. ✅ Test search filters
6. ✅ Test clinic booking flow

## Additional Resources

- [Full API Integration Setup](./API_INTEGRATION_SETUP.md)
- [Dental Backend README](../dental/README.md)
- [Clinic API Documentation](../dental/backend/CLINIC_PANEL_API.md)

---

**Last Updated:** January 22, 2026  
**Version:** 1.0.0
