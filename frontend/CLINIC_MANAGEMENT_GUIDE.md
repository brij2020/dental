# Super Admin Clinic Management Guide

## Overview

The Super Admin role enables clinic management at an organizational level, allowing super admins to create new clinics with their respective admin profiles. This document explains the clinic creation process, sharing model, and the default clinic structure.

---

## Super Admin Navigation

The Super Admin has access to the **Clinics** menu item in the sidebar, which displays:

- **Manage Clinics Page**: View all created clinics
- **Create Clinic Button**: Add new clinics with admin profile

### Navigation Menu Items (Super Admin)

```typescript
{
  label: "Clinics",
  to: "/clinics",
  icon: <IconBuildingHospital />,
  roles: ["super_admin"]
}
```

---

## Clinic Creation Process

### Step 1: Navigate to Create Clinic
Click the **"Create Clinic"** button on the Clinics management page.

### Step 2: Fill Clinic Information

#### Basic Details:
- **Clinic Name**: Unique identifier for the clinic
- **Phone Number**: Main clinic contact number
- **Branding Motto**: Marketing tagline (e.g., "Your Smile is Our Priority")
- **Description**: Detailed information about the clinic
- **Status**: Active or Inactive
- **Logo**: Clinic branding image URL

#### Address Information:
- **Street Address**: Physical location
- **City, State, Postal Code**: Location details
- **Country**: Default is "India"
- **Latitude & Longitude**: GPS coordinates for location-based services

### Step 3: Configure Admin Profile

The clinic must have a primary admin account with:

#### Account Credentials:
- **Email**: Admin login email (required)
- **Password**: Secure password (minimum 6 characters, required)
- **Mobile Number**: Contact number for the admin

#### Professional Information:
- **Full Name**: Admin's name (required)
- **Years of Experience**: Professional experience count
- **Education**: Array of qualifications (e.g., ["MBBS - AIIMS Delhi"])
- **Specialization**: Array of specializations (e.g., ["Cardiology"])
- **Bio**: Professional biography
- **Profile Picture**: URL to admin's photo

#### Configuration:
- **Slot Duration (minutes)**: Default appointment duration (typically 20 minutes)
- **Availability**: Weekly schedule of available hours
  ```json
  {
    "monday": ["09:00-12:00", "17:00-20:00"],
    "tuesday": ["10:00-14:00"],
    "thursday": ["09:00-13:00"]
  }
  ```

---

## Clinic Sharing Model

### Multi-Clinic Architecture

The system supports a **multi-tenant clinic sharing model** where:

1. **Clinic Isolation**: Each clinic operates independently
2. **Clinic-User Association**: Users (doctors, receptionists, patients) are tied to specific clinic_id
3. **Data Segregation**: Patient records, appointments, and settings are clinic-specific
4. **Admin Authority**: Each clinic has its own admin with full control

### Clinic Sharing Benefits

#### For Super Admins:
- Create and manage multiple clinics from a single dashboard
- Monitor all clinics' status and performance
- Centralized billing and revenue tracking
- Staff management across clinics

#### For Clinic Admins:
- Independent clinic management
- No interference from other clinics
- Full control over staff, patients, and schedules
- Customizable clinic settings and branding

#### For End Users:
- Seamless multi-clinic access (if enabled)
- Clinic-specific patient records
- Clear clinic identification in all interactions

---

## Default Admin JSON Structure

### Complete Example

```json
{
  "name": "Apollo Dental Clinic",
  "phone": "9876543210",
  "address": {
    "street": "123 Main Street",
    "city": "Mumbai",
    "state": "Maharashtra",
    "postal_code": "400001",
    "country": "India"
  },
  "logo": "https://example.com/logo.png",
  "branding_moto": "Your Smile is Our Priority",
  "location": {
    "latitude": 19.0760,
    "longitude": 72.8777
  },
  "description": "Leading dental clinic providing comprehensive dental care",
  "status": "Active",
  "adminProfile": {
    "email": "dr.mohit@example.com",
    "mobile_number": "9876543223",
    "password": "Doctor@123",
    "full_name": "Dr Mohit Sharma",
    "role": "admin",
    "status": "Active",
    "slot_duration_minutes": 20,
    "profile_pic": "https://cdn.example.com/doctors/mohit.jpg",
    "education": [
      "MBBS - AIIMS Delhi",
      "MD (Cardiology) - PGIMER"
    ],
    "years_of_experience": 12,
    "specialization": [
      "Cardiology",
      "Heart Failure"
    ],
    "bio": "Dr Mohit Sharma is a senior cardiologist with 12+ years of experience.",
    "availability": {
      "monday": [
        "09:00-12:00",
        "17:00-20:00"
      ],
      "tuesday": [
        "10:00-14:00"
      ],
      "thursday": [
        "09:00-13:00"
      ]
    }
  }
}
```

### Field Descriptions

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| name | string | ✓ | Clinic's official name |
| phone | string | ✓ | Main clinic phone number |
| address | object | ✗ | Complete address with street, city, state, postal_code, country |
| logo | string | ✗ | URL to clinic logo |
| branding_moto | string | ✗ | Clinic's tagline/motto |
| location | object | ✗ | GPS coordinates (latitude, longitude) |
| description | string | ✗ | Detailed clinic description |
| status | enum | ✗ | "Active" or "Inactive" |
| adminProfile | object | ✓ | Primary admin user details |
| adminProfile.email | string | ✓ | Admin's email (unique, used for login) |
| adminProfile.password | string | ✓ | Secure password (hashed on backend) |
| adminProfile.full_name | string | ✓ | Admin's full name |
| adminProfile.mobile_number | string | ✗ | Admin's contact number |
| adminProfile.role | enum | ✓ | Fixed to "admin" |
| adminProfile.status | enum | ✗ | "Active" or "Inactive" |
| adminProfile.slot_duration_minutes | number | ✗ | Default appointment duration |
| adminProfile.profile_pic | string | ✗ | URL to admin's profile picture |
| adminProfile.education | array | ✗ | Array of educational qualifications |
| adminProfile.years_of_experience | number | ✗ | Years in the profession |
| adminProfile.specialization | array | ✗ | Array of specializations |
| adminProfile.bio | string | ✗ | Professional biography |
| adminProfile.availability | object | ✗ | Weekly availability schedule |

---

## Frontend Implementation

### File Structure

```
src/pages/clinics/
├── api.ts              # API service for clinic operations
├── types.ts            # TypeScript types and interfaces
├── Clinics.tsx         # Clinic management/list page
├── CreateClinic.tsx    # Clinic creation form
└── components/
    └── (future clinic-specific components)
```

### Key Components

#### 1. **Clinics.tsx** - Clinic Management Page
- Displays all clinics in a grid layout
- Shows clinic name, phone, address, and status
- Edit and Delete buttons for each clinic
- "Create Clinic" button to add new clinics
- Success notification after creation

#### 2. **CreateClinic.tsx** - Clinic Creation Form
- Comprehensive multi-section form
- Real-time validation
- Error handling and display
- Sections:
  - Clinic Information
  - Address Details
  - Location (GPS coordinates)
  - Admin Profile

#### 3. **api.ts** - Clinic Service
- `createClinic()`: Create new clinic with admin
- `getAllClinics()`: Retrieve all clinics
- `getClinicById()`: Get specific clinic details
- `updateClinic()`: Update clinic information
- `deleteClinic()`: Remove a clinic

---

## Backend Implementation

### API Endpoints

#### Create Clinic with Admin
```http
POST /api/clinics/create
Content-Type: application/json

{
  "name": "Clinic Name",
  "phone": "...",
  "address": {...},
  "adminProfile": {...}
}

Response: 201 Created
{
  "clinic": {...},
  "admin": {...}
}
```

#### Get All Clinics
```http
GET /api/clinics
Authorization: Bearer <token>

Response: 200 OK
[...]
```

#### Get Clinic Details
```http
GET /api/clinics/:id
Response: 200 OK
{...}
```

#### Update Clinic
```http
PUT /api/clinics/:id
Authorization: Bearer <token>
Content-Type: application/json
{...}

Response: 200 OK
{...}
```

#### Delete Clinic
```http
DELETE /api/clinics/:id
Authorization: Bearer <token>

Response: 200 OK
{"message": "Clinic deleted successfully"}
```

### Backend Services

#### Clinic Service (`clinic.service.js`)
- `createClinic()`: Creates clinic + admin profile together
- `getAllClinics()`: Retrieves all clinics
- `getActiveClinics()`: Filters active clinics
- `getClinicById()`: Retrieves specific clinic
- `updateClinic()`: Updates clinic details
- `deleteClinic()`: Deletes clinic record

#### Clinic ID Generation
Clinics receive auto-generated IDs:
```
Format: {NAMEPREFIX}{YEAR}{COUNT}
Example: APL2500001
- APL: First 3 characters of clinic name
- 25: Current year (2025)
- 00001: Sequential clinic count
```

---

## Security Considerations

### Password Handling
- Passwords are hashed on the backend using bcrypt
- Never transmitted in plain text in responses
- Minimum 6 characters required
- Should follow strong password policies

### Access Control
- Only Super Admins can create/manage clinics
- Clinic Admins can only modify their own clinic data
- Patient data is segregated by clinic_id
- Role-based access control (RBAC) enforced

### Data Validation
- All required fields are validated before creation
- Email uniqueness is enforced
- Phone number format validation
- GPS coordinates bounds checking

---

## User Roles and Permissions

### Role Hierarchy

```
Super Admin
├── Create Clinics
├── Manage All Clinics
├── View All Clinic Reports
└── Access Settings

Clinic Admin
├── Manage Clinic Details
├── Create Users (Doctors, Receptionists)
├── View Patient Records
├── Manage Appointments
└── Access Clinic Settings

Doctor
├── View Patients
├── Manage Appointments
├── Update Patient Records
└── Access Consultation

Receptionist
├── View Appointments
├── Schedule Appointments
├── Patient Registration
└── View Clinic Calendar
```

---

## Clinic Switching (Multi-Clinic Support)

If a user has access to multiple clinics:

1. **Clinic Selector in Sidebar**: Shows current clinic
2. **Switch Clinic**: Dropdown to change active clinic
3. **Data Refresh**: Patient and appointment data reloads
4. **Context Update**: clinic_id updated in user context

```typescript
// Example: User with multiple clinics
{
  id: "user-123",
  email: "user@example.com",
  clinics: ["clinic-1", "clinic-2"],
  current_clinic: "clinic-1"
}
```

---

## Workflow Example

### Super Admin Creates New Clinic

1. **Login**: Super admin logs in
2. **Navigate**: Goes to Clinics page
3. **Create**: Clicks "Create Clinic" button
4. **Fill Form**: Enters:
   - Clinic: Name, Phone, Address, etc.
   - Admin: Email, Password, Full Name, etc.
5. **Validate**: Frontend validates all required fields
6. **Submit**: Form submitted to backend
7. **Backend Process**:
   - Validate inputs
   - Generate clinic ID
   - Create clinic record
   - Hash admin password
   - Create admin user profile
   - Link admin to clinic
8. **Confirmation**: Success message shown
9. **Redirect**: Returned to clinics list
10. **New Clinic Available**: Clinic admin can now login and manage

---

## Troubleshooting

### Clinic Creation Failed
- Check all required fields are filled
- Verify email is unique
- Ensure password meets requirements (min 6 chars)
- Check network connectivity

### Clinic Not Appearing in List
- Refresh the page
- Clear browser cache
- Verify clinic status is "Active"
- Check user permissions (must be Super Admin)

### Admin Login Issues
- Verify email matches during creation
- Reset password through admin panel
- Check if admin status is "Active"

---

## Related Documentation

- [User Management Guide](../settings/USER_MANAGEMENT.md)
- [Patient Management Guide](../patients/PATIENT_MANAGEMENT.md)
- [Appointment System](../appointments/APPOINTMENT_GUIDE.md)
- [Authentication Flow](../auth/AUTH_GUIDE.md)

---

## Summary

The Super Admin Clinic Management system provides a robust, multi-tenant architecture for managing multiple dental clinics. Each clinic operates independently with its own admin account, settings, and data while maintaining centralized oversight from the super admin dashboard.

**Key Features:**
- ✅ Create unlimited clinics
- ✅ Auto-generated clinic IDs
- ✅ Dedicated admin per clinic
- ✅ Full data segregation
- ✅ Comprehensive clinic profiles
- ✅ Flexible availability scheduling
- ✅ Professional credential management
