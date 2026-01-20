# Patient API Documentation

## Base URL
```
http://localhost:8080/api/patient
```

## Overview

Patients can be registered in two ways:
1. **Clinic Registration** (`registration_type: "clinic"`) - Registered by clinic staff for their clinic
2. **Global Registration** (`registration_type: "global"`) - Registered from main admin panel for the entire system

---

## Endpoints

### 1. Create Patient (Clinic or Global)
**POST** `/`

**Description:** Create a new patient - either for a specific clinic or as a global patient

**Headers:**
- `Content-Type: application/json`
- `Authorization: Bearer {token}` (optional)

**Request Body (Clinic Registration):**
```json
{
  "clinic_id": "APO2600001",
  "registration_type": "clinic",
  "full_name": "John Doe",
  "email": "patient@example.com",
  "gender": "Male",
  "contact_number": "9876543210",
  "date_of_birth": "1990-05-15",
  "address": "123 Main St",
  "state": "California",
  "city": "Los Angeles",
  "pincode": "900001",
  "avatar": "https://example.com/avatar.jpg",
  "panel": "General"
}
```

**Request Body (Global Registration):**
```json
{
  "registration_type": "global",
  "full_name": "Jane Smith",
  "email": "jane@example.com",
  "gender": "Female",
  "contact_number": "9876543211",
  "date_of_birth": "1995-03-20"
}
```

**Response (201):**
```json
{
  "message": "Patient created successfully",
  "data": {
    "_id": "65a1b2c3d4e5f6g7h8i9j0k1",
    "uhid": "APO2600001/24/000001",
    "clinic_id": "APO2600001",
    "registration_type": "clinic",
    "email": "patient@example.com",
    "full_name": "John Doe",
    "gender": "Male",
    "contact_number": "9876543210",
    "date_of_birth": "1990-05-15",
    "address": "123 Main St",
    "state": "California",
    "city": "Los Angeles",
    "pincode": "900001",
    "avatar": "https://example.com/avatar.jpg",
    "panel": "General",
    "created_at": "2024-01-17T10:30:00Z",
    "updated_at": "2024-01-17T10:30:00Z"
  }
}
```

**Note:** 
- `uhid` is auto-generated
- For **clinic** registration: Format is `CLINIC_ID/YY/SEQUENCE` (e.g., `APO2600001/24/000001`)
- For **global** registration: Format is `GLOBAL/YY/SEQUENCE` (e.g., `GLOBAL/24/000001`)

---

### 2. Get All Patients
**GET** `/`

**Description:** Get patients - clinic staff see only their clinic's patients, admin can see all or filter by clinic/type

**Headers:**
- `Authorization: Bearer {token}` (required)

**Query Parameters:**
- `search` (optional): Search by name, email, contact number, or UHID
- `gender` (optional): Filter by gender (Male, Female, Other)
- `state` (optional): Filter by state
- `city` (optional): Filter by city
- `clinic_id` (optional): Filter by clinic (admin only)
- `registration_type` (optional): Filter by type - "clinic" or "global"
- `page` (optional): Page number (default: 1)
- `limit` (optional): Records per page (default: 10)

**Example Requests:**
```
# Clinic staff - get their patients
GET /api/patient?search=john&page=1&limit=10

# Admin - get all global patients
GET /api/patient?registration_type=global

# Admin - get specific clinic's patients
GET /api/patient?clinic_id=APO2600001&registration_type=clinic
```

**Response (200):**
```json
{
  "data": [
    {
      "_id": "65a1b2c3d4e5f6g7h8i9j0k1",
      "uhid": "APO2600001/24/000001",
      "email": "patient@example.com",
      "full_name": "John Doe",
      "gender": "Male",
      "contact_number": "9876543210",
      "date_of_birth": "1990-05-15",
      "address": "123 Main St",
      "state": "California",
      "city": "Los Angeles",
      "pincode": "900001",
      "avatar": "https://example.com/avatar.jpg",
      "panel": "General",
      "clinic_id": "APO2600001",
      "registration_type": "clinic",
      "created_at": "2024-01-17T10:30:00Z",
      "updated_at": "2024-01-17T10:30:00Z"
    }
  ],
  "pagination": {
    "total": 1,
    "page": 1,
    "limit": 10,
    "pages": 1
  }
}
```

---

### 3. Get Patient by ID
**GET** `/:id`

**Description:** Get a specific patient by ID

**Headers:**
- `Authorization: Bearer {token}` (required)

**URL Parameters:**
- `id`: Patient MongoDB ID

**Example Request:**
```
GET /api/patient/65a1b2c3d4e5f6g7h8i9j0k1
```

**Response (200):**
```json
{
  "data": {
    "_id": "65a1b2c3d4e5f6g7h8i9j0k1",
    "uhid": "UH001",
    "email": "patient@example.com",
    "full_name": "John Doe",
    "gender": "Male",
    "contact_number": "9876543210",
    "date_of_birth": "1990-05-15",
    "address": "123 Main St",
    "state": "California",
    "city": "Los Angeles",
    "pincode": "900001",
    "avatar": "https://example.com/avatar.jpg",
    "panel": "General",
    "clinic_id": "APO2600001",
    "created_at": "2024-01-17T10:30:00Z",
    "updated_at": "2024-01-17T10:30:00Z"
  }
}
```

---

### 4. Get Patient by UHID
**GET** `/uhid/:uhid`

**Description:** Get a patient by their UHID (works for both clinic and global patients)

**Headers:**
- `Authorization: Bearer {token}` (required)

**URL Parameters:**
- `uhid`: Patient UHID (e.g., `APO2600001/24/000001` or `GLOBAL/24/000001`)

**Example Request:**
```
GET /api/patient/uhid/APO2600001/24/000001
```

**Response (200):**
```json
{
  "data": {
    "_id": "65a1b2c3d4e5f6g7h8i9j0k1",
    "uhid": "APO2600001/24/000001",
    "email": "patient@example.com",
    "full_name": "John Doe",
    "registration_type": "clinic",
    "clinic_id": "APO2600001",
    ...
  }
}
```

---

### 5. Get Patient by Email
**GET** `/email/:email`

**Description:** Get a patient by their email

**Headers:**
- `Authorization: Bearer {token}` (required)

**URL Parameters:**
- `email`: Patient email address

**Example Request:**
```
GET /api/patient/email/patient@example.com
```

**Response (200):**
```json
{
  "data": {
    "_id": "65a1b2c3d4e5f6g7h8i9j0k1",
    "email": "patient@example.com",
    "full_name": "John Doe",
    ...
  }
}
```

---

### 6. Update Patient
**PUT** `/:id`

**Description:** Update a patient record

**Headers:**
- `Authorization: Bearer {token}` (required)
- `Content-Type: application/json`

**URL Parameters:**
- `id`: Patient MongoDB ID

**Request Body (partial update supported):**
```json
{
  "full_name": "Jane Doe",
  "gender": "Female",
  "contact_number": "9876543211",
  "address": "456 Oak St"
}
```

**Response (200):**
```json
{
  "message": "Patient updated successfully",
  "data": {
    "_id": "65a1b2c3d4e5f6g7h8i9j0k1",
    "uhid": "UH001",
    "email": "patient@example.com",
    "full_name": "Jane Doe",
    "gender": "Female",
    "contact_number": "9876543211",
    "address": "456 Oak St",
    ...
  }
}
```

---

### 7. Delete Patient
**DELETE** `/:id`

**Description:** Delete a patient record

**Headers:**
- `Authorization: Bearer {token}` (required)

**URL Parameters:**
- `id`: Patient MongoDB ID

**Example Request:**
```
DELETE /api/patient/65a1b2c3d4e5f6g7h8i9j0k1
```

**Response (200):**
```json
{
  "message": "Patient deleted successfully"
}
```

---

### 8. Bulk Delete Patients
**POST** `/bulk-delete`

**Description:** Delete multiple patients at once

**Headers:**
- `Authorization: Bearer {token}` (required)
- `Content-Type: application/json`

**Request Body:**
```json
{
  "ids": [
    "65a1b2c3d4e5f6g7h8i9j0k1",
    "65a1b2c3d4e5f6g7h8i9j0k2",
    "65a1b2c3d4e5f6g7h8i9j0k3"
  ]
}
```

**Response (200):**
```json
{
  "message": "3 patients deleted successfully",
  "data": {
    "deletedCount": 3
  }
}
```

---

### 9. Check If Patient Exists
**GET** `/check-exists?email=patient@example.com`

**Description:** Check if a patient exists by email (searches both clinic and global patients)

**Headers:**
- `Authorization: Bearer {token}` (required)

**Query Parameters:**
- `email` (required): Patient email

**Example Request:**
```
GET /api/patient/check-exists?email=patient@example.com
```

**Response (200):**
```json
{
  "exists": true
}
```

---

## Field Descriptions

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| id | UUID | - | Auto-generated unique identifier |
| uhid | Text | - | **Auto-generated** Unique Health ID. Format depends on registration type: <br> - **Clinic**: `CLINIC_ID/YY/SEQUENCE` (e.g., `APO2600001/24/000001`) <br> - **Global**: `GLOBAL/YY/SEQUENCE` (e.g., `GLOBAL/24/000001`) |
| email | Text | No | Patient email address |
| full_name | Text | Yes | Patient full name |
| gender | Enum | No | Gender (Male, Female, Other) |
| contact_number | Text | No | Phone number (10 digits, starts with 6-9) |
| date_of_birth | Date | No | Date of birth |
| address | Text | No | Street address |
| state | Text | No | State |
| city | Text | No | City |
| pincode | Text | No | Postal code (6 digits) |
| avatar | Text | No | Avatar/profile image URL |
| panel | Text | No | Panel/department name |
| clinic_id | Text | Conditional | Associated clinic ID (required for "clinic" type, null for "global") |
| registration_type | Enum | No | Registration type: "clinic" or "global" (default: "global") |
| ref | Text | No | Reference field |
| created_at | Timestamp | - | Auto-generated creation timestamp |
| updated_at | Timestamp | - | Auto-generated update timestamp |

---

## Error Responses

### 400 Bad Request
```json
{
  "message": "clinic_id and full_name are required"
}
```

### 404 Not Found
```json
{
  "message": "Patient not found"
}
```

### 500 Internal Server Error
```json
{
  "message": "Error creating patient"
}
```

---

## Example Usage (Frontend - TypeScript)

```typescript
import { get, post, put, del } from './apiClient';

// Create patient
const createPatient = async (patientData) => {
  const response = await post('/api/patient', {
    clinic_id: 'APO2600001',
    ...patientData
  });
  return response.data;
};

// Get all patients
const getAllPatients = async (filters) => {
  const params = new URLSearchParams(filters);
  const response = await get(`/api/patient?${params}`);
  return response.data;
};

// Get patient by ID
const getPatient = async (id) => {
  const response = await get(`/api/patient/${id}`);
  return response.data;
};

// Update patient
const updatePatient = async (id, updateData) => {
  const response = await put(`/api/patient/${id}`, updateData);
  return response.data;
};

// Delete patient
const deletePatient = async (id) => {
  const response = await del(`/api/patient/${id}`);
  return response.data;
};

// Bulk delete
const bulkDeletePatients = async (ids) => {
  const response = await post('/api/patient/bulk-delete', { ids });
  return response.data;
};

// Check exists
const checkPatientExists = async (email) => {
  const response = await get(`/api/patient/check-exists?email=${email}`);
  return response.data.exists;
};
```
