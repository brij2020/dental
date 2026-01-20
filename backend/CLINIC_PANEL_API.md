# Clinic Panel API Documentation

## Overview
The Clinic Panel API allows you to manage dental panels (departments/specializations) within a clinic. Panels can represent different specializations like Pediatric Dentistry, Orthodontics, Implantology, etc. This is useful for organizing patient appointments and clinic operations.

## Base URL
```
/api/clinic-panels
```

## Authentication
All endpoints (except explicitly stated) require a valid JWT token in the `Authorization` header:
```
Authorization: Bearer <token>
```

---

## Endpoints

### 1. Create a New Panel
**POST** `/`

Create a new clinic panel with detailed information.

**Request Headers:**
```
Authorization: Bearer <token>
Content-Type: application/json
```

**Request Body:**
```json
{
  "name": "Pediatric Dentistry",
  "code": "PED",
  "clinic_id": "clinic123",
  "description": "Dental care for children",
  "specialization": "Pediatric Dentistry",
  "is_active": true,
  "dentist_ids": ["dentist1", "dentist2"],
  "facilities": ["X-ray", "Suction", "Chair"],
  "treatment_types": ["Cleaning", "Filling", "Root Canal"],
  "max_daily_appointments": 20,
  "appointment_duration_minutes": 30,
  "opening_time": "09:00",
  "closing_time": "18:00",
  "break_time": {
    "start": "13:00",
    "end": "14:00"
  },
  "working_days": ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"],
  "contact_number": "9876543210",
  "email": "pediatric@clinic.com",
  "location": {
    "floor": 2,
    "room_number": "201",
    "wing": "Main Building"
  },
  "pricing": {
    "consultation_fee": 500,
    "currency": "INR"
  },
  "notes": "Specializes in child-friendly procedures"
}
```

**Required Fields:**
- `name` - Panel name
- `code` - Unique panel code (e.g., PED, ORTHO)
- `clinic_id` - Reference to clinic

**Response (201 Created):**
```json
{
  "message": "Panel created successfully",
  "data": {
    "_id": "panel123",
    "name": "Pediatric Dentistry",
    "code": "PED",
    "clinic_id": "clinic123",
    ...
    "createdAt": "2024-01-18T10:30:00Z",
    "updatedAt": "2024-01-18T10:30:00Z"
  }
}
```

**Error Responses:**
- `400` - Missing required fields
- `409` - Panel code already exists for this clinic
- `500` - Server error

---

### 2. Get All Panels
**GET** `/`

Retrieve all panels for a clinic with pagination and filtering.

**Query Parameters:**
```
clinic_id=clinic123              (required if not clinic staff)
page=1                           (optional, default: 1)
limit=10                         (optional, default: 10)
search=pediatric                 (optional, searches name/code/description)
is_active=true                   (optional, filter by active status)
status=Active                    (optional, filter by status: Active/Inactive/Maintenance)
specialization=Pediatric%20Dentistry  (optional, filter by specialization)
```

**Response (200 OK):**
```json
{
  "data": [
    {
      "_id": "panel123",
      "name": "Pediatric Dentistry",
      "code": "PED",
      "clinic_id": "clinic123",
      "is_active": true,
      "specialization": "Pediatric Dentistry",
      ...
    }
  ],
  "pagination": {
    "total": 25,
    "page": 1,
    "limit": 10,
    "pages": 3
  }
}
```

---

### 3. Get All Active Panels
**GET** `/active`

Get only active panels for a clinic.

**Query Parameters:**
```
clinic_id=clinic123    (optional if clinic staff)
```

**Response (200 OK):**
```json
{
  "message": "Active panels retrieved successfully",
  "data": [
    {
      "_id": "panel123",
      "name": "Pediatric Dentistry",
      "code": "PED",
      "clinic_id": "clinic123",
      "is_active": true,
      "status": "Active",
      ...
    }
  ]
}
```

---

### 4. Get Panels by Specialization
**GET** `/specialization`

Get panels filtered by specialization.

**Query Parameters:**
```
clinic_id=clinic123                              (optional if clinic staff)
specialization=Pediatric%20Dentistry             (required)
```

**Available Specializations:**
- General Dentistry
- Pediatric Dentistry
- Orthodontics
- Periodontics
- Prosthodontics
- Endodontics
- Oral Surgery
- Implantology
- Cosmetic Dentistry
- Other

**Response (200 OK):**
```json
{
  "message": "Panels retrieved successfully",
  "data": [
    {
      "_id": "panel123",
      "name": "Pediatric Dentistry",
      "code": "PED",
      "specialization": "Pediatric Dentistry",
      ...
    }
  ]
}
```

---

### 5. Get Panel by ID
**GET** `/:id`

Retrieve a specific panel by its ID.

**Parameters:**
```
id=panel123    (panel MongoDB ID)
```

**Response (200 OK):**
```json
{
  "message": "Panel retrieved successfully",
  "data": {
    "_id": "panel123",
    "name": "Pediatric Dentistry",
    "code": "PED",
    ...
  }
}
```

**Error Responses:**
- `403` - Unauthorized (clinic staff accessing other clinic's panel)
- `404` - Panel not found

---

### 6. Get Panel by Code
**GET** `/code/:clinic_id/:code`

Retrieve a panel using clinic ID and panel code.

**Parameters:**
```
clinic_id=clinic123    (clinic ID)
code=PED               (panel code)
```

**Response (200 OK):**
```json
{
  "message": "Panel retrieved successfully",
  "data": {
    "_id": "panel123",
    "name": "Pediatric Dentistry",
    "code": "PED",
    ...
  }
}
```

---

### 7. Update Panel
**PUT** `/:id`

Update panel details.

**Parameters:**
```
id=panel123    (panel MongoDB ID)
```

**Request Body:**
```json
{
  "name": "Updated Pediatric Dentistry",
  "description": "Updated description",
  "is_active": true,
  "max_daily_appointments": 25,
  "opening_time": "08:30",
  "closing_time": "19:00",
  ...
}
```

**Note:** Cannot update `code` or `clinic_id` after creation.

**Response (200 OK):**
```json
{
  "message": "Panel updated successfully",
  "data": {
    "_id": "panel123",
    "name": "Updated Pediatric Dentistry",
    ...
  }
}
```

---

### 8. Delete Panel
**DELETE** `/:id`

Delete a panel permanently.

**Parameters:**
```
id=panel123    (panel MongoDB ID)
```

**Response (200 OK):**
```json
{
  "message": "Panel deleted successfully",
  "deletedPanel": {
    "_id": "panel123",
    ...
  }
}
```

---

### 9. Add Dentist to Panel
**POST** `/:panelId/dentist/add`

Add a dentist to the panel.

**Parameters:**
```
panelId=panel123    (panel MongoDB ID)
```

**Request Body:**
```json
{
  "dentistId": "dentist123"
}
```

**Response (200 OK):**
```json
{
  "message": "Dentist added to panel successfully",
  "data": {
    "_id": "panel123",
    "dentist_ids": ["dentist1", "dentist2", "dentist123"],
    ...
  }
}
```

---

### 10. Remove Dentist from Panel
**POST** `/:panelId/dentist/remove`

Remove a dentist from the panel.

**Parameters:**
```
panelId=panel123    (panel MongoDB ID)
```

**Request Body:**
```json
{
  "dentistId": "dentist123"
}
```

**Response (200 OK):**
```json
{
  "message": "Dentist removed from panel successfully",
  "data": {
    "_id": "panel123",
    "dentist_ids": ["dentist1", "dentist2"],
    ...
  }
}
```

---

### 11. Get Panels with Specific Dentist
**GET** `/dentist/:dentistId`

Get all panels where a specific dentist works.

**Parameters:**
```
dentistId=dentist123              (dentist ID)
```

**Query Parameters:**
```
clinic_id=clinic123    (optional if clinic staff)
```

**Response (200 OK):**
```json
{
  "message": "Panels retrieved successfully",
  "data": [
    {
      "_id": "panel123",
      "name": "Pediatric Dentistry",
      "code": "PED",
      "dentist_ids": ["dentist123", "dentist2"],
      ...
    }
  ]
}
```

---

## Data Structure

### Clinic Panel Schema

```javascript
{
  _id: ObjectId,
  name: String,                        // Panel name (required)
  code: String,                        // Unique panel code (required, uppercase)
  clinic_id: String,                   // Reference to clinic (required)
  description: String,
  specialization: String,              // e.g., "Pediatric Dentistry"
  is_active: Boolean,                  // Default: true
  dentist_ids: [String],              // Array of dentist IDs
  facilities: [String],               // e.g., ["X-ray", "Suction"]
  treatment_types: [String],          // e.g., ["Cleaning", "Filling"]
  max_daily_appointments: Number,     // Default: 20
  appointment_duration_minutes: Number, // Default: 30
  opening_time: String,               // HH:MM format, default: "09:00"
  closing_time: String,               // HH:MM format, default: "18:00"
  break_time: {
    start: String,                    // HH:MM format
    end: String                       // HH:MM format
  },
  working_days: [String],             // e.g., ["Monday", "Tuesday", ...]
  holidays: [Date],                   // Array of holiday dates
  contact_number: String,             // Valid 10-digit phone
  email: String,
  location: {
    floor: String,
    room_number: String,
    wing: String
  },
  pricing: {
    consultation_fee: Number,
    currency: String                  // Default: "INR"
  },
  notes: String,
  status: String,                     // "Active", "Inactive", "Maintenance"
  createdAt: Date,
  updatedAt: Date
}
```

---

## Integration with Patient Form

### How to use Clinic Panels in Patient Registration/Form

1. **Get Available Panels for a Clinic:**
```bash
GET /api/clinic-panels?clinic_id=clinic123
Authorization: Bearer <token>
```

2. **In Patient Form, Show Panel Selection:**
```json
{
  "full_name": "John Doe",
  "email": "john@example.com",
  "panel": "PED",           // User selects panel code
  "clinic_id": "clinic123",
  ...
}
```

3. **Get Panels by Specialization (for dropdown filtering):**
```bash
GET /api/clinic-panels/specialization?clinic_id=clinic123&specialization=Pediatric%20Dentistry
Authorization: Bearer <token>
```

4. **Frontend Implementation Example:**

```javascript
// Fetch panels for dropdown
const fetchPanels = async (clinicId) => {
  const response = await fetch(
    `/api/clinic-panels?clinic_id=${clinicId}`,
    {
      headers: { 'Authorization': `Bearer ${token}` }
    }
  );
  const { data } = await response.json();
  return data; // Array of panels
};

// In your patient form
<select name="panel" required>
  <option value="">Select Panel</option>
  {panels.map(panel => (
    <option key={panel.code} value={panel.code}>
      {panel.name} - {panel.specialization}
    </option>
  ))}
</select>
```

---

## Example Workflows

### Workflow 1: Create a Panel and Add Dentists

```bash
# 1. Create panel
POST /api/clinic-panels
{
  "name": "Orthodontics",
  "code": "ORTHO",
  "clinic_id": "clinic123",
  "specialization": "Orthodontics",
  "max_daily_appointments": 15
}

# 2. Add dentist to panel
POST /api/clinic-panels/{panelId}/dentist/add
{
  "dentistId": "dr-smith-123"
}

# 3. Add another dentist
POST /api/clinic-panels/{panelId}/dentist/add
{
  "dentistId": "dr-johnson-456"
}
```

### Workflow 2: Get Panels for Patient Registration

```bash
# Get all active panels for clinic
GET /api/clinic-panels/active?clinic_id=clinic123

# User selects from dropdown and creates patient
POST /api/patient
{
  "full_name": "Jane Doe",
  "email": "jane@example.com",
  "panel": "ORTHO",          // Selected panel code
  "clinic_id": "clinic123",
  "registration_type": "clinic",
  ...
}
```

---

## Error Handling

All API responses follow a consistent error format:

```json
{
  "message": "Error description"
}
```

### Common HTTP Status Codes:
- `200` - OK
- `201` - Created
- `400` - Bad Request (missing/invalid data)
- `403` - Forbidden (unauthorized access)
- `404` - Not Found
- `409` - Conflict (duplicate code)
- `500` - Server Error

---

## Notes

1. **Clinic Staff Access:** Clinic staff members can only manage and view panels of their own clinic.
2. **Admin Access:** Admin users can view and manage panels across all clinics.
3. **Panel Code Uniqueness:** Each panel code must be unique within a clinic.
4. **Soft Deletion:** Instead of deleting, consider setting `is_active` to false for data preservation.

---
