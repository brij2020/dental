# API Integration Architecture Diagram

## System Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                    DCMS PATIENT FRONTEND                        │
│                   (React + TypeScript)                          │
└─────────────────────────┬───────────────────────────────────────┘
                          │
        ┌─────────────────┼─────────────────┐
        │                 │                 │
        ▼                 ▼                 ▼
   ┌─────────┐   ┌──────────────┐   ┌──────────────┐
   │ Clinic  │   │ Appointment  │   │ Dashboard    │
   │ Listing │   │ Booking      │   │ Components   │
   └────┬────┘   └──────┬───────┘   └──────┬───────┘
        │                │                  │
        └────────────────┼──────────────────┘
                         │
                    ┌────▼────┐
                    │useClinic │
                    │s Hook    │
                    └────┬─────┘
                         │
        ┌────────────────┼────────────────┐
        │                │                │
        ▼                ▼                ▼
   ┌─────────┐  ┌──────────────┐  ┌──────────────┐
   │Fetch    │  │Search        │  │Create/Update │
   │All      │  │Clinics       │  │Clinic        │
   └────┬────┘  └──────┬───────┘  └──────┬───────┘
        │               │                 │
        └───────────────┼─────────────────┘
                        │
           ┌────────────▼────────────┐
           │  clinicService.ts       │
           │  - fetchAllClinics()    │
           │  - searchClinics()      │
           │  - fetchClinicById()    │
           │  - createClinic()       │
           │  - updateClinic()       │
           │  - deleteClinic()       │
           └────────────┬────────────┘
                        │
           ┌────────────▼────────────┐
           │    apiClient.ts         │
           │ (Axios Instance)        │
           │ ✓ Token Injection       │
           │ ✓ Error Handling        │
           │ ✓ Interceptors          │
           │ ✓ Timeout               │
           └────────────┬────────────┘
                        │
           ┌────────────▼────────────┐
           │  environment.ts         │
           │ - Load Config           │
           │ - API URLs              │
           │ - Timeouts              │
           └────────────┬────────────┘
                        │
    ┌───────────────────┼───────────────────┐
    │   HTTP Requests   │   With JWT Token  │
    │  (Axios Library)  │   In Headers      │
    └───────────────────┼───────────────────┘
                        │
┌───────────────────────┴───────────────────────┐
│                                               │
│      DENTAL BACKEND (Express + Node.js)       │
│                                               │
│   Routes:                                     │
│   - GET    /api/clinics                      │
│   - GET    /api/clinics/active               │
│   - GET    /api/clinics/search/filter        │
│   - GET    /api/clinics/:id                  │
│   - POST   /api/clinics                      │
│   - PUT    /api/clinics/:id                  │
│   - DELETE /api/clinics/:id                  │
│                                               │
│   Controllers:                                │
│   - clinic.controller.js                     │
│                                               │
│   Services:                                   │
│   - clinic.service.js                        │
│                                               │
└───────────────────┬───────────────────────────┘
                    │
                    ▼
        ┌───────────────────────┐
        │    MongoDB            │
        │   Clinic Collection   │
        │  (Database)           │
        │                       │
        │  Documents:           │
        │  {                    │
        │    name              │
        │    phone             │
        │    address: {        │
        │      street          │
        │      city            │
        │      state           │
        │      postal_code     │
        │    }                 │
        │    clinic_id         │
        │    status            │
        │    location: {}      │
        │    description       │
        │    logo              │
        │    branding_moto     │
        │  }                   │
        └───────────────────────┘
```

## Request/Response Flow

### 1. Fetch All Clinics

```
CLIENT                          FRONTEND              BACKEND           DATABASE
  │                               │                      │                  │
  ├─ Click "Load Clinics" ─────→  │                      │                  │
  │                               │                      │                  │
  │                          useClinics()                 │                  │
  │                               │                      │                  │
  │                      clinicService()                 │                  │
  │                               │                      │                  │
  │                       apiClient.get()                 │                  │
  │                               │                      │                  │
  │                          ┌────┴──────────────────────→│                  │
  │                          │    GET /api/clinics        │                  │
  │                          │    Authorization: Bearer   │                  │
  │                          │                            │                  │
  │                          │                    clinic.findAll()          │
  │                          │                            │                  │
  │                          │                       find({})────────────────→│
  │                          │                            │                  │
  │                          │    ←─────────────────────────  Clinic[]       │
  │                          │                            │                  │
  │                          │   [200] OK               │                  │
  │                          │   [{id, name, ...}]      │                  │
  │                          │                            │                  │
  │                    ←────────────────────────────────────────────────────  │
  │                          │                            │                  │
  │  Display Clinic List                                  │                  │
  │  in UI                                                │                  │
  │                                                       │                  │
```

### 2. Search Clinics

```
CLIENT                      FRONTEND              BACKEND              DATABASE
  │                           │                      │                    │
  │  Search:                  │                      │                    │
  │  name="Apollo"            │                      │                    │
  │  state="Maharashtra"      │                      │                    │
  │                           │                      │                    │
  ├─ Submit Search ────────→  │                      │                    │
  │                           │                      │                    │
  │                   searchClinics({...})          │                    │
  │                           │                      │                    │
  │                  apiClient.get()                 │                    │
  │                           │                      │                    │
  │                     ┌─────┴─────────────────────→│                    │
  │                     │ GET /api/clinics/          │                    │
  │                     │ search/filter?             │                    │
  │                     │ name=Apollo&               │                    │
  │                     │ state=Maharashtra          │                    │
  │                     │ Authorization: Bearer      │                    │
  │                     │                            │                    │
  │                     │                  clinic.search()               │
  │                     │                            │                    │
  │                     │                 Build MongoDB Query            │
  │                     │                 { name: /Apollo/i,             │
  │                     │                   state: /Maharashtra/i }      │
  │                     │                            │                    │
  │                     │                       find(query)──────────────→│
  │                     │                            │                    │
  │                     │       ←───────────────────────  Filtered[]     │
  │                     │                            │                    │
  │                     │  [200] OK                  │                    │
  │                     │  [{...}, {...}]            │                    │
  │                     │                            │                    │
  │                     ←───────────────────────────────────────────────→ │
  │                           │                      │                    │
  │  Display Results                                 │                    │
  │                                                  │                    │
```

### 3. Select & Book Clinic

```
CLIENT                      FRONTEND              BACKEND              DATABASE
  │                           │                      │                    │
  │  Select Clinic            │                      │                    │
  ├─ handleBookClick() ──────→│                      │                    │
  │                           │                      │                    │
  │                      setSelectedClinic()          │                    │
  │                      setIsPopupOpen(true)         │                    │
  │                           │                      │                    │
  │  Show Booking Modal       │                      │                    │
  │                           │                      │                    │
  │  Enter Appointment Date/  │                      │                    │
  │  Time & Submit           │                      │                    │
  │                           │                      │                    │
  ├─ bookAppointment() ──────→│                      │                    │
  │                           │                      │                    │
  │                  apiClient.post()                │                    │
  │                           │                      │                    │
  │                     ┌─────┴─────────────────────→│                    │
  │                     │ POST /api/appointments      │                    │
  │                     │ {clinicId, date, ...}     │                    │
  │                     │ Authorization: Bearer      │                    │
  │                     │                            │                    │
  │                     │              appointment.create()              │
  │                     │                            │                    │
  │                     │                       insertOne()──────────────→│
  │                     │                            │                    │
  │                     │       ←───────────────────────  _id, status    │
  │                     │                            │                    │
  │                     │  [201] Created             │                    │
  │                     │  {id, status: "pending"}   │                    │
  │                     │                            │                    │
  │                     ←───────────────────────────────────────────────→ │
  │                           │                      │                    │
  │  Show Success Message                            │                    │
  │  Redirect to Dashboard                           │                    │
  │                                                  │                    │
```

## Component Interaction Diagram

```
┌──────────────────────────────────────────────────┐
│       ClinicListForAppointments Component        │
│  (ClinicListForAppointments.tsx)                │
└─────┬──────────────────────────────────────────┬─┘
      │                                           │
      ▼                                           ▼
  ┌────────────────┐                    ┌────────────────┐
  │ useClinics     │                    │ Search Filters │
  │ Hook           │                    │ Form           │
  │                │                    │                │
  │ Returns:       │                    │ - State        │
  │ - clinics[]    │                    │ - City         │
  │ - loading      │                    │ - PIN          │
  │ - error        │                    │ - Name         │
  │ - refetch()    │                    │ - Location     │
  └────────┬───────┘                    └────────┬───────┘
           │                                      │
           │                                      │
           └──────────────┬───────────────────────┘
                          │
        ┌─────────────────▼──────────────────┐
        │ useMemo - Filter Clinics           │
        │ Apply all filters to clinic list   │
        │ Return filtered results            │
        └─────────────────┬──────────────────┘
                          │
           ┌──────────────┴──────────────┐
           │                             │
           ▼                             ▼
    ┌─────────────┐            ┌──────────────────┐
    │ ClinicCard  │            │ CustomModal      │
    │ Components  │            │ (AppointmentDT)  │
    │             │            │                  │
    │ - Image     │            │ - Date Picker    │
    │ - Name      │            │ - Time Selector  │
    │ - Address   │            │ - Book Button    │
    │ - Click     │            └──────────────────┘
    │   Handler   │
    └─────────────┘
           ▲
           │
       onBookClick()
```

## API Request/Response Schema

### Get All Clinics
```
REQUEST:
GET /api/clinics
Authorization: Bearer {token}

RESPONSE (200 OK):
[
  {
    "id": "507f1f77bcf86cd799439011",
    "_id": "507f1f77bcf86cd799439011",
    "name": "Apollo Hospitals",
    "phone": "9876543210",
    "address": {
      "street": "123 Main St",
      "city": "Mumbai",
      "state": "Maharashtra",
      "postal_code": "400001",
      "country": "India"
    },
    "clinic_id": "APO26000001",
    "status": "Active",
    "logo": "https://...",
    "branding_moto": "Care at heart",
    "location": {
      "floor": "2",
      "room_number": "201",
      "wing": "A"
    },
    "description": "Leading dental care clinic",
    "createdAt": "2024-01-10T10:30:00Z",
    "updatedAt": "2024-01-20T15:45:00Z"
  },
  ...
]
```

### Search Clinics
```
REQUEST:
GET /api/clinics/search/filter?name=Apollo&state=Maharashtra&city=Mumbai
Authorization: Bearer {token}

RESPONSE (200 OK):
[
  {
    "id": "507f1f77bcf86cd799439011",
    "name": "Apollo Hospitals",
    "phone": "9876543210",
    "address": {
      "street": "123 Main St",
      "city": "Mumbai",
      "state": "Maharashtra",
      "postal_code": "400001"
    },
    ...
  }
]
```

### Get Single Clinic
```
REQUEST:
GET /api/clinics/507f1f77bcf86cd799439011
Authorization: Bearer {token}

RESPONSE (200 OK):
{
  "id": "507f1f77bcf86cd799439011",
  "name": "Apollo Hospitals",
  "phone": "9876543210",
  ...
}
```

## Error Handling Flow

```
┌───────────────────────┐
│  API Request Made     │
└───────────┬───────────┘
            │
            ▼
┌───────────────────────┐
│ Response Received?    │
└────┬──────────────┬───┘
     │ YES          │ NO
     ▼              ▼
 ┌────────┐    ┌──────────────┐
 │ Status │    │ Network Error│
 │ Code?  │    │ Timeout      │
 └────┬───┘    │ CORS Error   │
      │        └──────┬───────┘
      ▼               │
   ┌──────┐           │
   │ 200? │           │
   └──┬───┘           │
      │               │
  YES │ NO            │
      ▼   ▼           │
    ┌─────────────────┴──────────────┐
    │   Return Data   Error Handler   │
    │                 Log Error       │
    │   Update      Show Toast/Alert  │
    │   UI State    Set error state   │
    └────────────────┬────────────────┘
                     │
             ┌───────┴────────┐
             │                │
             ▼                ▼
        ┌────────┐      ┌──────────┐
        │ 401?   │      │ Other    │
        │Logout  │      │ Error?   │
        │Redirect│      │ Retry?   │
        └────────┘      └──────────┘
```

---

**Last Updated:** January 22, 2026
