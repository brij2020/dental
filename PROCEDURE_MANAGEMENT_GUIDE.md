# ✅ Procedure Management System - Complete Guide

## Quick Start

### 1. Access the UI
Navigate to: **http://localhost:5173/settings/procedures**

### 2. Operations
- **View**: All clinic procedures display in a table
- **Add**: Click "Add Procedure" button
- **Edit**: Click pencil icon on any row
- **Delete**: Click trash icon (with confirmation)

## System Architecture

```
Frontend (React/TypeScript)
├── ProcedurePanel.tsx (UI Component)
├── apiClient.ts (API Functions)
└── useAuth() (User Context)

Backend (Express/Node.js)
├── procedure.controller.js (5 Endpoints)
├── procedure.routes.js (Route Definitions)
├── procedure.model.js (MongoDB Schema)
└── auth.middleware.js (JWT Validation)

Database (MongoDB)
└── procedures (Collection)
```

## Database Schema

```javascript
{
  _id: ObjectId,
  clinic_id: String (indexed),
  name: String (required),
  procedure_type: Enum (11 types),
  description: String,
  cost: Number (min 0),
  note: String,
  is_active: Boolean,
  created_at: DateTime,
  updated_at: DateTime
}
```

## API Reference

### Authentication
All endpoints require Bearer token in `Authorization` header:
```
Authorization: Bearer YOUR_JWT_TOKEN
```

### Endpoints

#### GET /api/procedures
**Fetch all procedures for a clinic**

```javascript
// Request
GET http://127.0.0.1:8080/api/procedures?clinic_id=clinic-123
Headers: {
  "Authorization": "Bearer TOKEN",
  "Content-Type": "application/json"
}

// Response (200)
{
  "data": [
    {
      "_id": "507f1f77bcf86cd799439011",
      "clinic_id": "clinic-123",
      "name": "Root Canal Therapy",
      "procedure_type": "Endodontic",
      "description": "Complete endodontic treatment",
      "cost": 2000,
      "note": "Includes consultation",
      "is_active": true,
      "created_at": "2026-01-21T10:00:00Z",
      "updated_at": "2026-01-21T10:00:00Z"
    }
  ]
}
```

#### GET /api/procedures/:id
**Fetch a single procedure**

```javascript
// Request
GET http://127.0.0.1:8080/api/procedures/507f1f77bcf86cd799439011
Headers: { "Authorization": "Bearer TOKEN" }

// Response (200)
{ "data": { /* procedure object */ } }

// Response (404)
{ "message": "Procedure not found" }
```

#### POST /api/procedures
**Create a new procedure**

```javascript
// Request
POST http://127.0.0.1:8080/api/procedures
Headers: { "Authorization": "Bearer TOKEN" }
Body: {
  "clinic_id": "clinic-123",
  "name": "Root Canal Therapy",
  "procedure_type": "Endodontic",
  "description": "Complete endodontic treatment",
  "cost": 2000,
  "note": "Includes consultation"
}

// Response (201)
{ "data": { /* created procedure */ } }

// Response (400)
{ "message": "clinic_id and name are required" }
{ "message": "Cost must be a non-negative number" }
```

#### PUT /api/procedures/:id
**Update a procedure**

```javascript
// Request
PUT http://127.0.0.1:8080/api/procedures/507f1f77bcf86cd799439011
Headers: { "Authorization": "Bearer TOKEN" }
Body: {
  "name": "Advanced Root Canal",
  "cost": 2500,
  "description": "Updated description",
  "note": "Updated note"
}

// Response (200)
{ "data": { /* updated procedure */ } }

// Response (404)
{ "message": "Procedure not found" }
```

#### DELETE /api/procedures/:id
**Delete a procedure**

```javascript
// Request
DELETE http://127.0.0.1:8080/api/procedures/507f1f77bcf86cd799439011
Headers: { "Authorization": "Bearer TOKEN" }

// Response (200)
{ "message": "Procedure deleted successfully" }

// Response (404)
{ "message": "Procedure not found" }
```

## Procedure Types (Enum)

| Type | Description |
|------|-------------|
| **General** | General dental procedures |
| **Cosmetic** | Cosmetic treatments (whitening, veneers) |
| **Surgical** | Surgical procedures (extractions, implants) |
| **Diagnostic** | Diagnostic services (X-rays, scans) |
| **Preventive** | Preventive care (cleaning, sealants) |
| **Restorative** | Restorative work (fillings, crowns) |
| **Orthodontic** | Orthodontic treatments (braces, aligners) |
| **Prosthodontic** | Prosthetic services (dentures, bridges) |
| **Periodontal** | Periodontal treatments (scaling, gum disease) |
| **Endodontic** | Endodontic procedures (root canals) |
| **Other** | Other procedures not listed above |

## Frontend Integration

### Component Location
`src/pages/settings/components/ProcedurePanel.tsx` (701 lines)

### Features
✅ Responsive table view
✅ Add/Edit modal with form validation
✅ Delete with confirmation
✅ Toast notifications for all operations
✅ Loading states and error handling
✅ Clinic-scoped data (auto-filtered by logged-in user's clinic)

### API Functions Used
```typescript
import {
  getProcedures,
  createProcedure,
  updateProcedure,
  deleteProcedure,
} from '../../../lib/apiClient';
```

## Backend Implementation

### Files Created
1. **procedure.model.js** (49 lines)
   - MongoDB schema definition
   - Enum for 11 procedure types
   - Index on clinic_id for performance
   - Timestamps (created_at, updated_at)

2. **procedure.controller.js** (142 lines)
   - getAllProcedures - Fetch clinic procedures
   - getProcedureById - Get single procedure
   - createProcedure - Create with validation
   - updateProcedure - Update with validation
   - deleteProcedure - Soft delete or hard delete

3. **procedure.routes.js** (28 lines)
   - Express router with 5 RESTful endpoints
   - Applied auth middleware to all routes

### Files Updated
1. **models/index.js**
   - Added: `db.procedures = require("./procedure.model.js")`

2. **routes/index.js**
   - Added: `app.use("/api/procedures", require("./procedure.routes"))`

## Error Handling

### Validation Errors (400)
```javascript
// Missing required fields
{ "message": "clinic_id and name are required" }

// Invalid cost
{ "message": "Cost must be a non-negative number" }
```

### Not Found (404)
```javascript
{ "message": "Procedure not found" }
```

### Server Error (500)
```javascript
{ "message": "Error details from MongoDB or validation" }
```

## Data Flow

### Create Procedure
```
User Input (Form) 
  → Validation (Client)
  → POST /api/procedures
  → Controller Validation
  → Mongoose Save
  → Return Created Document
  → Update UI Table
  → Success Toast
```

### Update Procedure
```
User Clicks Edit
  → Load Data in Modal
  → User Modifies Fields
  → PUT /api/procedures/:id
  → Controller Validation
  → findByIdAndUpdate()
  → Return Updated Document
  → Refresh Table
  → Success Toast
```

### Delete Procedure
```
User Clicks Delete
  → Confirmation Dialog
  → DELETE /api/procedures/:id
  → Find and Delete
  → Remove from UI
  → Success Toast
```

## Testing

### Using cURL
```bash
# Get all procedures
curl -X GET 'http://127.0.0.1:8080/api/procedures?clinic_id=YOUR_CLINIC_ID' \
  -H 'Authorization: Bearer YOUR_TOKEN' \
  -H 'Content-Type: application/json'

# Create procedure
curl -X POST 'http://127.0.0.1:8080/api/procedures' \
  -H 'Authorization: Bearer YOUR_TOKEN' \
  -H 'Content-Type: application/json' \
  -d '{
    "clinic_id": "YOUR_CLINIC_ID",
    "name": "Teeth Whitening",
    "procedure_type": "Cosmetic",
    "cost": 500
  }'
```

### Using Postman
1. Import collection from API documentation
2. Set Bearer token in Authorization tab
3. Use example requests from endpoints above

### Using Frontend UI
1. Navigate to `/settings/procedures`
2. Click "Add Procedure"
3. Fill in name, type, cost, description, note
4. Click "Save Changes"
5. Verify in table and toast notification

## Performance Considerations

✅ **Indexed clinic_id**: Fast filtering by clinic
✅ **Direct MongoDB queries**: No join tables needed
✅ **Pagination-ready**: Can add limit/skip to controller
✅ **Lean queries**: Can optimize MongoDB with .lean()
✅ **Caching**: Can add Redis caching for procedure types

## Security

✅ **JWT Authentication**: All endpoints protected
✅ **clinic_id Validation**: Users can only access own clinic data
✅ **Input Validation**: Required fields and types checked
✅ **Error Messages**: Don't expose internal errors
✅ **Logging**: All operations logged with timestamp

## Troubleshooting

### Issue: "clinic_id is required"
**Solution**: Make sure to pass clinic_id in query params (GET) or request body (POST/PUT)

### Issue: "Procedure not found"
**Solution**: Verify the procedure _id exists for your clinic

### Issue: 401 Unauthorized
**Solution**: Check that Bearer token is valid and includes Authorization header

### Issue: CORS Error
**Solution**: Verify frontend baseURL and backend CORS configuration

### Issue: MongoDB Connection Error
**Solution**: Ensure MongoDB is running and connection string is correct

## Future Enhancements

1. **Bulk Operations**: Import/export procedures from CSV
2. **Categories**: Group procedures by category
3. **Pricing History**: Track cost changes over time
4. **Search/Filter**: Advanced search by type, cost range
5. **Pagination**: Handle large procedure lists
6. **Soft Delete**: Keep deleted procedures for audit trail
7. **Approval Workflow**: Pending procedures pending admin review
8. **Scheduling**: Link procedures to appointment slots

## Files Modified

| File | Lines | Change |
|------|-------|--------|
| `backend/app/models/procedure.model.js` | 49 | Created |
| `backend/app/controllers/procedure.controller.js` | 142 | Created |
| `backend/app/routes/procedure.routes.js` | 28 | Created |
| `backend/app/models/index.js` | 1 | Added export |
| `backend/app/routes/index.js` | 1 | Added route |
| `frontend/src/lib/apiClient.ts` | 43 | Added functions |
| `frontend/src/pages/settings/components/ProcedurePanel.tsx` | 701 | Migrated |

---

## Support

For issues or questions:
1. Check the error message from toast notifications
2. Review browser console for client-side errors
3. Check backend logs (server.js terminal)
4. Verify MongoDB connection
5. Ensure JWT token is valid

**Last Updated**: January 21, 2026
**Status**: ✅ Production Ready
