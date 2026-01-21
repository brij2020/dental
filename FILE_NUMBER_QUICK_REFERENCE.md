# File Number Generation - Quick Reference

## Format: CCYY#####

```
CC    = Clinic name first 2 letters (uppercase)
YY    = Year last 2 digits
##### = 5-digit increment (00001-99999)
```

## Examples

| Clinic Name | Year | Sequence | File Number |
|------------|------|----------|------------|
| Manas Dental | 2026 | 1st patient | **MA2600001** |
| Manas Dental | 2026 | 2nd patient | **MA2600002** |
| Apollo Dental | 2026 | 1st patient | **AP2600001** |
| SmileCare | 2027 | 100th patient | **SM2700100** |
| Bright Smile | 2025 | 999th patient | **BR2500999** |

## How it's Generated

### 1. When Patient is Created
```javascript
POST /api/patients
{
  full_name: "John Doe",
  clinic_id: "clinic-123",
  registration_type: "clinic"
}
```

### 2. Pre-Save Hook Executes
```
✓ Clinic ID found?        → YES
✓ File Number exists?     → NO (auto-generate)
✓ Fetch clinic name       → "Manas Dental"
✓ Extract first 2 letters → "MA"
✓ Get current year        → 2026 → "26"
✓ Count patients for clinic this year → 5 (so next is 6)
✓ Pad to 5 digits         → "00006"
✓ Combine                 → "MA2600006"
```

### 3. Patient Saved
```javascript
{
  _id: ObjectId(...),
  full_name: "John Doe",
  file_number: "MA2600006",     // ← Auto-generated
  clinic_id: "clinic-123",
  registration_type: "clinic",
  created_at: "2026-01-22T..."
}
```

## Key Points

✅ **Automatic** - No manual input needed
✅ **Unique** - MongoDB enforces uniqueness
✅ **Per Clinic** - Each clinic has independent sequence
✅ **Per Year** - Resets on January 1st
✅ **5 Digits** - Can handle up to 99,999 patients per clinic per year
✅ **Clinic Name Dependent** - Different clinic names = different prefixes

## Database Fields

```javascript
file_number: {
  type: String,
  unique: true,           // No duplicates allowed
  sparse: true,           // NULL values allowed for global patients
  trim: true,
  description: "Auto-generated in format CCYY#####"
}
```

## Indexes

```javascript
patientSchema.index({ file_number: 1 });  // For fast lookups
```

## Searching by File Number

```javascript
// Find specific patient
db.patients.findOne({ file_number: "MA2600001" })

// Find all patients from clinic in 2026
db.patients.find({ file_number: /^MA26/ })

// Find all patients from "Manas Dental"
db.patients.find({ clinic_id: "manas-clinic-001" })
```

## Special Cases

### Global Registrations
- **file_number:** null (not generated)
- **uhid:** GLOBAL/26/000001 (still auto-generated)

### Clinic Registration Missing Clinic
- **file_number:** null (clinic lookup failed)
- **uhid:** [clinic-id]/26/000001 (still auto-generated)
- Patient is **still created** (non-blocking)

## Configuration

Currently:
- Sequence resets: **Yearly** (Jan 1st)
- Sequence range: **00001 - 99999** (5 digits)
- Prefix source: **Clinic name** (first 2 chars)

To modify these, edit [backend/app/models/patient.model.js](backend/app/models/patient.model.js#L91-L149)
