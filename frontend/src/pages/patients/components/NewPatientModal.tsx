import React, { useState, useEffect, type ChangeEvent, type ElementType } from 'react';
import { toast } from 'react-toastify';
import { Modal } from '../../../components/Modal';
import { useAuth } from '../../../state/useAuth';
import { getAllClinicPanels, createPatient, getPatientByUhid, getPatientByPhone, getAllPatients } from '../../../lib/apiClient';
import { useLocationData, getStateName } from '../../../hooks/useLocationData';
import { CountrySelect, StateSelect, CitySelect } from '../../../components/LocationSelects';
import {
  IconUser,
  IconCalendar,
  IconMail,
  IconPhone,
  IconHome,
  IconGenderMale,
  IconTag,
  IconLock,
  IconSearch
} from '@tabler/icons-react';

// --- Styled Form Components ---
type InputProps = React.InputHTMLAttributes<HTMLInputElement> & {
  label: string;
  icon: ElementType;
};

const Input = React.forwardRef<HTMLInputElement, InputProps>(({ id, label, icon: Icon, type = 'text', ...props }, ref) => (
  <div>
    <label htmlFor={id} className="block text-sm font-medium text-slate-700 mb-1">{label}</label>
    <div className="relative">
      <span className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
        <Icon className="h-5 w-5 text-slate-400" />
      </span>
      <input
        id={id}
        ref={ref}
        type={type}
        className="w-full rounded-xl border border-slate-300 bg-white pl-10 pr-3 py-2.5 text-slate-900 outline-none focus:ring-4 focus:ring-sky-300/40 focus:border-sky-400 transition"
        {...props}
      />
    </div>
  </div>
));

type SelectProps = React.SelectHTMLAttributes<HTMLSelectElement> & {
    label: string;
    icon: ElementType;
    children: React.ReactNode;
};
  
const Select = React.forwardRef<HTMLSelectElement, SelectProps>(({ id, label, icon: Icon, children, ...props }, ref) => (
    <div>
        <label htmlFor={id} className="block text-sm font-medium text-slate-700 mb-1">{label}</label>
        <div className="relative">
            <span className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
                <Icon className="h-5 w-5 text-slate-400" />
            </span>
            <select
                id={id}
                ref={ref}
                className="w-full appearance-none rounded-xl border border-slate-300 bg-white pl-10 pr-3 py-2.5 text-slate-900 outline-none focus:ring-4 focus:ring-sky-300/40 focus:border-sky-400 transition"
                {...props}
            >
                {children}
            </select>
        </div>
    </div>
));

// --- Main Component ---
type Props = {
  open: boolean;
  onClose: () => void;
  onSuccess: () => void;
};

const EMPTY_FORM = {
    email: '',
    password: '',
    full_name: '',
    date_of_birth: '',
    contact_number: '',
    gender: '',
    address: '',
    panel: 'General',
    clinic_id: '',  
};

export default function NewPatientModal({ open, onClose, onSuccess }: Props) {
  const { user } = useAuth(); 
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState(EMPTY_FORM);
  const [panels, setPanels] = useState<string[]>([]);
  const [mode, setMode] = useState<'new' | 'existing'>('new');
  const [uhidSearch, setUhidSearch] = useState('');
  const [searchingPatient, setSearchingPatient] = useState(false);
  const [searchedPatient, setSearchedPatient] = useState<any>(null);
  const [searchResults, setSearchResults] = useState<any[]>([]);

  // Use the location hook with India as default country
  const {
    location,
    countries,
    states,
    cities,
    setCountry,
    setState,
    setCity,
    resetLocation,
    isLoadingStates,
    isLoadingCities,
  } = useLocationData(undefined, 'IN'); // Default to India

  const resetState = () => {
    setForm(EMPTY_FORM);
    resetLocation();
    setSaving(false);
    setUhidSearch('');
    setSearchedPatient(null);
    setSearchResults([]);
    setMode('new');
  };

  useEffect(() => {
    if (!open || !user?.clinic_id) return;

    const fetchPanels = async () => {
      try {
        if (!user.clinic_id) {
          setPanels([]);
          return;
        }
        const response = await getAllClinicPanels(user.clinic_id);
        const panelData = response.data?.data || [];
        const panelNames = panelData.map((p: any) => p.name);
        setPanels(panelNames);
      } catch (error) {
        console.error('Error fetching panels:', error);
        toast.error('Failed to fetch clinic panels.');
      }
    };

    fetchPanels();
  }, [open, user?.clinic_id]);

  useEffect(() => {
    if (!open) {
      resetState();
    }
  }, [open]);
  
  const handleFormChange = (e: ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setForm(prev => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const searchPatient = async () => {
    if (!uhidSearch.trim()) {
      toast.error('Please enter a name, phone number, or UHID.');
      return;
    }

    setSearchingPatient(true);
    try {
      const searchTerm = uhidSearch.trim();
      const isPhone = /^\d{10}$/.test(searchTerm); // 10-digit phone number
      const isUhid = searchTerm.toUpperCase().startsWith('UH-');
      
      let results: any[] = [];

      // Search by phone if looks like phone
      if (isPhone) {
        const response = await getPatientByPhone(searchTerm);
        const patient = response.data?.data || response.data;
        if (patient) {
          results = Array.isArray(patient) ? patient : [patient];
        }
      }
      // Search by UHID if looks like UHID
      else if (isUhid) {
        const response = await getPatientByUhid(searchTerm);
        const patient = response.data?.data || response.data;
        if (patient) {
          results = Array.isArray(patient) ? patient : [patient];
        }
      }
      // Search by name (general search)
      else {
        const response = await getAllPatients({ search: searchTerm });
        results = response.data?.data || [];
      }

      if (!results || results.length === 0) {
        toast.error(`No patients found for "${searchTerm}".`);
        setSearchResults([]);
        setSearchedPatient(null);
        return;
      }

      setSearchResults(results);
      
      // If only one result, auto-select it
      if (results.length === 1) {
        selectPatient(results[0]);
      } else {
        toast.info(`Found ${results.length} patient(s). Click to select one.`);
      }
    } catch (error) {
      console.error('Error searching patient:', error);
      toast.error('Failed to search patients.');
      setSearchResults([]);
      setSearchedPatient(null);
    } finally {
      setSearchingPatient(false);
    }
  };

  const selectPatient = (patient: any) => {
    if (!patient || !patient._id) {
      toast.error('Invalid patient data.');
      return;
    }

    // Pre-fill form with patient data
    setForm(prev => ({
      ...prev,
      full_name: patient.full_name || '',
      date_of_birth: patient.date_of_birth ? patient.date_of_birth.split('T')[0] : '',
      contact_number: patient.contact_number || '',
      email: patient.email || '',
      gender: patient.gender || '',
      address: patient.address || '',
      panel: patient.panel || 'General',
    }));

    // Set location
    if (patient.country) setCountry(patient.country);
    if (patient.state) setState(patient.state);
    if (patient.city) setCity(patient.city);

    setSearchedPatient(patient);
    setSearchResults([]);
    toast.success(`Patient "${patient.full_name}" selected!`);
  };

  const save = async () => {
    if (!user?.clinic_id) {
      toast.error('No clinic selected. Please select a clinic first.');
      return;
    }

    // EXISTING PATIENT MODE
    if (mode === 'existing') {
      if (!searchedPatient || !searchedPatient._id) {
        toast.error('Please search and find a patient first.');
        return;
      }

      setSaving(true);
      try {
        // Link patient to clinic via updatePatient with clinic_id
        await createPatient({
          clinic_id: user.clinic_id,
          registration_type: 'clinic',
          panel: form.panel === 'General' ? null : form.panel,
          _id: searchedPatient._id // Include patient ID to link
        });

        toast.success(
          `Patient "${searchedPatient.full_name}" added to your clinic successfully!`
        );
        onSuccess();
        onClose();
      } catch (e: any) {
        console.error(e);
        toast.error(e.message || 'Failed to add patient to clinic.');
      } finally {
        setSaving(false);
      }
      return;
    }

    // NEW PATIENT MODE
    if (!form.email.trim() || !form.password.trim()) {
        toast.error('Email and Password are required for registration.');
        return;
    }
    if (form.password.length < 8) {
      toast.error('Password must be at least 8 characters long.');
      return;
    }
    if (!form.full_name.trim()) {
      toast.error('Full Name is required.');
      return;
    }
    if (form.date_of_birth) {
      const dob = new Date(form.date_of_birth);
      const today = new Date();
      today.setHours(0, 0, 0, 0); // Reset time for accurate comparison
      if (dob > today) {
        toast.error('Date of Birth cannot be a future date.');
        return;
      }
    }

    setSaving(true);
    try {
      // Get the display name for state (not the code)
      const stateName = location.state 
        ? getStateName(location.country, location.state) 
        : null;

      // 1. Create patient via MongoDB API
      const response = await createPatient({
        email: form.email,
        password: form.password,
        full_name: form.full_name,
        date_of_birth: form.date_of_birth || null,
        contact_number: form.contact_number || null,
        gender: form.gender || null,
        address: form.address || null,
        city: location.city || null,
        state: stateName,
        country: location.country || null,
        clinic_id: user.clinic_id,
        registration_type: 'clinic',
        panel: form.panel === 'General' ? null : form.panel
      });

      const newPatient = response.data?.data || response.data;
      
      if (!newPatient || !newPatient._id) {
        throw new Error('Failed to create patient');
      }

      toast.success(
        `Patient "${newPatient.full_name}" registered successfully! UHID: ${newPatient.uhid || 'N/A'}`
      );

      onSuccess();
      onClose();
    } catch (e: any) {
      console.error(e);
      toast.error(e.message || 'An unexpected error occurred.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal isOpen={open} onClose={onClose} title="Patient Registration">
      <div className="space-y-6">
        
        {/* Mode Toggle */}
        <div className="flex gap-3 bg-slate-100 p-1 rounded-xl">
          <button
            type="button"
            onClick={() => {
              setMode('new');
              setSearchedPatient(null);
              setUhidSearch('');
              setSearchResults([]);
              resetLocation();
            }}
            className={`flex-1 px-4 py-2.5 rounded-lg font-medium transition ${
              mode === 'new'
                ? 'bg-white text-sky-600 shadow-sm'
                : 'text-slate-600 hover:text-slate-700'
            }`}
          >
            + New Patient
          </button>
          <button
            type="button"
            onClick={() => {
              setMode('existing');
              setForm(EMPTY_FORM);
              setSearchResults([]);
              resetLocation();
            }}
            className={`flex-1 px-4 py-2.5 rounded-lg font-medium transition ${
              mode === 'existing'
                ? 'bg-white text-sky-600 shadow-sm'
                : 'text-slate-600 hover:text-slate-700'
            }`}
          >
            ✓ Already Registered
          </button>
        </div>

        {/* EXISTING PATIENT MODE */}
        {mode === 'existing' && (
          <div className="space-y-4">
            <div className="bg-blue-50 border border-blue-200 p-3 rounded-xl">
              <p className="text-sm text-blue-700">Search by patient name, phone number (10 digits), or UHID to add them to your clinic.</p>
            </div>

            <div className="flex gap-3">
              <Input
                id="patient_search"
                label="Search Patient"
                icon={IconSearch}
                value={uhidSearch}
                onChange={(e) => setUhidSearch(e.target.value)}
                placeholder="e.g., John Doe, 9876543210, or UH-2024-001"
              />
              <div className="flex items-end">
                <button
                  type="button"
                  onClick={searchPatient}
                  disabled={searchingPatient || !uhidSearch.trim()}
                  className="px-4 py-2.5 font-medium text-white bg-gradient-to-r from-sky-500 to-cyan-400 rounded-xl hover:brightness-105 active:brightness-95 disabled:opacity-50 disabled:cursor-not-allowed transition"
                >
                  {searchingPatient ? 'Searching...' : 'Search'}
                </button>
              </div>
            </div>

            {/* Search Results List */}
            {searchResults.length > 0 && !searchedPatient && (
              <div className="space-y-3">
                <h4 className="text-sm font-semibold text-slate-700">Found {searchResults.length} Patient{searchResults.length !== 1 ? 's' : ''}</h4>
                <div className="space-y-2 max-h-64 overflow-y-auto">
                  {searchResults.map((patient) => (
                    <button
                      key={patient._id}
                      onClick={() => selectPatient(patient)}
                      className="w-full text-left p-3 border border-slate-200 rounded-lg hover:bg-sky-50 hover:border-sky-300 transition"
                    >
                      <div className="flex justify-between items-start gap-2">
                        <div>
                          <p className="font-medium text-slate-800">{patient.full_name}</p>
                          <p className="text-xs text-slate-500">
                            UHID: {patient.uhid} • Phone: {patient.contact_number || 'N/A'}
                          </p>
                          <p className="text-xs text-slate-500">
                            Email: {patient.email}
                          </p>
                        </div>
                        <span className="text-xs font-medium text-sky-600 whitespace-nowrap">Select</span>
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            )}

            {searchedPatient && (
              <div className="space-y-4">
                <div className="bg-green-50 border border-green-200 p-4 rounded-xl">
                  <h4 className="font-semibold text-green-800 mb-2">Patient Found ✓</h4>
                  <div className="grid grid-cols-2 gap-2 text-sm text-green-700">
                    <div><span className="font-medium">Name:</span> {searchedPatient.full_name}</div>
                    <div><span className="font-medium">UHID:</span> {searchedPatient.uhid}</div>
                    <div><span className="font-medium">Email:</span> {searchedPatient.email}</div>
                    <div><span className="font-medium">Phone:</span> {searchedPatient.contact_number || 'N/A'}</div>
                  </div>
                </div>

                {/* Panel Selection */}
                <div className="grid grid-cols-1 gap-4">
                  <Select
                    id="panel"
                    name="panel"
                    label="Assign to Panel"
                    icon={IconTag}
                    value={form.panel}
                    onChange={handleFormChange}
                  >
                    <option value="General">General</option>
                    {panels.map(panel => (
                      <option key={panel} value={panel}>
                        {panel}
                      </option>
                    ))}
                  </Select>
                </div>

                <div className="flex justify-end gap-3 pt-4 border-t">
                  <button
                    type="button"
                    className="px-4 py-2 text-sm font-medium text-slate-700 bg-slate-100 rounded-xl hover:bg-slate-200 transition"
                    onClick={() => {
                      setSearchedPatient(null);
                      setUhidSearch('');
                    }}
                  >
                    Clear
                  </button>
                  <button
                    type="button"
                    className="inline-flex items-center justify-center gap-2 px-4 py-2.5 font-medium text-white transition bg-gradient-to-r from-cyan-600 to-teal-500 rounded-xl shadow-sm hover:brightness-105 active:brightness-95 disabled:opacity-60 disabled:cursor-not-allowed"
                    onClick={save}
                    disabled={saving}
                  >
                    {saving ? 'Adding...' : 'Add to Clinic'}
                  </button>
                </div>
              </div>
            )}
          </div>
        )}

        {/* NEW PATIENT MODE */}
        {mode === 'new' && (
          <>
        
        {/* Account Details Section */}
        <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 mb-4">
            <h3 className="text-sm font-semibold text-slate-700 mb-3">Account Credentials</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Input
                    id="email"
                    name="email"
                    label="Email (Login ID)"
                    type="email"
                    icon={IconMail}
                    value={form.email}
                    onChange={handleFormChange}
                    required
                />
                <Input
                    id="password"
                    name="password"
                    label="Set Password"
                    type="password"
                    icon={IconLock}
                    value={form.password}
                    onChange={handleFormChange}
                    required
                    placeholder="Min. 8 characters"
                    minLength={8}
                />
            </div>
        </div>

        {/* Personal Details Section */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Input
                id="full_name"
                name="full_name"
                label="Full Name"
                icon={IconUser}
                value={form.full_name}
                onChange={handleFormChange}
                required
            />
            <Input
                id="date_of_birth"
                name="date_of_birth"
                label="Date of Birth"
                type="date"
                icon={IconCalendar}
                value={form.date_of_birth}
                onChange={handleFormChange}
                max={new Date().toISOString().split('T')[0]}
            />
            <Input
                id="contact_number"
                name="contact_number"
                label="Contact Number"
                icon={IconPhone}
                value={form.contact_number}
                onChange={handleFormChange}
            />
            <Select
                id="gender"
                name="gender"
                label="Gender"
                icon={IconGenderMale}
                value={form.gender}
                onChange={handleFormChange}
            >
                <option value="">Select Gender</option>
                <option value="male">Male</option>
                <option value="female">Female</option>
                <option value="other">Other</option>
                <option value="prefer_not_to_say">Prefer not to say</option>
            </Select>
            
            <div className="md:col-span-2">
              <Input
                  id="address"
                  name="address"
                  label="Street Address"
                  icon={IconHome}
                  value={form.address}
                  onChange={handleFormChange}
                  placeholder="House/Flat No., Street, Area"
              />
            </div>
        </div>

        {/* Location Section - Country, State, City */}
        <div className="bg-slate-50 p-4 rounded-xl border border-slate-200">
            <h3 className="text-sm font-semibold text-slate-700 mb-3">Location</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <CountrySelect
                    id="country"
                    name="country"
                    value={location.country}
                    options={countries}
                    onChange={(e) => setCountry(e.target.value)}
                />
                <StateSelect
                    id="state"
                    name="state"
                    value={location.state}
                    options={states}
                    onChange={(e) => setState(e.target.value)}
                    disabled={!location.country}
                    isLoading={isLoadingStates}
                />
                <CitySelect
                    id="city"
                    name="city"
                    value={location.city}
                    options={cities}
                    onChange={(e) => setCity(e.target.value)}
                    disabled={!location.state}
                    isLoading={isLoadingCities}
                />
            </div>
        </div>

        {/* Panel Selection */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Select
                id="panel"
                name="panel"
                label="Panel"
                icon={IconTag}
                value={form.panel}
                onChange={handleFormChange}
            >
                <option value="General">General</option>
                {panels.map(panel => (
                    <option key={panel} value={panel}>
                    {panel}
                    </option>
                ))}
            </Select>
        </div>

        <div className="flex justify-end gap-3 pt-4 border-t">
          <button
            type="button"
            className="px-4 py-2 text-sm font-medium text-slate-700 bg-slate-100 rounded-xl hover:bg-slate-200 transition"
            onClick={onClose}
          >
            Cancel
          </button>
          <button
            type="button"
            className="inline-flex items-center justify-center gap-2 px-4 py-2.5 font-medium text-white transition bg-gradient-to-r from-indigo-600 to-sky-500 rounded-xl shadow-sm hover:brightness-105 active:brightness-95 disabled:opacity-60 disabled:cursor-not-allowed"
            onClick={save}
            disabled={saving}
          >
            {saving ? 'Registering...' : 'Register and Add Patient'}
          </button>
        </div>
          </>
        )}
      </div>
    </Modal>
  );
}