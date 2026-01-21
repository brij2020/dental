# Clinic Management System - Developer Guide

## Overview

The Clinic Management System is a comprehensive solution for Super Admins to create, manage, and monitor multiple clinics. Each clinic has its own admin account, settings, and data.

## Directory Structure

```
src/pages/clinics/
├── api.ts                 # API service layer
├── types.ts              # TypeScript type definitions
├── Clinics.tsx           # Clinic list/management page
├── CreateClinic.tsx      # Clinic creation form
└── README.md             # This file
```

## File Descriptions

### 1. **types.ts** - Type Definitions

Contains all TypeScript interfaces and types for clinic management:

```typescript
interface Clinic {
  id?: string;
  name: string;
  phone: string;
  address: Address;
  branding_moto: string;
  location: Location;
  description: string;
  status: "Active" | "Inactive";
}

interface ClinicAdminProfile {
  email: string;
  mobile_number: string;
  full_name: string;
  password?: string;
  role: "admin";
  status: "Active" | "Inactive";
  slot_duration_minutes: number;
  education?: string[];
  years_of_experience?: number;
  specialization?: string[];
  bio?: string;
  availability?: { [key: string]: string[] };
}
```

**Key Types:**
- `Clinic`: Main clinic entity
- `ClinicAdminProfile`: Admin user attached to clinic
- `Address`: Address object with street, city, state, postal_code, country
- `Location`: GPS coordinates (latitude, longitude)
- `CreateClinicRequest`: Request payload for creating clinic
- `CreateClinicResponse`: Response from clinic creation

### 2. **api.ts** - API Service Layer

Handles all HTTP communication with the backend for clinic operations.

**Available Functions:**

```typescript
// Create a new clinic with admin profile
createClinic(data: ClinicFormData): Promise<ClinicResponse>

// Get all clinics for super admin
getAllClinics(): Promise<ClinicResponse[]>

// Get specific clinic by ID
getClinicById(clinicId: string): Promise<ClinicResponse>

// Update clinic details
updateClinic(clinicId: string, data: Partial<ClinicFormData>): Promise<ClinicResponse>

// Delete a clinic
deleteClinic(clinicId: string): Promise<void>
```

**Example Usage:**

```typescript
import { createClinic, getAllClinics } from "./api";

// Create clinic
const response = await createClinic({
  name: "Apollo Dental Clinic",
  phone: "9876543210",
  // ... other fields
});

// Get all clinics
const clinics = await getAllClinics();
```

### 3. **Clinics.tsx** - Clinic Management Page

The main page where super admins view all clinics and access clinic management features.

**Features:**
- Display all clinics in a responsive grid
- Show clinic information (name, phone, address, status)
- Create new clinic button
- Edit clinic option (implement in future)
- Delete clinic option (implement in future)
- Success notification after creation
- Error handling and display
- Loading states

**Component Structure:**
```tsx
function Clinics() {
  const [clinics, setClinics] = useState<ClinicResponse[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    // Fetch clinics on mount
    fetchClinics();
  }, []);

  return (
    <div className="clinic management layout">
      {/* Header with Create button */}
      {/* Success/Error messages */}
      {/* Loading state */}
      {/* Clinics grid */}
      {/* Empty state */}
    </div>
  );
}
```

### 4. **CreateClinic.tsx** - Clinic Creation Form

A comprehensive multi-section form for creating new clinics with admin profiles.

**Form Sections:**

1. **Clinic Information**
   - Name (required)
   - Phone (required)
   - Branding Motto
   - Description
   - Status (Active/Inactive)
   - Logo URL

2. **Address**
   - Street Address
   - City
   - State
   - Postal Code
   - Country

3. **Location**
   - Latitude (GPS)
   - Longitude (GPS)

4. **Admin Profile**
   - Full Name (required)
   - Email (required)
   - Mobile Number
   - Password (required, min 6 chars)
   - Years of Experience
   - Education (array)
   - Specialization (array)
   - Bio
   - Slot Duration (minutes)

**Validation:**
- Required fields checked on submit
- Email format validation
- Password minimum length (6 characters)
- Error messages displayed to user

**Example Form Data:**
```typescript
const formData: ClinicFormData = {
  name: "Apollo Dental Clinic",
  phone: "9876543210",
  address: {
    street: "123 Main Street",
    city: "Mumbai",
    state: "Maharashtra",
    postal_code: "400001",
    country: "India"
  },
  branding_moto: "Your Smile is Our Priority",
  location: {
    latitude: 19.0760,
    longitude: 72.8777
  },
  description: "Leading dental clinic...",
  status: "Active",
  adminProfile: {
    email: "admin@clinic.com",
    mobile_number: "9876543223",
    password: "SecurePass123",
    full_name: "Dr. Mohit Sharma",
    role: "admin",
    status: "Active",
    slot_duration_minutes: 20,
    // ... other fields
  }
};
```

## Integration with Navigation

The clinics menu item is added to the super admin navigation:

```typescript
// src/config/navigation.tsx
const ROLES = {
  SUPER_ADMIN: 'super_admin',
  // ... other roles
};

export const NAV_ITEMS: NavItem[] = [
  {
    label: "Clinics",
    to: "/clinics",
    icon: (p) => <IconBuildingHospital className={...} />,
    roles: [ROLES.SUPER_ADMIN],
  },
  // ... other items
];
```

## Routing Configuration

Routes are configured in `src/routes/Router.tsx`:

```typescript
import Clinics from "../pages/clinics/Clinics";
import CreateClinic from "../pages/clinics/CreateClinic";

const router = createBrowserRouter([
  {
    element: <ProtectedRoute />,
    children: [
      {
        element: <DashboardLayout />,
        children: [
          { path: "/clinics", element: <Clinics /> },
          { path: "/clinics/create", element: <CreateClinic /> },
          // ... other routes
        ]
      }
    ]
  }
]);
```

## Backend API Integration

### Endpoints Used

**POST /api/clinics/create**
- Create new clinic with admin profile
- Body: ClinicFormData
- Returns: ClinicResponse with clinic and admin details

**GET /api/clinics**
- Get all clinics
- Requires authentication
- Returns: Array of ClinicResponse

**GET /api/clinics/:id**
- Get specific clinic
- Returns: Single ClinicResponse

**PUT /api/clinics/:id**
- Update clinic details
- Requires authentication
- Body: Partial<ClinicFormData>
- Returns: Updated ClinicResponse

**DELETE /api/clinics/:id**
- Delete clinic
- Requires authentication
- Returns: Success message

## State Management

Currently uses React hooks:
- `useState` for component state
- `useEffect` for side effects
- `useNavigate` for routing
- `useSearchParams` for URL parameters

**Future Enhancement:** Consider using Redux or Context API for global clinic state.

## Styling

Uses Tailwind CSS with custom utility classes:

```tailwind
/* Clinic cards */
bg-white rounded-lg shadow-md hover:shadow-lg

/* Buttons */
px-6 py-3 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700

/* Status badges */
px-3 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800
```

## Error Handling

Errors are caught and displayed to the user:

```typescript
try {
  await createClinic(formData);
  // Success
} catch (err) {
  setError(err instanceof Error ? err.message : "Failed to create clinic");
}
```

## Future Enhancements

### Immediate TODOs
- [ ] Implement edit clinic functionality
- [ ] Implement delete clinic functionality with confirmation
- [ ] Add clinic search/filter
- [ ] Add pagination for large clinic lists
- [ ] Add bulk actions (select multiple clinics)

### Medium-term
- [ ] Clinic performance dashboard
- [ ] Revenue tracking per clinic
- [ ] Clinic-specific reports
- [ ] Staff management per clinic
- [ ] Clinic branding customization interface

### Long-term
- [ ] Clinic sharing with other super admins
- [ ] Franchise model support
- [ ] Multi-currency support
- [ ] Clinic chaining with regional management
- [ ] API integrations (payment gateways, analytics)

## Component Props

### Clinics Component
```typescript
interface Props {
  // No props required
  // Uses context for authentication
}
```

### CreateClinic Component
```typescript
interface Props {
  // No props required
  // Managed internally with form state
}
```

## Performance Considerations

1. **Data Fetching**: Clinics list fetched once on mount
2. **Lazy Loading**: Patient/appointment data loaded when clinic is selected
3. **Form Optimization**: No re-renders during form input
4. **Image Loading**: Clinic logos loaded with signed URLs

## Testing

### Unit Tests to Add
```typescript
// api.ts tests
test('createClinic sends correct payload');
test('getAllClinics returns clinic array');

// Clinics.tsx tests
test('renders clinics list on load');
test('shows create button');
test('handles fetch error gracefully');

// CreateClinic.tsx tests
test('validates required fields');
test('submits form with correct data');
test('shows validation errors');
```

### Integration Tests
```typescript
test('end-to-end clinic creation');
test('navigate to clinics after creation');
test('load and display all clinics');
```

## Dependencies

**Required Packages:**
- `react`: UI framework
- `react-router-dom`: Routing
- `@tabler/icons-react`: Icons
- `axios`: HTTP client (via apiClient)

**Development:**
- `typescript`: Type safety
- `tailwindcss`: Styling

## Debugging

### Common Issues

1. **Form not submitting**
   - Check console for validation errors
   - Verify all required fields are filled
   - Check network tab for API errors

2. **Clinics not loading**
   - Verify user has super_admin role
   - Check backend API is running
   - Verify authentication token is valid

3. **Styling issues**
   - Ensure Tailwind CSS is properly configured
   - Check for CSS conflicts
   - Verify dark mode settings (if applicable)

### Debug Logs

Add this to see form data:
```typescript
console.log('Form data:', formData);
```

Add this to see API response:
```typescript
const response = await createClinic(formData);
console.log('API response:', response);
```

## Code Style

- **TypeScript**: Use strict mode, avoid `any`
- **Components**: Functional components with hooks
- **Naming**: camelCase for functions/variables, PascalCase for components
- **Comments**: Add JSDoc comments for complex logic
- **Formatting**: Use Prettier for consistent formatting

## References

- [Clinic Management Guide](../../../CLINIC_MANAGEMENT_GUIDE.md)
- [React Documentation](https://react.dev)
- [Tailwind CSS](https://tailwindcss.com)
- [TypeScript Handbook](https://www.typescriptlang.org/docs/)
