# Procedure Management System - Architecture & Data Flow

## System Architecture Diagram

```
┌─────────────────────────────────────────────────────────────────┐
│                     USER BROWSER                                │
│  http://localhost:5173/settings/procedures                      │
└────────────────────┬────────────────────────────────────────────┘
                     │
                     │ HTTP Requests
                     │
┌─────────────────────▼────────────────────────────────────────────┐
│              REACT FRONTEND (Port 5173)                          │
│                                                                   │
│  ┌─────────────────────────────────────────────────────────┐    │
│  │  ProcedurePanel.tsx Component                           │    │
│  │  ├─ Display Procedures Table                            │    │
│  │  ├─ Add/Edit Modal Form                                 │    │
│  │  ├─ Delete Confirmation                                 │    │
│  │  └─ Toast Notifications                                 │    │
│  └──────────────────┬──────────────────────────────────────┘    │
│                     │                                             │
│  ┌──────────────────▼──────────────────────────────────────┐    │
│  │  API Client (apiClient.ts)                              │    │
│  │  ├─ getProcedures()         [GET]                       │    │
│  │  ├─ createProcedure()       [POST]                      │    │
│  │  ├─ updateProcedure()       [PUT]                       │    │
│  │  ├─ deleteProcedure()       [DELETE]                    │    │
│  │  └─ getProcedureById()      [GET]                       │    │
│  └──────────────────┬──────────────────────────────────────┘    │
│                     │                                             │
│  ┌──────────────────▼──────────────────────────────────────┐    │
│  │  Auth Context (useAuth)                                 │    │
│  │  ├─ user.clinic_id (clinic scope)                       │    │
│  │  └─ localStorage (auth_token)                           │    │
│  └──────────────────┬──────────────────────────────────────┘    │
└─────────────────────┼──────────────────────────────────────────┘
                      │
                      │ axios with Bearer Token
                      │ Headers: { Authorization: Bearer TOKEN }
                      │
┌─────────────────────▼──────────────────────────────────────────┐
│           EXPRESS BACKEND (Port 8080)                          │
│                                                                  │
│  /api/procedures                                               │
│  ├─ GET    /                [getAllProcedures]                 │
│  ├─ POST   /                [createProcedure]                  │
│  ├─ GET    /:id             [getProcedureById]                 │
│  ├─ PUT    /:id             [updateProcedure]                  │
│  └─ DELETE /:id             [deleteProcedure]                  │
│                                                                  │
│  ┌────────────────────────────────────────────────────────┐   │
│  │  Auth Middleware (auth.middleware.js)                   │   │
│  │  ├─ Verify JWT Token                                    │   │
│  │  ├─ Extract User Info                                   │   │
│  │  └─ Pass to Controller                                  │   │
│  └──────────────────┬─────────────────────────────────────┘   │
│                     │                                           │
│  ┌──────────────────▼──────────────────────────────────────┐   │
│  │  Procedure Controller (procedure.controller.js)         │   │
│  │  ├─ Input Validation                                    │   │
│  │  ├─ clinic_id Verification                              │   │
│  │  ├─ Call Model Methods                                  │   │
│  │  ├─ Error Handling                                      │   │
│  │  └─ Response Formatting                                 │   │
│  └──────────────────┬──────────────────────────────────────┘   │
│                     │                                           │
│  ┌──────────────────▼──────────────────────────────────────┐   │
│  │  Procedure Model (procedure.model.js)                   │   │
│  │  ├─ Schema Definition                                   │   │
│  │  ├─ Validation Rules                                    │   │
│  │  ├─ Indexes (clinic_id)                                 │   │
│  │  └─ Timestamps                                          │   │
│  └──────────────────┬──────────────────────────────────────┘   │
└─────────────────────┼──────────────────────────────────────────┘
                      │
                      │ Mongoose ODM
                      │
┌─────────────────────▼──────────────────────────────────────────┐
│              MONGODB (Database)                                │
│                                                                  │
│  procedures collection                                         │
│  ┌─────────────────────────────────────────────────────────┐  │
│  │ _id: ObjectId                                           │  │
│  │ clinic_id: String (indexed)                             │  │
│  │ name: String                                            │  │
│  │ procedure_type: Enum (11 types)                         │  │
│  │ description: String                                     │  │
│  │ cost: Number                                            │  │
│  │ note: String                                            │  │
│  │ is_active: Boolean                                      │  │
│  │ created_at: DateTime                                    │  │
│  │ updated_at: DateTime                                    │  │
│  └─────────────────────────────────────────────────────────┘  │
└──────────────────────────────────────────────────────────────────┘
```

## Request/Response Flow

### 1. GET All Procedures

```
Browser Request:
┌─────────────────────────────────────────┐
│ GET /api/procedures?clinic_id=clinic-123│
│ Headers: {                               │
│   "Authorization": "Bearer TOKEN",       │
│   "Content-Type": "application/json"     │
│ }                                        │
└──────────────────┬──────────────────────┘
                   │
          Auth Middleware Validates Token
                   │
     Controller Calls Model.find({clinic_id})
                   │
       MongoDB Returns Array of Procedures
                   │
Backend Response:
┌──────────────────────────────────────────┐
│ Status: 200 OK                            │
│ {                                         │
│   "data": [                               │
│     {                                     │
│       "_id": "...",                       │
│       "clinic_id": "clinic-123",          │
│       "name": "Root Canal",               │
│       "procedure_type": "Endodontic",     │
│       "cost": 2000,                       │
│       ...                                 │
│     }                                     │
│   ]                                       │
│ }                                         │
└──────────────────┬──────────────────────┘
                   │
       Frontend Updates State & Renders Table
                   │
              User Sees Procedures
```

### 2. CREATE Procedure

```
User Action: Click "Add Procedure" → Fill Form → Click Save

Browser Request:
┌───────────────────────────────────────────────┐
│ POST /api/procedures                          │
│ Headers: {                                     │
│   "Authorization": "Bearer TOKEN",             │
│   "Content-Type": "application/json"           │
│ }                                              │
│ Body: {                                        │
│   "clinic_id": "clinic-123",                   │
│   "name": "Teeth Whitening",                   │
│   "procedure_type": "Cosmetic",                │
│   "cost": 500,                                 │
│   "description": "Professional bleaching",     │
│   "note": "Requires consent form"              │
│ }                                              │
└──────────────────┬───────────────────────────┘
                   │
        Auth Middleware Validates
                   │
    Controller Validates Input (trim, check cost)
                   │
       Mongoose Creates Document in MongoDB
                   │
Backend Response:
┌───────────────────────────────────────────────┐
│ Status: 201 Created                            │
│ {                                              │
│   "data": {                                    │
│     "_id": "507f1f77bcf86cd799439011",        │
│     "clinic_id": "clinic-123",                 │
│     "name": "Teeth Whitening",                 │
│     "procedure_type": "Cosmetic",              │
│     "cost": 500,                               │
│     "created_at": "2026-01-21T...",           │
│     ...                                        │
│   }                                            │
│ }                                              │
└──────────────────┬───────────────────────────┘
                   │
      Frontend Adds to Table State
           Shows Success Toast
                   │
         Table Automatically Updates
```

### 3. UPDATE Procedure

```
User Action: Click Edit → Modify Fields → Save

Browser Request:
┌───────────────────────────────────────────┐
│ PUT /api/procedures/507f1f77bcf86cd799439│
│ Headers: { "Authorization": "Bearer..." } │
│ Body: {                                    │
│   "cost": 600,  // Updated from 500      │
│   "note": "Updated note"                  │
│ }                                          │
└──────────────────┬───────────────────────┘
                   │
    Controller Validates Updated Fields
                   │
  Mongoose Updates Document in MongoDB
                   │
Backend Response:
┌───────────────────────────────────────────┐
│ Status: 200 OK                             │
│ { "data": { /* updated document */ } }    │
└──────────────────┬───────────────────────┘
                   │
    Frontend Refetches All Procedures
            Shows Success Toast
                   │
         Table Shows Updated Values
```

### 4. DELETE Procedure

```
User Action: Click Delete → Confirm → Procedure Removed

Browser Request:
┌──────────────────────────────────────────┐
│ DELETE /api/procedures/507f1f77bcf86cd79│
│ Headers: { "Authorization": "Bearer..." }│
└──────────────────┬──────────────────────┘
                   │
    Controller Verifies Procedure Exists
                   │
  Mongoose Deletes Document from MongoDB
                   │
Backend Response:
┌──────────────────────────────────────────┐
│ Status: 200 OK                            │
│ { "message": "Procedure deleted..." }    │
└──────────────────┬──────────────────────┘
                   │
    Frontend Removes from Table
         Shows Success Toast
                   │
      Procedure No Longer Visible
```

## State Management Flow

```
ProcedurePanel Component State:

┌─────────────────────────────────────────────┐
│ [procedures, setProcedures]                 │
│ Array of fetched procedures from API        │
│ Used to render table rows                   │
└─────────────────────────────────────────────┘
                    │
┌───────────────────▼──────────────────────────┐
│ [isLoading, setIsLoading]                    │
│ Show "Loading..." message in table           │
│ Disable "Add" button while loading           │
└─────────────────────────────────────────────┘
                    │
┌───────────────────▼──────────────────────────┐
│ [isModalOpen, setIsModalOpen]                │
│ Show/hide Add/Edit modal dialog              │
└─────────────────────────────────────────────┘
                    │
┌───────────────────▼──────────────────────────┐
│ [formData, setFormData]                      │
│ Form field values during Add/Edit            │
│ {                                            │
│   _id, name, procedure_type,                 │
│   description, cost, note                    │
│ }                                            │
└─────────────────────────────────────────────┘
                    │
┌───────────────────▼──────────────────────────┐
│ [modalMode, setModalMode]                    │
│ 'add' or 'edit' determines form behavior     │
└─────────────────────────────────────────────┘
                    │
┌───────────────────▼──────────────────────────┐
│ [isSaving, setIsSaving]                      │
│ Show loading spinner during save             │
│ Disable submit button while saving           │
└─────────────────────────────────────────────┘
```

## Error Handling Flow

```
User Action
    │
    ▼
Frontend Validation
    │
    ├─ NO ERROR ───────┐
    │                  │
    │ ERROR ──────┐    │
    │             │    │
    │          Toast   │
    │             │    │
    │             └────┘
    │                  │
    ▼                  ▼
API Request      User Sees Error
    │
    ├─ 200 OK ────────────┐
    │ 201 Created         │
    │ 404 Not Found ─┐    │
    │ 400 Bad Request├──┐ │
    │ 500 Server Error┘  │ │
    │                   │ │
    ▼                   ▼ ▼
Success Toast      Error Toast
    │               (Show Message)
    ▼
Update UI State
    │
    ▼
User Sees Update
```

## Component Lifecycle

```
MOUNT
  │
  ├─ useCallback: fetchProcedures()
  │    │
  │    ├─ Check if user?.clinic_id exists
  │    ├─ setIsLoading(true)
  │    ├─ Call getProcedures(clinic_id)
  │    ├─ setProcedures(response.data)
  │    └─ setIsLoading(false)
  │
  └─ useEffect: Call fetchProcedures()
       │
       └─ Dependencies: [fetchProcedures]

RENDER
  │
  ├─ If isLoading: Show "Loading..."
  ├─ If procedures.length === 0: Show "No procedures"
  └─ Else: Render <table> with procedures

USER ACTIONS
  │
  ├─ Click "Add": setModalOpen(true), setMode('add')
  ├─ Click Edit: setModalOpen(true), setMode('edit'), setFormData(proc)
  ├─ Click Delete: Confirm, call deleteProcedure(), fetchProcedures()
  └─ Submit Form: Call create/update, fetchProcedures(), closeModal()

UNMOUNT
  │
  └─ Cleanup (none needed for this component)
```

## Data Relationships

```
Frontend User
     │
     ├─ useAuth() → { user }
     │   └─ user.clinic_id → Used as filter
     │
     └─ ProcedurePanel Component
         │
         ├─ Fetches from: /api/procedures?clinic_id=X
         │
         └─ Procedures Collection
             │
             ├─ clinic_id (foreign key to clinics)
             ├─ name (string)
             ├─ procedure_type (enum)
             ├─ cost (number)
             ├─ description (string)
             └─ note (string)
```

## Security Flow

```
Browser
    │
    ├─ User Logs In
    │   └─ Gets JWT Token
    │   └─ Stores in localStorage
    │
    └─ Click Settings → Procedures
         │
         └─ Component Mounts
             │
             └─ apiClient adds: Authorization: Bearer TOKEN
                 │
                 └─ Express Backend
                     │
                     └─ auth.middleware.js
                         │
                         ├─ Extract Token from Header
                         ├─ Verify JWT Signature
                         ├─ Check if Expired
                         ├─ Extract user info (clinic_id)
                         │
                         ├─ VALID ─────→ Continue to Controller
                         │
                         └─ INVALID ──→ Return 401 Unauthorized
```

## Performance Optimization Points

```
Current Implementation:
┌─────────────────────────────────────────┐
│ GET Request                              │
│ → MongoDB find({clinic_id})              │
│ → Return all fields                      │
│ → 100% Clinic Data Retrieved             │
└──────────────────┬──────────────────────┘

Future Optimizations:
┌──────────────────────────────────────────┐
│ 1. Add Pagination                        │
│    .limit(10).skip(0)                    │
│                                           │
│ 2. Add Lean Queries                      │
│    .lean() → Plain objects (faster)      │
│                                           │
│ 3. Add Caching Layer                     │
│    Redis cache for procedure types       │
│                                           │
│ 4. Add Indexing                          │
│    Already: clinic_id index              │
│    Consider: (clinic_id, name) composite │
│                                           │
│ 5. Add Projection                        │
│    .select('name cost procedure_type')   │
└──────────────────────────────────────────┘
```

---

**Diagram Updated**: January 21, 2026
**Architecture**: REST API with JWT Auth
**Database**: MongoDB with Mongoose ODM
**Frontend**: React with TypeScript
