# Remedy API - Developer Notes

## Architecture

```
HTTP Request
    ↓
Express Route (remedy.routes.js)
    ↓
JWT Authentication Middleware
    ↓
Controller (remedy.controller.js)
    ↓
Service Layer (remedy.service.js)
    ↓
Mongoose Model (remedy.model.js)
    ↓
MongoDB
```

## Adding a New Endpoint

### Example: Get Remedies by Status

1. **Add to Service** (`remedy.service.js`):
```javascript
exports.findByStatus = async (clinic_id, status) => {
  try {
    return await Remedy.find({ clinic_id, status });
  } catch (error) {
    logger.error("Error finding remedies by status:", error);
    throw error;
  }
};
```

2. **Add to Controller** (`remedy.controller.js`):
```javascript
exports.findByStatus = async (req, res) => {
  try {
    const remedies = await remedyService.findByStatus(
      req.params.clinic_id, 
      req.query.status
    );
    res.status(200).send({ success: true, data: remedies });
  } catch (err) {
    logger.error("Error fetching by status:", err);
    res.status(500).send({ message: err.message });
  }
};
```

3. **Add to Routes** (`remedy.routes.js`):
```javascript
router.get("/clinic/:clinic_id/status", verifyToken, controller.findByStatus);
```

## Modifying the Schema

### Example: Add Active Flag

1. **Update Model** (`remedy.model.js`):
```javascript
active: {
  type: Boolean,
  default: true,
}
```

2. **Create Migration Script**:
```javascript
// Update existing documents
await Remedy.updateMany({}, { active: true });
```

3. **Update Controller Validation** if needed

## Common Patterns

### Clinic-Specific Operations
Always filter by clinic_id for security:
```javascript
const remedies = await Remedy.find({ 
  clinic_id: user.clinic_id 
});
```

### Error Handling
```javascript
// For duplicate constraint
if (err.code === 11000) {
  return res.status(409).send({ message: "Duplicate entry" });
}

// For validation
if (!name) {
  return res.status(400).send({ message: "name is required" });
}

// For not found
if (!remedy) {
  return res.status(404).send({ message: "Remedy not found" });
}
```

### Async/Await Pattern
```javascript
try {
  const remedy = await remedyService.create(data);
  res.status(201).send({ success: true, data: remedy });
} catch (err) {
  logger.error("Error:", err);
  res.status(500).send({ message: err.message });
}
```

## Testing Endpoints

### Use Postman/Insomnia

1. Set Authorization header:
   - Type: Bearer Token
   - Token: Your JWT token

2. Set Content-Type:
   - `application/json`

3. Test each CRUD operation:
```
POST   /api/remedies                    - Create
GET    /api/remedies/clinic/clinic-id   - Read
PUT    /api/remedies/id                 - Update
DELETE /api/remedies/id                 - Delete
```

### Use cURL

```bash
# Set token
TOKEN="your_jwt_token_here"

# Create
curl -X POST http://localhost:8080/api/remedies \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"clinic_id":"clinic-123","name":"Remedy",...}'

# Read
curl -X GET http://localhost:8080/api/remedies/clinic/clinic-123 \
  -H "Authorization: Bearer $TOKEN"

# Update
curl -X PUT http://localhost:8080/api/remedies/{id} \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"times":"1-0-1"}'

# Delete
curl -X DELETE http://localhost:8080/api/remedies/{id} \
  -H "Authorization: Bearer $TOKEN"
```

## Frontend Component Structure

```
RemediesPanel
├── State
│   ├── remedies (array of Remedy)
│   ├── isLoading (boolean)
│   ├── isSaving (boolean)
│   ├── isModalOpen (boolean)
│   ├── modalMode ('add' | 'edit')
│   └── formData (RemedyFormData)
├── Functions
│   ├── fetchRemedies()
│   ├── handleOpenAddModal()
│   ├── handleOpenEditModal()
│   ├── handleCloseModal()
│   ├── handleFormChange()
│   ├── handleSubmit()
│   └── handleDelete()
├── UI Sections
│   ├── Header
│   ├── Table
│   ├── Modal Form
│   └── Empty State
```

## Debugging Tips

### Backend Debugging

1. **Check logs:**
```javascript
// In controller
logger.info(`Remedy created: ${remedy._id}`);
logger.error("Error:", err);
```

2. **Check database:**
```javascript
// In MongoDB shell
db.remedies.find({ clinic_id: "clinic-123" })
db.remedies.findOne({ _id: ObjectId("...") })
```

3. **Check middleware:**
```javascript
// JWT not attached?
// Check if verifyToken middleware is in route
router.get("/", verifyToken, controller.findAll);
```

### Frontend Debugging

1. **Check console:**
```javascript
console.log('Remedies:', remedies);
console.error('Error:', error);
```

2. **Check network:**
- Open DevTools → Network tab
- Filter by XHR
- Check request/response

3. **Check state:**
```javascript
console.log('formData:', formData);
console.log('isLoading:', isLoading);
```

## Performance Optimization

### Database
- Index on `clinic_id` for fast filtering
- Compound index on `clinic_id + name`
- Use `.lean()` if you don't need full document

### API
- Implement pagination:
```javascript
const page = req.query.page || 1;
const limit = 10;
const remedies = await Remedy.find({ clinic_id })
  .limit(limit)
  .skip((page - 1) * limit);
```

- Add caching:
```javascript
// Redis caching example
const cached = await redis.get(`remedies:${clinic_id}`);
```

## Deployment Checklist

- [x] All endpoints tested
- [x] Error handling comprehensive
- [x] Input validation present
- [x] Security (JWT, clinic isolation)
- [x] Logging configured
- [x] Documentation complete
- [ ] Performance tested at scale
- [ ] Backup/restore procedures
- [ ] Monitoring configured
- [ ] Rate limiting added (optional)

## Related Modules

Similar implementations exist for:
- **Fees** - `fee.model.js`, `fee.controller.js`, etc.
- **Medical Conditions** - `medicalCondition.model.js`, etc.
- **Procedures** - Check ProcedurePanel.tsx

Use these as reference for consistency.

## Quick Links

- Backend: `http://localhost:8080`
- API Docs: `http://localhost:8080/api-docs`
- Frontend: `http://localhost:5173`
- Remedies Page: `http://localhost:5173/settings/remedies`

## Logs Location

```
backend/logs/
├── 2024-01-20-dcms.log
└── ... (daily logs)
```

View logs:
```bash
tail -f backend/logs/*.log
```

## Environment Variables

Required in `backend/.env`:
```env
MONGODB_URI=mongodb://localhost:27017/dcms
PORT=8080
JWT_SECRET=your_secret_key
```

## Common Issues & Solutions

| Issue | Solution |
|-------|----------|
| 401 Unauthorized | Check JWT token validity and Authorization header |
| 409 Duplicate | Remedy name already exists for this clinic |
| 404 Not Found | Invalid remedy ID or clinic_id |
| 500 Server Error | Check backend logs in `backend/logs/` |
| CORS Error | Check `CORS_ORIGIN` in `.env` |
| API not responding | Check if backend is running on correct port |

## Notes

- Always include `clinic_id` in operations for security
- Use centralized error handling patterns
- Follow existing code style and naming conventions
- Keep service layer business logic separate
- Add logging for debugging
- Test edge cases (empty input, invalid IDs, etc.)
- Document any modifications to the schema

---

**Last Updated:** January 20, 2024
