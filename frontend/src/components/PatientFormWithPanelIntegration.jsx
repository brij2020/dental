// PatientFormWithPanelIntegration.jsx
// Complete React Component for Patient Registration with Clinic Panel Integration

import React, { useEffect, useState, useCallback } from 'react';
import './PatientFormWithPanelIntegration.css';

/**
 * Complete Patient Registration Form with Clinic Panel Integration
 * 
 * Features:
 * - Fetch available panels/departments from API
 * - Filter panels by specialization
 * - Validate patient data
 * - Submit with panel assignment
 * - Real-time form validation
 * - Error handling and feedback
 */
function PatientFormWithPanelIntegration({ 
  clinicId = 'clinic123', 
  token = localStorage.getItem('token'),
  onSuccess = () => {} 
}) {
  // ============= State Management =============
  const [panels, setPanels] = useState([]);
  const [specializations, setSpecializations] = useState([]);
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [selectedSpecialization, setSelectedSpecialization] = useState('');
  const [formErrors, setFormErrors] = useState({});

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
    panel: '',
    avatar: ''
  });

  // ============= API Constants =============
  const SPECIALIZATIONS = [
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

  const API_BASE = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';
  const HEADERS = {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${token}`
  };

  // ============= Effects =============

  /**
   * Fetch all active panels for the clinic on component mount
   */
  useEffect(() => {
    fetchPanels();
  }, [clinicId]);

  /**
   * Fetch panels when specialization filter changes
   */
  useEffect(() => {
    if (selectedSpecialization) {
      fetchPanelsBySpecialization(selectedSpecialization);
    } else {
      fetchPanels();
    }
  }, [selectedSpecialization]);

  // ============= API Calls =============

  /**
   * Fetch all active panels for the clinic
   */
  const fetchPanels = useCallback(async () => {
    try {
      setLoading(true);
      setError('');

      const response = await fetch(
        `${API_BASE}/clinic-panels/active?clinic_id=${clinicId}`,
        { headers: HEADERS }
      );

      if (!response.ok) {
        throw new Error(`Failed to fetch panels: ${response.statusText}`);
      }

      const { data } = await response.json();
      setPanels(data);
      
      // Extract unique specializations
      const specs = [...new Set(data
        .map(p => p.specialization)
        .filter(Boolean)
      )];
      setSpecializations(specs);
    } catch (err) {
      setError(`Error loading panels: ${err.message}`);
      console.error('Panel fetch error:', err);
    } finally {
      setLoading(false);
    }
  }, [clinicId, HEADERS]);

  /**
   * Fetch panels filtered by specialization
   */
  const fetchPanelsBySpecialization = useCallback(async (specialization) => {
    try {
      setLoading(true);

      const response = await fetch(
        `${API_BASE}/clinic-panels/specialization?clinic_id=${clinicId}&specialization=${encodeURIComponent(specialization)}`,
        { headers: HEADERS }
      );

      if (!response.ok) {
        throw new Error('Failed to fetch panels');
      }

      const { data } = await response.json();
      setPanels(data);
    } catch (err) {
      console.error('Specialization filter error:', err);
      setError('Error filtering panels');
    } finally {
      setLoading(false);
    }
  }, [clinicId, HEADERS]);

  /**
   * Submit patient registration
   */
  const submitPatient = useCallback(async (patientData) => {
    try {
      setSubmitting(true);
      setError('');

      const response = await fetch(
        `${API_BASE}/patient`,
        {
          method: 'POST',
          headers: HEADERS,
          body: JSON.stringify({
            ...patientData,
            clinic_id: clinicId,
            registration_type: 'clinic'
          })
        }
      );

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to register patient');
      }

      const result = await response.json();
      
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
        panel: '',
        avatar: ''
      });
      setSelectedSpecialization('');
      setFormErrors({});

      // Call success callback
      onSuccess(result.data);

      return result.data;
    } catch (err) {
      setError(err.message);
      console.error('Patient registration error:', err);
      throw err;
    } finally {
      setSubmitting(false);
    }
  }, [clinicId, HEADERS, onSuccess]);

  // ============= Validation =============

  /**
   * Validate individual field
   */
  const validateField = (name, value) => {
    const errors = { ...formErrors };

    switch (name) {
      case 'full_name':
        if (!value || value.trim().length === 0) {
          errors.full_name = 'Full name is required';
        } else if (value.trim().length < 2) {
          errors.full_name = 'Full name must be at least 2 characters';
        } else {
          delete errors.full_name;
        }
        break;

      case 'email':
        if (!value) {
          errors.email = 'Email is required';
        } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) {
          errors.email = 'Please enter a valid email';
        } else {
          delete errors.email;
        }
        break;

      case 'contact_number':
        if (!value) {
          errors.contact_number = 'Contact number is required';
        } else if (!/^[6-9]\d{9}$/.test(value)) {
          errors.contact_number = 'Please enter a valid 10-digit phone number';
        } else {
          delete errors.contact_number;
        }
        break;

      case 'panel':
        if (!value) {
          errors.panel = 'Panel/Department is required';
        } else {
          delete errors.panel;
        }
        break;

      case 'pincode':
        if (value && !/^\d{6}$/.test(value)) {
          errors.pincode = 'Please enter a valid 6-digit pincode';
        } else {
          delete errors.pincode;
        }
        break;

      case 'date_of_birth':
        if (value) {
          const age = new Date().getFullYear() - new Date(value).getFullYear();
          if (age < 0 || age > 120) {
            errors.date_of_birth = 'Please enter a valid date of birth';
          } else {
            delete errors.date_of_birth;
          }
        } else {
          delete errors.date_of_birth;
        }
        break;

      default:
        break;
    }

    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  /**
   * Validate entire form
   */
  const validateForm = () => {
    const requiredFields = ['full_name', 'email', 'contact_number', 'panel'];
    const newErrors = {};

    requiredFields.forEach(field => {
      const value = formData[field];
      if (!value || (typeof value === 'string' && value.trim() === '')) {
        newErrors[field] = `${field.replace(/_/g, ' ')} is required`;
      }
    });

    // Validate each field
    if (formData.full_name && formData.full_name.length < 2) {
      newErrors.full_name = 'Full name must be at least 2 characters';
    }
    if (formData.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = 'Please enter a valid email';
    }
    if (formData.contact_number && !/^[6-9]\d{9}$/.test(formData.contact_number)) {
      newErrors.contact_number = 'Please enter a valid 10-digit phone number';
    }
    if (formData.pincode && !/^\d{6}$/.test(formData.pincode)) {
      newErrors.pincode = 'Please enter a valid 6-digit pincode';
    }

    setFormErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // ============= Event Handlers =============

  const handleChange = (e) => {
    const { name, value } = e.target;
    
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));

    // Validate on change
    validateField(name, value);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    // Validate form
    if (!validateForm()) {
      setError('Please fix the errors in the form');
      return;
    }

    try {
      await submitPatient(formData);
      
      // Scroll to success message
      setTimeout(() => {
        window.scrollTo({ top: 0, behavior: 'smooth' });
      }, 100);
    } catch (err) {
      // Error is already set in submitPatient
      console.error(err);
    }
  };

  const handleReset = () => {
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
      panel: '',
      avatar: ''
    });
    setSelectedSpecialization('');
    setFormErrors({});
    setError('');
  };

  // ============= Render =============

  return (
    <div className="patient-form-wrapper">
      <div className="patient-form-container">
        <div className="form-header">
          <h1>Patient Registration</h1>
          <p>Please fill in all required fields marked with *</p>
        </div>

        {/* Alerts */}
        {error && (
          <div className="alert alert-error">
            <span className="alert-icon">⚠️</span>
            <div>
              <strong>Error</strong>
              <p>{error}</p>
            </div>
          </div>
        )}

        {success && (
          <div className="alert alert-success">
            <span className="alert-icon">✓</span>
            <div>
              <strong>Success</strong>
              <p>{success}</p>
            </div>
          </div>
        )}

        {/* Loading State */}
        {loading && panels.length === 0 && (
          <div className="loading-state">
            <div className="spinner"></div>
            <p>Loading available panels...</p>
          </div>
        )}

        {!loading && (
          <form onSubmit={handleSubmit} noValidate>
            {/* Basic Information Section */}
            <fieldset>
              <legend>Basic Information</legend>

              <div className="form-group">
                <label htmlFor="full_name">
                  Full Name <span className="required">*</span>
                </label>
                <input
                  type="text"
                  id="full_name"
                  name="full_name"
                  value={formData.full_name}
                  onChange={handleChange}
                  placeholder="Enter full name"
                  className={formErrors.full_name ? 'error' : ''}
                  required
                />
                {formErrors.full_name && (
                  <span className="error-message">{formErrors.full_name}</span>
                )}
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label htmlFor="email">
                    Email <span className="required">*</span>
                  </label>
                  <input
                    type="email"
                    id="email"
                    name="email"
                    value={formData.email}
                    onChange={handleChange}
                    placeholder="Enter email address"
                    className={formErrors.email ? 'error' : ''}
                    required
                  />
                  {formErrors.email && (
                    <span className="error-message">{formErrors.email}</span>
                  )}
                </div>

                <div className="form-group">
                  <label htmlFor="contact_number">
                    Contact Number <span className="required">*</span>
                  </label>
                  <input
                    type="tel"
                    id="contact_number"
                    name="contact_number"
                    value={formData.contact_number}
                    onChange={handleChange}
                    placeholder="10-digit phone number"
                    maxLength="10"
                    className={formErrors.contact_number ? 'error' : ''}
                    required
                  />
                  {formErrors.contact_number && (
                    <span className="error-message">{formErrors.contact_number}</span>
                  )}
                </div>
              </div>

              <div className="form-row">
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
                    className={formErrors.date_of_birth ? 'error' : ''}
                  />
                  {formErrors.date_of_birth && (
                    <span className="error-message">{formErrors.date_of_birth}</span>
                  )}
                </div>
              </div>
            </fieldset>

            {/* Contact Information Section */}
            <fieldset>
              <legend>Contact Information</legend>

              <div className="form-group">
                <label htmlFor="address">Address</label>
                <input
                  type="text"
                  id="address"
                  name="address"
                  value={formData.address}
                  onChange={handleChange}
                  placeholder="Street address"
                />
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label htmlFor="city">City</label>
                  <input
                    type="text"
                    id="city"
                    name="city"
                    value={formData.city}
                    onChange={handleChange}
                    placeholder="City"
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
                    placeholder="State"
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
                    placeholder="6-digit pincode"
                    maxLength="6"
                    className={formErrors.pincode ? 'error' : ''}
                  />
                  {formErrors.pincode && (
                    <span className="error-message">{formErrors.pincode}</span>
                  )}
                </div>
              </div>
            </fieldset>

            {/* Panel Selection Section */}
            <fieldset>
              <legend>Panel / Department Selection</legend>

              {specializations.length > 0 && (
                <div className="form-group">
                  <label htmlFor="specialization">Filter by Specialization</label>
                  <select
                    id="specialization"
                    value={selectedSpecialization}
                    onChange={(e) => setSelectedSpecialization(e.target.value)}
                  >
                    <option value="">-- All Specializations --</option>
                    {specializations.map(spec => (
                      <option key={spec} value={spec}>{spec}</option>
                    ))}
                  </select>
                </div>
              )}

              <div className="form-group">
                <label htmlFor="panel">
                  Panel / Department <span className="required">*</span>
                </label>
                {loading ? (
                  <p className="loading-text">Loading panels...</p>
                ) : panels.length === 0 ? (
                  <p className="no-data-text">No panels available</p>
                ) : (
                  <>
                    <select
                      id="panel"
                      name="panel"
                      value={formData.panel}
                      onChange={handleChange}
                      className={formErrors.panel ? 'error' : ''}
                      required
                    >
                      <option value="">-- Select Panel --</option>
                      {panels.map(panel => (
                        <option key={panel._id} value={panel.code}>
                          {panel.name}
                          {panel.specialization && ` (${panel.specialization})`}
                        </option>
                      ))}
                    </select>
                    {formErrors.panel && (
                      <span className="error-message">{formErrors.panel}</span>
                    )}
                  </>
                )}
              </div>
            </fieldset>

            {/* Form Actions */}
            <div className="form-actions">
              <button
                type="submit"
                disabled={submitting || loading || panels.length === 0}
                className="btn btn-primary"
              >
                {submitting ? 'Registering...' : 'Register Patient'}
              </button>
              <button
                type="reset"
                onClick={handleReset}
                disabled={submitting}
                className="btn btn-secondary"
              >
                Clear Form
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}

export default PatientFormWithPanelIntegration;
