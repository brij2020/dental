# Authentication Issue: Logout on Navigate

## Problem Analysis

The logout happens when navigating to the clinic listing page because of a **mismatch between two authentication systems**:

### Current Setup
1. **UserContext (Supabase)** - Used for app authentication
   - Login via Supabase (email/password)
   - Token stored as Supabase session
   - Used for user profile, appointments, etc.

2. **apiClient (Dental Backend)** - Expects JWT token
   - Looks for `auth_token` in localStorage
   - Clinic API requires `verifyToken` middleware
   - Returns 401 if token missing/invalid

### The Conflict
```
User logs in with Supabase
  ↓
Supabase session created ✓
  ↓
Navigate to clinic page
  ↓
useClinics calls clinicService.fetchAllClinics()
  ↓
apiClient looks for localStorage.auth_token ✗ (doesn't exist)
  ↓
API returns 401 Unauthorized
  ↓
apiClient interceptor logs out and redirects to /login
```

## Solutions

### Solution 1: Make Clinic API Public (Recommended for MVP)
**Change the backend route to NOT require token:**

In `dental/backend/app/routes/clinic.routes.js`:
```javascript
// BEFORE
router.get("/", verifyToken, clinic.findAll);
router.get("/search/filter", verifyToken, clinic.search);

// AFTER
router.get("/", clinic.findAll);  // Remove verifyToken
router.get("/search/filter", clinic.search);  // Remove verifyToken
```

**Why?** Clinic listing is public information, doesn't need auth.

---

### Solution 2: Convert Dental Backend to Use Supabase Auth
**Make dental backend accept Supabase JWT tokens:**

Update `dental/backend/app/middleware/auth.middleware.js` to accept Supabase tokens:
```javascript
const verifyToken = async (req, res, next) => {
  try {
    const token = req.headers.authorization?.split('Bearer ')[1];
    
    if (!token) {
      return res.status(401).send({ message: 'No token provided' });
    }

    // Try Supabase verification first
    const { data: { user }, error } = await supabase.auth.getUser(token);
    
    if (user) {
      req.user = user;
      return next();
    }

    // Fall back to custom JWT if Supabase fails
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded;
    next();
  } catch (err) {
    return res.status(401).send({ message: 'Invalid token' });
  }
};
```

---

### Solution 3: Extract Supabase Token and Set It (Bridge Solution)
**After Supabase login, extract token and set it for apiClient:**

In your login component/page:
```typescript
import { setAuthToken } from '@/lib/apiClient';

const handleLogin = async (email, password) => {
  try {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password
    });

    if (error) throw error;

    // Get the Supabase JWT token
    const { session } = data;
    if (session?.access_token) {
      // Set it for apiClient
      localStorage.setItem('auth_token', session.access_token);
      setAuthToken(session.access_token);
    }

    // Navigate to dashboard
    navigate('/dashboard');
  } catch (error) {
    console.error('Login failed:', error);
  }
};
```

---

## Recommended Fix (Quick Implementation)

### Step 1: Update Clinic Routes (Dental Backend)
Remove `verifyToken` from public endpoints:

```bash
# File: dental/backend/app/routes/clinic.routes.js
```

Change these lines:
```javascript
// Line 14: FROM
router.get("/", verifyToken, clinic.findAll);

// Line 17: FROM  
router.get("/search/filter", verifyToken, clinic.search);

// TO (remove verifyToken)
router.get("/", clinic.findAll);
router.get("/search/filter", clinic.search);
```

### Step 2: Update apiClient (Optional - Remove Auto-Logout)
The improved version already has better error handling, but you can disable the 401 redirect for clinic endpoints:

```typescript
// src/lib/apiClient.ts
apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    // Only logout if we're calling protected endpoints
    if (error.response?.status === 401 && error.config?.url?.includes('/protected')) {
      localStorage.removeItem('auth_token');
      setTimeout(() => {
        window.location.href = '/login';
      }, 500);
    }
    throw error;
  }
);
```

### Step 3: Verify (No Code Changes Needed)
Just reload the page and test:
```
http://localhost:5173/book-appointment-clinics
```

---

## Why This Happens

| System | Auth Type | Token Storage | Used For |
|--------|-----------|---------------|----------|
| UserContext | Supabase JWT | Supabase Session | User profile, appointments |
| apiClient | Custom JWT | localStorage `auth_token` | Clinic API |

**The mismatch** causes the clinic endpoint to receive 401 (missing token) and auto-logout.

---

## Testing After Fix

### Test Scenario 1: Public Clinic Listing
```
1. Logout (clear session)
2. Navigate directly to /book-appointment-clinics
3. Should see clinic list WITHOUT login
4. This proves clinics are public data
```

### Test Scenario 2: Protected Appointment Booking
```
1. See clinic list (public)
2. Try to book appointment
3. Should prompt for login
4. After login, can complete booking
```

---

## Implementation Timeline

| Approach | Time | Difficulty | Recommended |
|----------|------|-----------|-------------|
| **Make clinic API public** | 5 min | Easy | ✅ YES |
| **Add token extraction on login** | 15 min | Medium | For future |
| **Supabase auth in backend** | 30 min | Hard | Long-term |

---

## Next Steps

1. **Immediate:** Remove `verifyToken` from clinic routes in dental backend
2. **Restart:** Restart both frontend and backend servers
3. **Test:** Navigate to clinic page - should now load clinics
4. **Later:** Implement proper auth token exchange if needed

---

## Debug Checklist

- [ ] Check browser Console for API errors
- [ ] Check Network tab - what status code returned?
- [ ] Check localStorage - does `auth_token` exist?
- [ ] Check Supabase session - is user logged in?
- [ ] Check backend logs - what's the error?

---

**Issue:** Token mismatch between Supabase and custom JWT  
**Solution:** Make clinic listing public (doesn't need auth)  
**Time to fix:** 5 minutes
