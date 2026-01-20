# Clinic Panel System - Quick Reference

## 📌 Files Overview

```
node-express-mongodb/
├── app/
│   ├── models/
│   │   ├── clinicPanel.model.js      ✅ NEW - Panel schema
│   │   └── index.js                  ✏️ UPDATED - Added clinicPanel export
│   │
│   ├── services/
│   │   └── clinicPanel.service.js    ✅ NEW - Business logic
│   │
│   ├── controllers/
│   │   └── clinicPanel.controller.js ✅ NEW - API handlers
│   │
│   └── routes/
│       ├── clinicPanel.routes.js     ✅ NEW - API endpoints
│       └── index.js                  ✏️ UPDATED - Routes registration
│
├── CLINIC_PANEL_API.md               ✅ NEW - Full API docs
├── CLINIC_PANEL_INTEGRATION.md       ✅ NEW - Integration guide
├── CLINIC_PANEL_SUMMARY.md           ✅ NEW - This summary
└── CLINIC_PANEL_QUICK_REF.md         ✅ NEW - Quick reference
```

---

## 🚀 Quick Start

### 1. Server Already Configured
No configuration needed! All files are created and integrated.

### 2. Test API Immediately
```bash
# Get active panels
curl http://localhost:5000/api/clinic-panels/active \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "clinic_id: clinic123"
```

### 3. Use in Patient Form
```javascript
// Fetch panels
const response = await fetch('/api/clinic-panels?clinic_id=clinic123', {
  headers: { 'Authorization': `Bearer ${token}` }
});
const { data } = await response.json();

// Show in dropdown
<select name="panel">
  {data.map(p => <option value={p.code}>{p.name}</option>)}
</select>
```

---

## 📋 Common Tasks

### Create a Panel
```javascript
POST /api/clinic-panels
{
  "name": "Pediatric Dentistry",
  "code": "PED",
  "clinic_id": "clinic123",
  "specialization": "Pediatric Dentistry"
}
```

### Get Panels for Dropdown
```javascript
GET /api/clinic-panels/active?clinic_id=clinic123
```

### Filter by Specialization
```javascript
GET /api/clinic-panels/specialization?clinic_id=clinic123&specialization=Orthodontics
```

### Register Patient with Panel
```javascript
POST /api/patient
{
  "full_name": "John",
  "email": "john@test.com",
  "panel": "PED",
  "clinic_id": "clinic123",
  "registration_type": "clinic"
}
```

### Add Dentist to Panel
```javascript
POST /api/clinic-panels/{panelId}/dentist/add
{ "dentistId": "doc123" }
```

---

## 📊 Available Specializations

```
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
```

---

## 🔌 API Endpoints Cheat Sheet

| Action | Method | Endpoint |
|--------|--------|----------|
| Create | POST | `/api/clinic-panels` |
| List | GET | `/api/clinic-panels` |
| Active | GET | `/api/clinic-panels/active` |
| By ID | GET | `/api/clinic-panels/:id` |
| By Code | GET | `/api/clinic-panels/code/:clinic_id/:code` |
| By Specialization | GET | `/api/clinic-panels/specialization` |
| By Dentist | GET | `/api/clinic-panels/dentist/:dentistId` |
| Update | PUT | `/api/clinic-panels/:id` |
| Delete | DELETE | `/api/clinic-panels/:id` |
| Add Doctor | POST | `/api/clinic-panels/:panelId/dentist/add` |
| Remove Doctor | POST | `/api/clinic-panels/:panelId/dentist/remove` |

---

## 📤 Request Headers

All requests need:
```
Authorization: Bearer YOUR_JWT_TOKEN
Content-Type: application/json
```

---

## 📥 Response Format

### Success (200)
```json
{
  "message": "Success message",
  "data": { /* response object */ }
}
```

### Error
```json
{
  "message": "Error description"
}
```

---

## 🔐 Permissions

- **Clinic Staff:** Can only manage their own clinic's panels
- **Admin:** Can manage all clinics' panels
- **All:** Require valid JWT token

---

## 📱 Frontend Integration Example

```javascript
import { useState, useEffect } from 'react';

function PatientForm() {
  const [panels, setPanels] = useState([]);
  const clinicId = 'clinic123';

  // Load panels
  useEffect(() => {
    fetch(`/api/clinic-panels/active?clinic_id=${clinicId}`, {
      headers: { 'Authorization': `Bearer ${token}` }
    })
    .then(r => r.json())
    .then(d => setPanels(d.data));
  }, []);

  // Submit patient
  const handleSubmit = async (formData) => {
    await fetch('/api/patient', {
      method: 'POST',
      headers: { 
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        ...formData,
        clinic_id: clinicId,
        registration_type: 'clinic'
      })
    });
  };

  return (
    <form>
      {/* Other fields */}
      <select name="panel" required>
        {panels.map(p => (
          <option key={p._id} value={p.code}>
            {p.name} ({p.specialization})
          </option>
        ))}
      </select>
      <button type="submit">Register</button>
    </form>
  );
}
```

---

## 🧪 Test Examples

### With cURL
```bash
# Create panel
curl -X POST http://localhost:5000/api/clinic-panels \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"name":"Ortho","code":"ORTHO","clinic_id":"c1","specialization":"Orthodontics"}'

# Get active
curl http://localhost:5000/api/clinic-panels/active \
  -H "Authorization: Bearer $TOKEN" \
  -H "clinic_id: c1"

# Get by specialization
curl "http://localhost:5000/api/clinic-panels/specialization?clinic_id=c1&specialization=Orthodontics" \
  -H "Authorization: Bearer $TOKEN"
```

### With Postman
1. Set Authorization: Bearer YOUR_TOKEN
2. Set Content-Type: application/json
3. Use endpoints from table above
4. Include query parameters as needed

---

## 📝 Query Parameters

### GET /clinic-panels
```
clinic_id=string          (required or from auth)
page=number               (default: 1)
limit=number              (default: 10)
search=string             (searches name/code)
is_active=boolean         (true/false)
status=string             (Active/Inactive/Maintenance)
specialization=string     (filter by specialization)
```

### GET /clinic-panels/specialization
```
clinic_id=string          (required or from auth)
specialization=string     (required)
```

---

## 🎯 Panel Fields

### Required
- `name` - Panel name
- `code` - Unique code per clinic
- `clinic_id` - Clinic reference

### Common Optional
- `specialization` - Type of dentistry
- `description` - Details about panel
- `opening_time` - "09:00" format
- `closing_time` - "18:00" format
- `max_daily_appointments` - Default 20
- `appointment_duration_minutes` - Default 30
- `dentist_ids` - Array of doctor IDs
- `facilities` - Available equipment
- `treatment_types` - Services offered
- `contact_number` - Panel phone
- `email` - Panel email

---

## ✅ Checklist for Implementation

- [ ] Start your server
- [ ] Get a valid JWT token
- [ ] Create your first panel
- [ ] Add dentists to panel
- [ ] Integrate panel dropdown in patient form
- [ ] Test patient registration with panel
- [ ] Customize fields as needed

---

## 🔍 Debugging Tips

### Panel not showing in dropdown?
1. Check clinic_id matches
2. Verify token is valid
3. Ensure panel `is_active` is true
4. Check network tab for errors

### Patient registration fails?
1. Panel code must be in dropdown list
2. All required fields must be filled
3. Check token authorization
4. Verify clinic_id matches

### Authorization error?
1. Include Authorization header
2. Use Bearer token format
3. Verify token isn't expired
4. For clinic staff, verify clinic_id

---

## 📚 Full Documentation

- **API Reference:** See `CLINIC_PANEL_API.md`
- **Integration Guide:** See `CLINIC_PANEL_INTEGRATION.md`
- **Complete Summary:** See `CLINIC_PANEL_SUMMARY.md`

---

## 🎓 Example Scenarios

### Scenario 1: New Clinic Setup
```
1. Admin creates clinic
2. Admin creates panels (PED, ORTHO, etc.)
3. Admin assigns dentists to panels
4. Clinic staff registers patients with panels
```

### Scenario 2: Patient Registration Flow
```
1. Open patient form
2. Form loads active panels
3. Patient selects panel
4. System routes to appropriate dentist
5. Patient gets scheduled in panel
```

### Scenario 3: Filtering Patients by Panel
```
1. View all patients in "PED" panel
2. Filter by specialization
3. See all pediatric patients
4. View assigned dentists
```

---

**Status:** ✅ Complete and Ready to Use!
