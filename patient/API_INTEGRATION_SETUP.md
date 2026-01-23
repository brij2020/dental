# DCMS Patient Frontend - API Integration Setup

This guide explains how the DCMS Patient frontend now uses the MongoDB clinic listing API from the dental backend.

## Overview

The DCMS Patient frontend has been integrated with the dental backend's MongoDB clinic listing API. This migration replaces the previous Supabase-based clinic fetching with a centralized clinic management system.

## Files Created/Updated

### 1. **src/config/environment.ts** (NEW)
Environment configuration manager that loads settings from `.env` file.

**Key Features:**
- Loads API URL from `VITE_API_URL` environment variable
- Manages timeout, logging level, and other settings
- Provides getter methods for accessing configuration

**Usage:**
```typescript
import { environment } from '@/config/environment';

const apiUrl = environment.getApiUrl();
const timeout = environment.getApiTimeout();
```

### 2. **src/lib/apiClient.ts** (NEW)
Axios instance with interceptors for authentication and error handling.

**Key Features:**
- Automatic token injection from localStorage
- Request/response interceptors
- 401 error handling (auto-logout)
- Helper functions: `get()`, `post()`, `put()`, `del()`

**Usage:**
```typescript
import { get, post, setAuthToken } from '@/lib/apiClient';

// Set token after login
setAuthToken(token);

// Make requests
const clinics = await get('/api/clinics');
```

### 3. **src/services/clinicService.ts** (NEW)
API service for all clinic-related operations.

**Available Functions:**
- `fetchAllClinics()` - Get all clinics
- `fetchActiveClinics()` - Get only active clinics
- `searchClinics(filters)` - Search by name, state, city, pin, location
- `fetchClinicById(id)` - Get single clinic
- `createClinic(data)` - Create new clinic
- `updateClinic(id, data)` - Update clinic
- `deleteClinic(id)` - Delete clinic

**Example:**
```typescript
import { searchClinics } from '@/services/clinicService';

const results = await searchClinics({
  name: 'Apollo',
  state: 'Maharashtra',
  city: 'Mumbai'
});
```

### 4. **src/hooks/useClinics.ts** (UPDATED)
React hook for fetching clinics with loading and error states.

**Changes:**
- Removed Supabase dependency
- Now uses MongoDB clinic API via `clinicService`
- Maintains backward compatibility with existing component props
- Improved error handling

**Usage:**
```typescript
const { clinics, loading, error, refetch } = useClinics();
```

### 5. **.env.example** (NEW)
Template environment file for developers.

**Copy to .env:**
```bash
cp .env.example .env
```

Then update `VITE_API_URL` to point to your dental backend.

## Environment Setup

### Development

1. **Copy environment template:**
   ```bash
   cp .env.example .env
   ```

2. **Configure API URL:**
   ```
   VITE_API_URL=http://localhost:8080
   ```

3. **Run development server:**
   ```bash
   npm run dev
   ```

### Production

1. **Set environment variables:**
   ```bash
   VITE_MODE=production
   VITE_API_URL=https://your-production-api.com
   ```

2. **Build:**
   ```bash
   npm run build
   ```

## API Endpoints

All endpoints require authentication token in `Authorization` header.

```
GET    /api/clinics              - Get all clinics
GET    /api/clinics/active       - Get active clinics only
GET    /api/clinics/search/filter - Search clinics
GET    /api/clinics/:id          - Get single clinic
GET    /api/clinics/information  - Get current clinic info
POST   /api/clinics              - Create clinic
PUT    /api/clinics/:id          - Update clinic
DELETE /api/clinics/:id          - Delete clinic
```

## Search Filters

The `/api/clinics/search/filter` endpoint supports these query parameters:

```
?name=Apollo          - Search by clinic name
?state=Maharashtra    - Filter by state
?city=Mumbai          - Filter by city
?pin=400001          - Filter by postal code
?location=floor1     - Search by location (floor/room/wing)
```

**Example:**
```typescript
const results = await searchClinics({
  name: 'Apollo',
  city: 'Mumbai',
  state: 'Maharashtra'
});
```

## Authentication Flow

1. **Login**: User provides credentials
2. **Token Storage**: JWT token stored in `localStorage` as `auth_token`
3. **Auto-injection**: `apiClient` automatically includes token in all requests
4. **Token Expiry**: 401 responses trigger logout and redirect to login page

**Set token after login:**
```typescript
import { setAuthToken } from '@/lib/apiClient';

const token = response.data.token;
localStorage.setItem('auth_token', token);
setAuthToken(token);
```

## Data Flow

```
ClinicListForAppointments.tsx
         ↓
    useClinics hook
         ↓
clinicService.fetchAllClinics()
         ↓
  apiClient.get()
         ↓
  axios instance
         ↓
Dental Backend API (/api/clinics)
         ↓
MongoDB Clinic Collection
```

## Field Mapping

**Backend API Response → Frontend Clinic Object:**

| Backend Field | Frontend Field | Type |
|---|---|---|
| `name` | `name` | string |
| `phone` | `phone` | string |
| `address.street` | `address` | string |
| `address.city` | `city` | string |
| `address.state` | `State` | string |
| `address.postal_code` | `pincode` | string |
| `location` | `location` | object |
| `description` | `description` | string |
| `clinic_id` | `clinic_id` | string |
| `_id` | `id` | string |

## Error Handling

The `useClinics` hook handles errors gracefully:

```typescript
const { clinics, loading, error, refetch } = useClinics();

if (loading) return <Loading />;
if (error) return <ErrorMessage message={error} />;
if (clinics.length === 0) return <NoResults />;

return <ClinicList clinics={clinics} />;
```

## Troubleshooting

### "API Error: 401 Unauthorized"
- Token has expired or is invalid
- User needs to login again
- Check `localStorage.auth_token` is set

### "Failed to fetch clinics"
- Dental backend is not running
- Check `VITE_API_URL` is correct
- Verify network connectivity

### CORS Errors
- Backend must have CORS enabled for `VITE_FRONTEND_URL`
- Check backend nginx/express CORS configuration

### Clinics Not Showing
- Verify clinic data exists in MongoDB
- Check search filters are not too restrictive
- Enable debug logging: `VITE_LOG_LEVEL=debug`

## Next Steps

1. Update `.env` with correct API URL
2. Ensure dental backend is running on the configured port
3. Login with valid credentials
4. Navigate to clinic list page to verify integration

## Support

For issues or questions about the API integration, refer to:
- Dental backend README: `dental/README.md`
- Clinic API docs: `dental/backend/CLINIC_PANEL_API.md`
- Procedure API testing: `dental/PROCEDURE_API_TESTING.sh`
