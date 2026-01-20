# Remedy Management API - Quick Reference

## Database Schema

| Field | Type | Nullable | Required |
|-------|------|----------|----------|
| `_id` | ObjectId | No | Auto |
| `clinic_id` | String | No | Yes |
| `name` | String | No | Yes |
| `times` | String | Yes | No |
| `quantity` | String | Yes | No |
| `days` | String | Yes | No |
| `note` | String | Yes | No |
| `created_at` | Timestamp | No | Auto |
| `updated_at` | Timestamp | No | Auto |

**Unique Index:** `clinic_id + name` (one remedy name per clinic)

---

## API Endpoints

| Method | Endpoint | Description | Auth |
|--------|----------|-------------|------|
| POST | `/api/remedies` | Create remedy | ✅ |
| GET | `/api/remedies` | Get all remedies | ✅ |
| GET | `/api/remedies/clinic/:clinic_id` | Get remedies by clinic | ✅ |
| GET | `/api/remedies/:id` | Get remedy by ID | ✅ |
| PUT | `/api/remedies/:id` | Update remedy by ID | ✅ |
| PUT | `/api/remedies/clinic/:clinic_id/:name` | Update by clinic+name | ✅ |
| DELETE | `/api/remedies/:id` | Delete remedy by ID | ✅ |
| DELETE | `/api/remedies/clinic/:clinic_id/:name` | Delete by clinic+name | ✅ |

---

## Example Requests

### Create Remedy
```bash
curl -X POST http://localhost:8080/api/remedies \
  -H "Authorization: Bearer TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "clinic_id": "clinic-123",
    "name": "Paracetamol 500mg",
    "times": "1-0-1",
    "quantity": "1 tab",
    "days": "3 days",
    "note": "After food"
  }'
```

### Get Clinic Remedies
```bash
curl -X GET http://localhost:8080/api/remedies/clinic/clinic-123 \
  -H "Authorization: Bearer TOKEN"
```

### Update Remedy
```bash
curl -X PUT http://localhost:8080/api/remedies/{remedy_id} \
  -H "Authorization: Bearer TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "times": "1-1-1",
    "days": "5 days"
  }'
```

### Delete Remedy
```bash
curl -X DELETE http://localhost:8080/api/remedies/{remedy_id} \
  -H "Authorization: Bearer TOKEN"
```

---

## Response Format

### Success (201/200)
```json
{
  "success": true,
  "data": { /* remedy object */ }
}
```

### Error
```json
{
  "message": "Error description"
}
```

---

## Frontend Usage

```tsx
import RemediesPanel from '../pages/settings/components/RemediesPanel';

// Component is fully featured with:
// - Add, Edit, Delete
// - Form validation
// - Toast notifications
// - Loading states
// - Responsive design
```

---

## HTTP Status Codes

| Code | Scenario |
|------|----------|
| 201 | Created |
| 200 | Success |
| 400 | Bad request |
| 404 | Not found |
| 409 | Conflict (duplicate) |
| 500 | Server error |

---

## Backend Files Location

- **Model:** `backend/app/models/remedy.model.js`
- **Service:** `backend/app/services/remedy.service.js`
- **Controller:** `backend/app/controllers/remedy.controller.js`
- **Routes:** `backend/app/routes/remedy.routes.js`

---

## Frontend Files Location

- **Component:** `frontend/src/pages/settings/components/RemediesPanel.tsx`
- **Route:** `/settings/remedies`
- **API:** Uses centralized `apiClient`

---

## Testing

1. Start: `npm run dev`
2. Visit: `http://localhost:5173/settings/remedies`
3. Add/Edit/Delete remedies
4. Check console for API logs
5. View Swagger docs: `http://localhost:8080/api-docs`

---

## Key Features

✅ Master data for clinics
✅ Unique remedy names per clinic
✅ Optional dosage information
✅ Full CRUD API
✅ JWT authentication
✅ Responsive UI
✅ Auto timestamps
✅ Input validation

---

## Common Errors

| Error | Fix |
|-------|-----|
| `clinic_id is required` | Include clinic_id in request |
| `name is required` | Include remedy name |
| `Remedy with this...already exists` | Remedy name already exists in clinic (409) |
| `Remedy not found` | Invalid remedy ID or clinic_id |
| `Authorization failed` | Check JWT token |

---

**Status:** ✅ Production Ready
