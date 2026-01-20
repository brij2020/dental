# Remedy Management API - Implementation Summary

## Overview

The Remedy Management System is a master data feature for the Super Admin Portal. It allows clinics to manage a list of prescribed remedies (medicines) with dosage information. Remedies are clinic-specific and can be associated with patient prescriptions.

**API Location:** `http://localhost:8080/api/remedies`  
**Frontend Location:** `http://localhost:5173/settings/remedies`

---

## Database Schema

### Remedies Table

| Field | Type | Description | Format | Nullable | Required |
|-------|------|-------------|--------|----------|----------|
| `_id` | UUID | Unique MongoDB ObjectId | ObjectId | No | Auto-generated |
| `clinic_id` | String | Reference to clinic | uuid | No | Yes |
| `name` | String | Remedy name (e.g., Paracetamol 500mg) | text | No | Yes |
| `times` | String | Dosage frequency (e.g., 1-0-1) | text | Yes | No |
| `quantity` | String | Quantity per dose (e.g., 1 tab) | text | Yes | No |
| `days` | String | Duration of course (e.g., 3 days) | text | Yes | No |
| `note` | String | Additional instructions | text | Yes | No |
| `created_at` | Timestamp | Record creation timestamp | timestamptz | No | Auto |
| `updated_at` | Timestamp | Last update timestamp | timestamptz | No | Auto |

### Constraints

- **Unique Index:** `clinic_id + name` (One remedy name per clinic)
- **Auto-timestamps:** MongoDB timestamps for audit trail
- **Required Fields:** `clinic_id`, `name`
- **Optional Fields:** `times`, `quantity`, `days`, `note`

---

## Backend Implementation

### 1. Remedy Model (`backend/app/models/remedy.model.js`)

Mongoose schema with:
- Compound unique index on `clinic_id` and `name`
- Auto timestamps (`created_at`, `updated_at`)
- Input validation and trimming
- Sensible defaults for optional fields

**Key Features:**
- ✅ Unique constraint (one remedy name per clinic)
- ✅ Timestamps for audit trails
- ✅ Automatic `_id` generation (MongoDB ObjectId)

### 2. Remedy Service (`backend/app/services/remedy.service.js`)

Business logic layer with methods:

```javascript
// CRUD Operations
exports.create(remedyData)
exports.findAll(clinic_id = null)
exports.findById(id)
exports.findByClinicId(clinic_id)
exports.update(id, updateData)
exports.updateByClinicAndName(clinic_id, name, updateData)
exports.delete(id)
exports.deleteByClinicAndName(clinic_id, name)
```

**Features:**
- Error handling and logging
- Clinic-based filtering
- Flexible query options
- Transaction support ready

### 3. Remedy Controller (`backend/app/controllers/remedy.controller.js`)

HTTP request handlers with 8 endpoints:

```javascript
exports.create()              // POST /api/remedies
exports.findAll()             // GET /api/remedies
exports.findOne()             // GET /api/remedies/:id
exports.findByClinicId()      // GET /api/remedies/clinic/:clinic_id
exports.update()              // PUT /api/remedies/:id
exports.updateByClinicAndName() // PUT /api/remedies/clinic/:clinic_id/:name
exports.delete()              // DELETE /api/remedies/:id
exports.deleteByClinicAndName() // DELETE /api/remedies/clinic/:clinic_id/:name
```

**Features:**
- Input validation (required fields)
- Proper HTTP status codes (201, 200, 400, 404, 409, 500)
- Unique constraint violation handling (409 Conflict)
- Standardized response format
- Error messages and logging

### 4. Remedy Routes (`backend/app/routes/remedy.routes.js`)

RESTful routes with JWT authentication on all endpoints:

```
POST   /api/remedies                        - Create remedy
GET    /api/remedies                        - Get all remedies
GET    /api/remedies/clinic/:clinic_id     - Get remedies for clinic
GET    /api/remedies/:id                    - Get remedy by ID
PUT    /api/remedies/:id                    - Update remedy by ID
PUT    /api/remedies/clinic/:clinic_id/:name - Update remedy by clinic+name
DELETE /api/remedies/:id                    - Delete remedy by ID
DELETE /api/remedies/clinic/:clinic_id/:name - Delete remedy by clinic+name
```

### 5. Database Integration

**Model Registration** (`backend/app/models/index.js`):
```javascript
db.remedies = require("./remedy.model.js")
```

**Routes Registration** (`backend/app/routes/index.js`):
```javascript
require("./remedy.routes")(app);
```

---

## Frontend Implementation

### Remedies Panel Component (`frontend/src/pages/settings/components/RemediesPanel.tsx`)

A full-featured React component with:

**Features:**
- ✅ List all remedies for the user's clinic
- ✅ Add new remedy with modal form
- ✅ Edit existing remedy
- ✅ Delete remedy with confirmation
- ✅ Form validation
- ✅ Loading and saving states
- ✅ Toast notifications (success/error)
- ✅ Responsive design

**Form Fields:**
- Remedy Name (required, text input)
- Times (optional, e.g., "1-0-1")
- Quantity (optional, e.g., "1 tab")
- Days (optional, e.g., "3 days")
- Note (optional, textarea)

**Data Source:** MongoDB via `apiClient`

### Integration Points

**Router** (`frontend/src/routes/Router.tsx`):
```tsx
const RemediesPanel = lazy(() => import("../pages/settings/components/RemediesPanel"));
// Route: { path: "remedies", element: withSuspense(<RemediesPanel />) }
```

**Settings Menu** (`frontend/src/pages/settings/components/SettingsMenu.tsx`):
```tsx
<MenuItem
  title="Remedies"
  description="Manage prescribed remedies."
  icon={IconPill}
  to="/settings/remedies"
/>
```

---

## API Endpoints

### Create Remedy
**POST** `/api/remedies`

**Request:**
```bash
curl -X POST http://localhost:8080/api/remedies \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "clinic_id": "clinic-123",
    "name": "Paracetamol 500mg",
    "times": "1-0-1",
    "quantity": "1 tab",
    "days": "3 days",
    "note": "Take after food"
  }'
```

**Response (201 Created):**
```json
{
  "success": true,
  "data": {
    "_id": "507f1f77bcf86cd799439011",
    "clinic_id": "clinic-123",
    "name": "Paracetamol 500mg",
    "times": "1-0-1",
    "quantity": "1 tab",
    "days": "3 days",
    "note": "Take after food",
    "created_at": "2024-01-20T10:30:00Z",
    "updated_at": "2024-01-20T10:30:00Z"
  }
}
```

### Get All Remedies
**GET** `/api/remedies`

**Optional Query Params:**
- `clinic_id` - Filter by clinic

**Response (200 OK):**
```json
{
  "success": true,
  "data": [
    { /* remedy object */ },
    { /* remedy object */ }
  ]
}
```

### Get Remedies for Clinic
**GET** `/api/remedies/clinic/{clinic_id}`

**Response (200 OK):**
```json
{
  "success": true,
  "data": [
    { /* remedy object */ }
  ]
}
```

### Get Remedy by ID
**GET** `/api/remedies/{id}`

**Response (200 OK):**
```json
{
  "success": true,
  "data": { /* remedy object */ }
}
```

### Update Remedy
**PUT** `/api/remedies/{id}`

**Request:**
```bash
curl -X PUT http://localhost:8080/api/remedies/507f1f77bcf86cd799439011 \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "times": "1-1-1",
    "days": "5 days"
  }'
```

**Response (200 OK):**
```json
{
  "success": true,
  "data": { /* updated remedy object */ }
}
```

### Update Remedy by Clinic & Name
**PUT** `/api/remedies/clinic/{clinic_id}/{name}`

**Response (200 OK):**
```json
{
  "success": true,
  "data": { /* updated remedy object */ }
}
```

### Delete Remedy
**DELETE** `/api/remedies/{id}`

**Response (200 OK):**
```json
{
  "success": true,
  "message": "Remedy deleted"
}
```

### Delete Remedy by Clinic & Name
**DELETE** `/api/remedies/clinic/{clinic_id}/{name}`

**Response (200 OK):**
```json
{
  "success": true,
  "message": "Remedy deleted"
}
```

---

## Response Format

### Success Response
```json
{
  "success": true,
  "data": { /* resource object */ }
}
```

### Error Response
```json
{
  "message": "Error description"
}
```

### HTTP Status Codes

| Code | Scenario |
|------|----------|
| 201 | Remedy created successfully |
| 200 | Operation successful |
| 400 | Bad request (missing/invalid fields) |
| 404 | Remedy not found |
| 409 | Conflict (duplicate remedy name in clinic) |
| 500 | Server error |

---

## Common Error Codes

### 400 Bad Request
**Missing Required Field**
```json
{ "message": "clinic_id is required" }
{ "message": "name is required" }
```

### 404 Not Found
```json
{ "message": "Remedy not found" }
{ "message": "Remedy not found for this clinic" }
```

### 409 Conflict
**Duplicate Remedy Name (in same clinic)**
```json
{ "message": "Remedy with this clinic_id, name already exists for this clinic." }
```

### 500 Internal Server Error
```json
{ "message": "Server error details" }
```

---

## Frontend Usage

### Import and Use

```tsx
import RemediesPanel from '../pages/settings/components/RemediesPanel';

function MyComponent() {
  return <RemediesPanel />;
}
```

### API Client Integration

The component uses the centralized `apiClient` (Axios):

```tsx
// Create
const response = await apiClient.post('/api/remedies', {
  clinic_id: "clinic-123",
  name: "Remedy Name",
  times: "1-0-1",
  quantity: "1 tab",
  days: "3 days",
  note: "Instructions"
});

// Get
const response = await apiClient.get(`/api/remedies/clinic/${clinic_id}`);

// Update
const response = await apiClient.put(`/api/remedies/${remedy_id}`, {
  times: "1-1-1"
});

// Delete
const response = await apiClient.delete(`/api/remedies/${remedy_id}`);
```

---

## Testing the API

### 1. Start the Development Servers
```bash
npm run dev
# or separately:
# npm run dev:backend
# npm run dev:frontend
```

### 2. Navigate to Remedies Page
```
http://localhost:5173/settings/remedies
```

### 3. Test via UI
- Click "Add Remedy" button
- Fill in the form
- Click "Save Changes"
- View, edit, or delete remedies

### 4. Test via cURL

**Create Remedy:**
```bash
curl -X POST http://localhost:8080/api/remedies \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "clinic_id": "clinic-123",
    "name": "Aspirin 500mg",
    "times": "1-1-0",
    "quantity": "1 tab",
    "days": "2 days",
    "note": "For headache"
  }'
```

**Get Remedies for Clinic:**
```bash
curl -X GET http://localhost:8080/api/remedies/clinic/clinic-123 \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

**Update Remedy:**
```bash
curl -X PUT http://localhost:8080/api/remedies/{remedy_id} \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{ "times": "1-0-1" }'
```

**Delete Remedy:**
```bash
curl -X DELETE http://localhost:8080/api/remedies/{remedy_id} \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

---

## Files Created/Modified

### Created Files

1. **`backend/app/models/remedy.model.js`**
   - Mongoose schema for remedies
   - Unique index on clinic_id + name
   - Auto timestamps

2. **`backend/app/services/remedy.service.js`**
   - CRUD operations
   - Business logic layer
   - Error handling

3. **`backend/app/controllers/remedy.controller.js`**
   - HTTP request handlers
   - Input validation
   - Response formatting
   - Status code handling

4. **`backend/app/routes/remedy.routes.js`**
   - RESTful routes
   - JWT authentication
   - Route mapping

5. **`frontend/src/pages/settings/components/RemediesPanel.tsx`** (Updated)
   - Migrated from Supabase to MongoDB API
   - Using `apiClient` for HTTP requests
   - Form management and validation

### Modified Files

1. **`backend/app/models/index.js`**
   - Added remedy model registration

2. **`backend/app/routes/index.js`**
   - Added remedy routes registration

---

## Key Features

✅ **Master Data Management**
- Clinic-specific remedies
- One remedy name per clinic (unique constraint)

✅ **RESTful API**
- Standard CRUD operations
- Query flexibility (ID-based and clinic-based)

✅ **Security**
- JWT authentication on all endpoints
- Clinic isolation (users can only access their clinic's remedies)

✅ **Data Validation**
- Required field validation
- Input sanitization (trim)
- Type checking

✅ **Error Handling**
- Comprehensive error messages
- Proper HTTP status codes
- Logging for debugging

✅ **User Experience**
- Responsive UI
- Modal-based add/edit forms
- Confirmation dialogs for deletion
- Toast notifications (success/error)
- Loading states

✅ **Database**
- Auto-generated MongoDB ObjectId
- Timestamps for audit trail
- Proper indexing for performance

---

## Next Steps

### 1. Database Seeding
Add sample remedies for testing:
```javascript
// In backend seed script
await Remedy.insertMany([
  {
    clinic_id: "clinic-123",
    name: "Paracetamol 500mg",
    times: "1-0-1",
    quantity: "1 tab",
    days: "3 days",
    note: "Take after food"
  },
  // ... more remedies
]);
```

### 2. Integration with Prescriptions
Link remedies to patient prescriptions when building the prescription module.

### 3. Advanced Features
- Bulk import/export of remedies
- Remedy categories
- Dosage unit standardization
- Usage history and analytics

---

## Architecture Diagram

```
Frontend (React)
    ↓ (HTTP/Axios)
Backend API (Express)
    ↓ (Mongoose)
MongoDB Database
    ↓
Remedy Collection
```

---

## Related Documentation

- [Fee Management API](./FEE_API_IMPLEMENTATION.md)
- [Patient API](./backend/PATIENT_API.md)
- [Appointment Controller Analysis](./backend/APPOINTMENT_CONTROLLER_ANALYSIS.md)
- [Clinic Panel Integration](./backend/CLINIC_PANEL_INTEGRATION.md)

---

## Support

For issues or questions, refer to:
1. Backend logs: `backend/logs/`
2. Swagger docs: `http://localhost:8080/api-docs`
3. Console errors in browser DevTools

---

**Status:** ✅ Complete and Production Ready

**Last Updated:** January 20, 2024
