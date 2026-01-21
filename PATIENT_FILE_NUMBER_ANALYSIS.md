# Patient Model Analysis & File Number Auto-Generation

## Current State Analysis

### Patient Model Structure
**Location:** `backend/app/models/patient.model.js`

**Key Fields:**
- `uhid` - Unique Hospital/Health ID (auto-generated)
- `file_number` - **NEW** - Patient file number (auto-generated)
- `full_name` - Patient's full name
- `email` - Patient's email
- `contact_number` - Patient's phone number (6-9 format)
- `date_of_birth` - Date of birth
- `address`, `state`, `city`, `pincode` - Address fields
- `clinic_id` - Reference to clinic (for clinic-specific registration)
- `registration_type` - "clinic" or "global"
- `panel` - Department/panel assignment
- `avatar` - Profile picture

### Indexes
```javascript
clinic_id: 1         // For faster clinic-specific queries
uhid: 1             // For UHID lookups
email: 1            // For email lookups
full_name: 1        // For name-based searches
registration_type: 1 // For registration type filtering
```

---

## File Number Generation Logic

### New Field Added
```javascript
file_number: {
  type: String,
  unique: true,
  sparse: true,
  trim: true,
  description: "Auto-generated file number in format: CCYY##### (CC=clinic name first 2 letters, YY=year last 2 digits, #####=5-digit increment)"
}
```

### Format Specification: **CCYY#####**

| Component | Description | Example |
|-----------|-------------|---------|
| **CC** | First 2 letters of clinic name (uppercase) | **MA** (Manas Dental) |
| **YY** | Last 2 digits of current year | **26** (2026) |
| **#####** | 5-digit increment (00001-99999) | **00001, 00002, ...** |

### Examples
```
Clinic: "Manas Dental", Year: 2026, Sequence: 1   → MA2600001
Clinic: "Apollo Dental", Year: 2026, Sequence: 2  → AP2600002
Clinic: "SmileCare", Year: 2027, Sequence: 15     → SM2700015
```

---

## Implementation Details

### Pre-Save Hook Logic

**Triggers:** Before each patient document is saved to database

**Steps:**

1. **UHID Generation (Existing)**
   - Format: `PREFIX/YY/SEQUENCE`
   - Prefix: Clinic ID (if clinic registration) or "GLOBAL"
   - YY: Last 2 digits of current year
   - SEQUENCE: 6-digit padded count of patients for this type/clinic
   - Example: `MANAS/26/000001`

2. **File Number Generation (NEW)**
   - Only generates if `clinic_id` exists
   - Fetches clinic document to get clinic name
   - Extracts first 2 letters (uppercase): `clinic.name.substring(0, 2).toUpperCase()`
   - Gets current year last 2 digits
   - Counts patients for THIS clinic created in current year
   - Generates 5-digit sequence: `String(count + 1).padStart(5, "0")`
   - Combines: `${clinicPrefix}${currentYear}${sequence}`

### Key Features

✅ **Auto-generated** - No manual entry required
✅ **Clinic-specific** - Each clinic has its own sequence
✅ **Year-based** - Sequence resets yearly
✅ **Unique constraint** - Ensures no duplicate file numbers
✅ **Sparse index** - Works with null values for global registrations
✅ **Error handling** - Doesn't block patient creation if clinic lookup fails

---

## How It Works

### Scenario: Creating a Patient at "Manas Dental" Clinic

**Step 1:** Admin creates patient through clinic panel
```javascript
{
  full_name: "Rajesh Kumar",
  contact_number: "9876543210",
  clinic_id: "manas-clinic-001",
  registration_type: "clinic"
}
```

**Step 2:** Pre-save hook executes
```javascript
1. Generate UHID:
   - Prefix: "manas-clinic-001"
   - Current year: 2026 → "26"
   - Count patients for this clinic: 5
   - Sequence: "000006"
   - Result: "manas-clinic-001/26/000006"

2. Generate File Number:
   - Fetch clinic by clinic_id
   - Clinic name: "Manas Dental"
   - First 2 letters: "MA"
   - Year: 2026 → "26"
   - Count patients for this clinic this year: 15
   - Sequence: "00016"
   - Result: "MA2600016"
```

**Step 3:** Patient saved with both IDs
```javascript
{
  _id: ObjectId(...),
  uhid: "manas-clinic-001/26/000006",
  file_number: "MA2600016",
  full_name: "Rajesh Kumar",
  contact_number: "9876543210",
  clinic_id: "manas-clinic-001",
  registration_type: "clinic",
  createdAt: "2026-01-22T..."
}
```

---

## Database Behavior

### Year-Based Sequence Reset
```javascript
const startOfYear = new Date(new Date().getFullYear(), 0, 1);
const patientCountThisYear = await mongoose.model("Patient").countDocuments({
  clinic_id: this.clinic_id,
  createdAt: { $gte: startOfYear }
});
```

- Counts only patients created in **current calendar year**
- Automatically resets to 00001 on January 1st each year
- Ensures file numbers like: MA2600001 → MA2700001 (year change)

### Query Examples

**Get all patients for "Manas Dental" in 2026:**
```javascript
db.patients.find({ 
  clinic_id: "manas-clinic-001",
  file_number: /^MA26/ 
})
```

**Get patient by file number:**
```javascript
db.patients.findOne({ file_number: "MA2600001" })
```

**Get all patients with auto-generated file numbers:**
```javascript
db.patients.find({ file_number: { $exists: true } })
```

---

## Error Handling

### Scenario: Clinic Not Found
```javascript
if (clinic && clinic.name) {
  // Generate file number
} else {
  // File number is optional, doesn't block patient creation
  console.warn("Could not generate file number: Clinic not found");
}
```

- If clinic lookup fails, patient is still created
- `file_number` field remains null/empty
- UHID is still generated (ensures patient can be identified)

### Scenario: Duplicate File Number
- MongoDB's unique constraint prevents duplicates
- Automatic error handling at database level
- Should be extremely rare (would require same clinic, same year, same sequence)

---

## Usage in Patient Registration

### For Clinic-Based Registration
```javascript
// Admin creates patient at clinic
POST /api/patients
{
  full_name: "Patient Name",
  contact_number: "9876543210",
  email: "patient@email.com",
  clinic_id: "clinic-id-here",
  registration_type: "clinic"
}

// Response includes auto-generated file_number:
{
  _id: "...",
  uhid: "clinic-id/26/000001",
  file_number: "CL2600001",  // Auto-generated
  full_name: "Patient Name",
  ...
}
```

### For Global Registration
```javascript
// Super admin creates patient globally
POST /api/patients
{
  full_name: "Patient Name",
  contact_number: "9876543210",
  registration_type: "global"
  // No clinic_id
}

// Response - file_number is null (only generated for clinic registrations)
{
  _id: "...",
  uhid: "GLOBAL/26/000001",
  file_number: null,  // Not generated for global
  full_name: "Patient Name",
  ...
}
```

---

## Future Enhancements

1. **Custom Clinic Prefix** - Allow clinic to set custom 2-letter prefix
2. **Monthly Reset** - Change sequence to reset monthly instead of yearly
3. **Format Customization** - Let clinic choose different file number formats
4. **Batch Import** - Handle bulk patient imports with file number generation
5. **File Number Lookup Service** - Create API endpoint to search by file number
6. **Audit Trail** - Log file number generation events

---

## Summary

| Aspect | Details |
|--------|---------|
| **Format** | CCYY##### (e.g., MA2600001) |
| **Generation** | Automatic in pre-save hook |
| **Scope** | Per clinic, per year |
| **Uniqueness** | Guaranteed by MongoDB unique index |
| **Reset** | Yearly (Jan 1st) |
| **Error Handling** | Non-blocking (patient created even if clinic lookup fails) |
| **Global Patients** | file_number remains null |
| **Clinic Patients** | file_number always generated |
