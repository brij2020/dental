# Clinic Panel Integration Guide

## Overview
This guide explains how to integrate the Clinic Panel system with the Patient registration form and API.

---

## 1. Database Schema Updates

### Patient Model Enhancement
The patient model already has a `panel` field. The existing schema in `patient.model.js` already supports panels:

```javascript
panel: {
  type: String,
  trim: true
}
```

This field stores the panel code (e.g., "PED", "ORTHO") that the patient is assigned to.

### What Changed:
✅ **Already Compatible** - No changes needed to patient model!

---

## 2. Backend Integration

### Step 1: Verify Model Registration
The ClinicPanel model has been automatically registered in:
- **File:** `app/models/index.js`
- **Export:** `db.clinicPanels`

### Step 2: Routes are Registered
The clinic panel routes are registered in:
- **File:** `app/routes/index.js`
- **Endpoints:** `/api/clinic-panels` and `/api/clinicPanels`

### Step 3: Ready to Use
All files have been created:
```
✅ app/models/clinicPanel.model.js        - Database schema
✅ app/services/clinicPanel.service.js    - Business logic
✅ app/controllers/clinicPanel.controller.js - API handlers
✅ app/routes/clinicPanel.routes.js       - Route definitions
```

---

## 3. Frontend Integration

### Step 1: Fetch Panels in Patient Form

**In your React/Frontend component:**

```javascript
import { useEffect, useState } from 'react';

function PatientForm() {
  const [panels, setPanels] = useState([]);
  const [clinicId, setClinicId] = useState('clinic123');

  // Fetch available panels
  useEffect(() => {
    const fetchPanels = async () => {
      try {
        const response = await fetch(
          `/api/clinic-panels?clinic_id=${clinicId}&is_active=true`,
          {
            headers: {
              'Authorization': `Bearer ${localStorage.getItem('token')}`
            }
          }
        );
        const { data } = await response.json();
        setPanels(data);
      } catch (error) {
        console.error('Error fetching panels:', error);
      }
    };

    if (clinicId) {
      fetchPanels();
    }
  }, [clinicId]);

  return (
    <form onSubmit={handleSubmit}>
      {/* Other form fields */}
      
      <div>
        <label htmlFor="panel">Select Panel/Department</label>
        <select name="panel" id="panel" required>
          <option value="">-- Select Panel --</option>
          {panels.map(panel => (
            <option key={panel._id} value={panel.code}>
              {panel.name} ({panel.code})
              {panel.specialization && ` - ${panel.specialization}`}
            </option>
          ))}
        </select>
      </div>

      {/* Other form fields */}
      <button type="submit">Register Patient</button>
    </form>
  );
}

export default PatientForm;
```

### Step 2: Submit Patient with Panel

**When submitting patient registration:**

```javascript
const handleSubmit = async (e) => {
  e.preventDefault();
  
  const formData = new FormData(e.target);
  const patientData = {
    full_name: formData.get('full_name'),
    email: formData.get('email'),
    contact_number: formData.get('contact_number'),
    gender: formData.get('gender'),
    date_of_birth: formData.get('date_of_birth'),
    address: formData.get('address'),
    city: formData.get('city'),
    state: formData.get('state'),
    pincode: formData.get('pincode'),
    panel: formData.get('panel'),              // Panel code
    clinic_id: 'clinic123',
    registration_type: 'clinic',
    // ... other fields
  };

  try {
    const response = await fetch('/api/patient', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${localStorage.getItem('token')}`
      },
      body: JSON.stringify(patientData)
    });

    const result = await response.json();
    if (response.ok) {
      alert('Patient registered successfully!');
      // Redirect or clear form
    } else {
      alert(`Error: ${result.message}`);
    }
  } catch (error) {
    console.error('Error:', error);
  }
};
```

### Step 3: Filter Panels by Specialization (Optional)

**For a more advanced form with specialization dropdown:**

```javascript
function AdvancedPatientForm() {
  const [specializations, setSpecializations] = useState([]);
  const [selectedSpecialization, setSelectedSpecialization] = useState('');
  const [panels, setPanels] = useState([]);

  // All available specializations
  const ALL_SPECIALIZATIONS = [
    'General Dentistry',
    'Pediatric Dentistry',
    'Orthodontics',
    'Periodontics',
    'Prosthodontics',
    'Endodontics',
    'Oral Surgery',
    'Implantology',
    'Cosmetic Dentistry',
    'Other'
  ];

  // Fetch panels by specialization
  const handleSpecializationChange = async (specialization) => {
    setSelectedSpecialization(specialization);
    
    if (!specialization) {
      setPanels([]);
      return;
    }

    try {
      const response = await fetch(
        `/api/clinic-panels/specialization?clinic_id=clinic123&specialization=${encodeURIComponent(specialization)}`,
        {
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('token')}`
          }
        }
      );
      const { data } = await response.json();
      setPanels(data);
    } catch (error) {
      console.error('Error fetching panels:', error);
    }
  };

  return (
    <form>
      <div>
        <label htmlFor="specialization">Specialization</label>
        <select 
          id="specialization" 
          value={selectedSpecialization}
          onChange={(e) => handleSpecializationChange(e.target.value)}
        >
          <option value="">-- Select Specialization --</option>
          {ALL_SPECIALIZATIONS.map(spec => (
            <option key={spec} value={spec}>{spec}</option>
          ))}
        </select>
      </div>

      {panels.length > 0 && (
        <div>
          <label htmlFor="panel">Panel/Department</label>
          <select name="panel" id="panel" required>
            <option value="">-- Select Panel --</option>
            {panels.map(panel => (
              <option key={panel._id} value={panel.code}>
                {panel.name}
              </option>
            ))}
          </select>
        </div>
      )}
    </form>
  );
}
```

---

## 4. API Endpoint Reference for Frontend

### Get All Panels for a Clinic
```javascript
GET /api/clinic-panels?clinic_id=clinic123
Authorization: Bearer <token>

// Returns: { data: [panels...], pagination: {...} }
```

### Get Active Panels Only
```javascript
GET /api/clinic-panels/active?clinic_id=clinic123
Authorization: Bearer <token>

// Returns: { data: [panels...] }
```

### Get Panels by Specialization
```javascript
GET /api/clinic-panels/specialization?clinic_id=clinic123&specialization=Pediatric%20Dentistry
Authorization: Bearer <token>

// Returns: { data: [panels...] }
```

### Create New Patient with Panel
```javascript
POST /api/patient
Authorization: Bearer <token>
Content-Type: application/json

{
  "full_name": "John Doe",
  "email": "john@example.com",
  "contact_number": "9876543210",
  "panel": "PED",           // Panel code
  "clinic_id": "clinic123",
  "registration_type": "clinic",
  // ... other required fields
}

// Returns: { message: "Patient created successfully", data: {...} }
```

---

## 5. Complete Example: Patient Registration Form

Here's a complete, ready-to-use React component:

```javascript
import React, { useEffect, useState } from 'react';
import './PatientForm.css';

function PatientForm() {
  const [clinicId] = useState('clinic123'); // Get from context/props
  const [panels, setPanels] = useState([]);
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    full_name: '',
    email: '',
    contact_number: '',
    gender: '',
    date_of_birth: '',
    address: '',
    city: '',
    state: '',
    pincode: '',
    panel: ''
  });
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // Fetch panels on component mount
  useEffect(() => {
    const fetchPanels = async () => {
      try {
        setLoading(true);
        const response = await fetch(
          `/api/clinic-panels/active?clinic_id=${clinicId}`,
          {
            headers: {
              'Authorization': `Bearer ${localStorage.getItem('token')}`
            }
          }
        );

        if (!response.ok) throw new Error('Failed to fetch panels');

        const { data } = await response.json();
        setPanels(data);
      } catch (err) {
        setError('Failed to load panels');
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    fetchPanels();
  }, [clinicId]);

  // Handle input changes
  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  // Handle form submission
  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    try {
      // Validation
      if (!formData.full_name || !formData.email || !formData.contact_number || !formData.panel) {
        setError('Please fill all required fields');
        return;
      }

      setLoading(true);

      const response = await fetch('/api/patient', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({
          ...formData,
          clinic_id: clinicId,
          registration_type: 'clinic'
        })
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.message || 'Failed to register patient');
      }

      setSuccess('Patient registered successfully!');
      setFormData({
        full_name: '',
        email: '',
        contact_number: '',
        gender: '',
        date_of_birth: '',
        address: '',
        city: '',
        state: '',
        pincode: '',
        panel: ''
      });

      // Redirect after 2 seconds
      setTimeout(() => {
        window.location.href = '/patients';
      }, 2000);

    } catch (err) {
      setError(err.message || 'An error occurred');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="patient-form-container">
      <h1>Register Patient</h1>

      {error && <div className="alert alert-error">{error}</div>}
      {success && <div className="alert alert-success">{success}</div>}

      <form onSubmit={handleSubmit}>
        <div className="form-group">
          <label htmlFor="full_name">Full Name *</label>
          <input
            type="text"
            id="full_name"
            name="full_name"
            value={formData.full_name}
            onChange={handleChange}
            required
          />
        </div>

        <div className="form-group">
          <label htmlFor="email">Email *</label>
          <input
            type="email"
            id="email"
            name="email"
            value={formData.email}
            onChange={handleChange}
            required
          />
        </div>

        <div className="form-group">
          <label htmlFor="contact_number">Contact Number *</label>
          <input
            type="tel"
            id="contact_number"
            name="contact_number"
            value={formData.contact_number}
            onChange={handleChange}
            pattern="[6-9]\d{9}"
            required
          />
        </div>

        <div className="form-group">
          <label htmlFor="gender">Gender</label>
          <select
            id="gender"
            name="gender"
            value={formData.gender}
            onChange={handleChange}
          >
            <option value="">-- Select --</option>
            <option value="Male">Male</option>
            <option value="Female">Female</option>
            <option value="Other">Other</option>
          </select>
        </div>

        <div className="form-group">
          <label htmlFor="date_of_birth">Date of Birth</label>
          <input
            type="date"
            id="date_of_birth"
            name="date_of_birth"
            value={formData.date_of_birth}
            onChange={handleChange}
          />
        </div>

        <div className="form-group">
          <label htmlFor="address">Address</label>
          <input
            type="text"
            id="address"
            name="address"
            value={formData.address}
            onChange={handleChange}
          />
        </div>

        <div className="form-group">
          <label htmlFor="city">City</label>
          <input
            type="text"
            id="city"
            name="city"
            value={formData.city}
            onChange={handleChange}
          />
        </div>

        <div className="form-group">
          <label htmlFor="state">State</label>
          <input
            type="text"
            id="state"
            name="state"
            value={formData.state}
            onChange={handleChange}
          />
        </div>

        <div className="form-group">
          <label htmlFor="pincode">Pincode</label>
          <input
            type="text"
            id="pincode"
            name="pincode"
            value={formData.pincode}
            onChange={handleChange}
            pattern="\d{6}"
          />
        </div>

        <div className="form-group">
          <label htmlFor="panel">Panel/Department *</label>
          {loading && panels.length === 0 ? (
            <p>Loading panels...</p>
          ) : (
            <select
              id="panel"
              name="panel"
              value={formData.panel}
              onChange={handleChange}
              required
            >
              <option value="">-- Select Panel --</option>
              {panels.map(panel => (
                <option key={panel._id} value={panel.code}>
                  {panel.name}
                  {panel.specialization ? ` (${panel.specialization})` : ''}
                </option>
              ))}
            </select>
          )}
        </div>

        <button 
          type="submit" 
          disabled={loading || panels.length === 0}
          className="btn btn-primary"
        >
          {loading ? 'Registering...' : 'Register Patient'}
        </button>
      </form>
    </div>
  );
}

export default PatientForm;
```

### CSS Styling (PatientForm.css):
```css
.patient-form-container {
  max-width: 600px;
  margin: 0 auto;
  padding: 20px;
}

.patient-form-container h1 {
  margin-bottom: 20px;
  color: #333;
}

.alert {
  padding: 10px 15px;
  margin-bottom: 15px;
  border-radius: 4px;
}

.alert-error {
  background-color: #f8d7da;
  border: 1px solid #f5c6cb;
  color: #721c24;
}

.alert-success {
  background-color: #d4edda;
  border: 1px solid #c3e6cb;
  color: #155724;
}

.form-group {
  margin-bottom: 15px;
}

.form-group label {
  display: block;
  margin-bottom: 5px;
  font-weight: 500;
  color: #333;
}

.form-group input,
.form-group select {
  width: 100%;
  padding: 8px 12px;
  border: 1px solid #ddd;
  border-radius: 4px;
  font-size: 14px;
}

.form-group input:focus,
.form-group select:focus {
  outline: none;
  border-color: #007bff;
  box-shadow: 0 0 5px rgba(0, 123, 255, 0.3);
}

.btn {
  padding: 10px 20px;
  border: none;
  border-radius: 4px;
  font-size: 16px;
  cursor: pointer;
  width: 100%;
}

.btn-primary {
  background-color: #007bff;
  color: white;
}

.btn-primary:hover:not(:disabled) {
  background-color: #0056b3;
}

.btn-primary:disabled {
  background-color: #ccc;
  cursor: not-allowed;
}
```

---

## 6. Testing the Integration

### Test with cURL

**1. Create a panel:**
```bash
curl -X POST http://localhost:5000/api/clinic-panels \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Pediatric Dentistry",
    "code": "PED",
    "clinic_id": "clinic123",
    "specialization": "Pediatric Dentistry",
    "opening_time": "09:00",
    "closing_time": "18:00"
  }'
```

**2. Get active panels:**
```bash
curl -X GET "http://localhost:5000/api/clinic-panels/active?clinic_id=clinic123" \
  -H "Authorization: Bearer YOUR_TOKEN"
```

**3. Create patient with panel:**
```bash
curl -X POST http://localhost:5000/api/patient \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "full_name": "John Doe",
    "email": "john@example.com",
    "contact_number": "9876543210",
    "panel": "PED",
    "clinic_id": "clinic123",
    "registration_type": "clinic"
  }'
```

---

## 7. Summary

✅ **Clinic Panel Schema Created**
✅ **API Endpoints Implemented**
✅ **Patient Model Compatible**
✅ **Routes Registered**
✅ **Ready for Frontend Integration**

Your patient form can now:
1. Fetch available panels/departments
2. Let users select a panel during registration
3. Store the selected panel with patient data
4. Filter panels by specialization (optional)

All API endpoints are documented in `CLINIC_PANEL_API.md`
