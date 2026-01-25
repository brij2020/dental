// AddPatientModal.tsx
import React, { useEffect, useState, type ElementType } from 'react';
import { toast } from 'react-toastify';
import { getAllClinicPanels, getPatientByUhid, getPatientByPhone, put } from '../../../lib/apiClient';
import { Modal } from '../../../components/Modal';
import {
  IconUser, IconId, IconCalendar, IconMail, IconPhone,
  IconHome, IconWorld, IconBuilding, IconGenderMale, IconTag, IconSearch
} from '@tabler/icons-react';

export type PatientGlobal = {
  id: string;
  uhid: string;
  full_name: string;
  date_of_birth: string | null;
  address: string | null;
  email: string | null;
  contact_number: string | null;
  gender: string | null;
  state: string | null;
  city: string | null;
  panel?: string | null;
};

// Validation helpers
const is10Digits = (v: string) => /^\d{10}$/.test(v);

// Fetch patient by UHID via API
async function searchPatientByUhid(uhid: string): Promise<PatientGlobal[]> {
  try {
    const response = await getPatientByUhid(uhid);
    const patient = response.data?.data;
    return patient ? [patient] : [];
  } catch (error) {
    console.error('Error fetching patient by UHID:', error);
    toast.error('Failed to search by UHID');
    throw error;
  }
}

// Fetch patient by phone number via API
async function searchPatientByPhone(phone: string): Promise<PatientGlobal[]> {
  try {
    const response = await getPatientByPhone(phone);
    return response.data?.data || [];
  } catch (error) {
    console.error('Error fetching patients by phone:', error);
    toast.error('Failed to search by phone number');
    throw error;
  }
}

// Check if patient already exists in clinic via API
async function checkPatientExistsInClinic(clinicId: string, patientId: string): Promise<{ exists: boolean; fileNumber: string | null }> {
  try {
    const response = await getAllClinicPanels(clinicId);
    const patients = response.data?.data || [];
    
    // Check if patient exists in clinic
    const existingPatient = patients.find((p: any) => p.patient_id === patientId || p._id === patientId);
    
    if (existingPatient) {
      return { exists: true, fileNumber: existingPatient.file_number || null };
    }
    return { exists: false, fileNumber: null };
  } catch (error) {
    console.error('Error checking patient existence:', error);
    // If API fails, assume patient doesn't exist and allow registration
    return { exists: false, fileNumber: null };
  }
}

// Update patient via API
async function updatePatientViaApi(patientId: string, patientData: any) {
  try {
    const response = await put(`/api/patients/${patientId}`, patientData);
    return response.data?.data || response.data;
  } catch (error) {
    console.error('Error updating patient:', error);
    throw error;
  }
}

const Input = React.forwardRef<HTMLInputElement, {
  label: string;
  icon: ElementType;
} & React.InputHTMLAttributes<HTMLInputElement>>(
  ({ id, label, icon: Icon, type = 'text', ...props }, ref) => (
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
          className="w-full rounded-xl border border-slate-300 bg-white pl-10 pr-3 py-2.5 text-slate-900 outline-none"
          {...props}
        />
      </div>
    </div>
  )
);

const Select = React.forwardRef<HTMLSelectElement, {
  label: string;
  icon: ElementType;
  children: React.ReactNode;
} & React.SelectHTMLAttributes<HTMLSelectElement>>(
  ({ id, label, icon: Icon, children, ...props }, ref) => (
    <div>
      <label htmlFor={id} className="block text-sm font-medium text-slate-700 mb-1">{label}</label>
      <div className="relative">
        <span className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
          <Icon className="h-5 w-5 text-slate-400" />
        </span>
        <select
          id={id}
          ref={ref}
          className="w-full rounded-xl border border-slate-300 bg-white pl-10 pr-3 py-2.5 text-slate-900 outline-none"
          {...props}
        >
          {children}
        </select>
      </div>
    </div>
  )
);

type Props = {
  clinicId: string | null;
  open: boolean;
  onClose: () => void;
  onSuccess: () => void;
};

const EMPTY_FORM: PatientGlobal = {
  id: '',
  uhid: '',
  full_name: '',
  date_of_birth: '',
  address: '',
  email: '',
  contact_number: '',
  gender: '',
  state: '',
  city: '',
  panel: null,
};

export default function AddPatientModal({ clinicId, open, onClose, onSuccess }: Props) {
  const [searchValue, setSearchValue] = useState('');
  const [searchResults, setSearchResults] = useState<PatientGlobal[]>([]);
  const [form, setForm] = useState<PatientGlobal>(EMPTY_FORM);
  const [isFormDisabled, setIsFormDisabled] = useState(true);
  const [saving, setSaving] = useState(false);
  const [searching, setSearching] = useState(false);
  const [panels, setPanels] = useState<string[]>([]);
  const [panel, setPanel] = useState<string>('General');
  const [alreadyRegistered, setAlreadyRegistered] = useState<{ exists: boolean; fileNumber: string | null }>({ exists: false, fileNumber: null });

  const reset = () => {
    setSearchValue('');
    setSearchResults([]);
    setForm(EMPTY_FORM);
    setIsFormDisabled(true);
    setSaving(false);
    setSearching(false);
    setPanel('General');
    setAlreadyRegistered({ exists: false, fileNumber: null });
  };

  useEffect(() => {
    if (!open) reset();
  }, [open]);

  // Check if selected patient already exists in clinic
  const checkAndSetPatient = async (patient: PatientGlobal) => {
    if (!clinicId) return;

    try {
      const existsResult = await checkPatientExistsInClinic(clinicId, patient.id);
      setAlreadyRegistered(existsResult);

      if (existsResult.exists) {
        toast.warning(`This patient is already registered in your clinic with File Number: ${existsResult.fileNumber}`);
      }

      setForm(patient);
      setPanel(patient.panel ?? 'General');
      setIsFormDisabled(existsResult.exists); // Disable form if already registered
    } catch (err) {
      console.error('Error checking patient:', err);
      setForm(patient);
      setPanel(patient.panel ?? 'General');
      setIsFormDisabled(false);
    }
  };

  // Search by UHID or Phone Number
  useEffect(() => {
    const t = setTimeout(async () => {
      const cleaned = searchValue.replace(/[\s\-+()]/g, '');
      
      // Need at least 10 digits to search
      if (!is10Digits(cleaned)) {
        setSearchResults([]);
        setForm(EMPTY_FORM);
        setIsFormDisabled(true);
        setAlreadyRegistered({ exists: false, fileNumber: null });
        return;
      }

      setSearching(true);
      try {
        // First try UHID search
        let results = await searchPatientByUhid(cleaned);
        
        // If no UHID match, try phone number search
        if (results.length === 0) {
          results = await searchPatientByPhone(cleaned);
        }

        setSearchResults(results);

        if (results.length === 1) {
          // Single result - auto-select and check if already registered
          const p = results[0];
          toast.success(`Patient "${p.full_name}" found.`);
          await checkAndSetPatient(p);
        } else if (results.length > 1) {
          // Multiple results - show selection
          toast.info(`${results.length} patients found. Please select one.`);
          setForm(EMPTY_FORM);
          setIsFormDisabled(true);
          setAlreadyRegistered({ exists: false, fileNumber: null });
        } else {
          // No results
          toast.info("No patient found with this UHID or phone number.");
          setForm(EMPTY_FORM);
          setIsFormDisabled(true);
          setAlreadyRegistered({ exists: false, fileNumber: null });
        }
      } catch (err) {
        console.error(err);
      } finally {
        setSearching(false);
      }
    }, 500);

    return () => clearTimeout(t);
  }, [searchValue, clinicId]);

  // Handle patient selection from multiple results
  const handleSelectPatient = async (patient: PatientGlobal) => {
    setSearchResults([]); // Clear the list after selection
    toast.success(`Patient "${patient.full_name}" selected.`);
    await checkAndSetPatient(patient);
  };

  // Load clinic panels from API
  useEffect(() => {
    if (!open || !clinicId) return;

    const loadPanels = async () => {
      try {
        const response = await getAllClinicPanels(clinicId);
        const panelData = response.data?.data || [];
        const panelNames = panelData.map((p: any) => p.name);
        setPanels(panelNames);
      } catch (error) {
        console.error('Error loading panels:', error);
        toast.error("Failed to load panels.");
      }
    };

    loadPanels();
  }, [open, clinicId]);

  const saveToClinic = async () => {
    if (!clinicId) return toast.error("No clinic selected.");
    if (!form.id) return toast.error("No patient selected.");

    // Double-check if already registered before saving
    if (alreadyRegistered.exists) {
      return toast.error(`This patient is already registered with File Number: ${alreadyRegistered.fileNumber}`);
    }

    setSaving(true);
    try {
      const panelValue = panel === 'General' ? null : panel;

      // Update patient's panel via MongoDB API
      await updatePatientViaApi(form.id, { panel: panelValue });

      toast.success(`Patient added successfully to clinic!`);
      onSuccess();
      onClose();

    } catch (err: any) {
      console.error(err);
      const errorMessage = err.response?.data?.message || err.message || "Failed to save patient.";
      toast.error(errorMessage);
    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal isOpen={open} onClose={onClose} title="Add Registered Patient to Clinic">
      <div className="space-y-6">
        {/* Search Input */}
        <div>
          <label htmlFor="patient_search" className="block text-sm font-medium text-slate-700 mb-1">
            Search by UHID or Phone Number
          </label>
          <div className="relative">
            <span className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
              <IconSearch className="h-5 w-5 text-slate-400" />
            </span>
            <input
              id="patient_search"
              name="patient_search"
              type="text"
              value={searchValue}
              onChange={(e) => setSearchValue(e.target.value)}
              placeholder="Enter 10-digit UHID or phone number..."
              className="w-full rounded-xl border border-slate-300 bg-white pl-10 pr-3 py-2.5 text-slate-900 outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
            />
            {searching && (
              <span className="absolute inset-y-0 right-0 flex items-center pr-3">
                <svg className="animate-spin h-5 w-5 text-indigo-500" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
              </span>
            )}
          </div>
          <p className="mt-1 text-xs text-slate-500">
            Enter a 10-digit UHID or phone number to search
          </p>
        </div>

        {/* Already Registered Warning */}
        {alreadyRegistered.exists && (
          <div className="bg-amber-50 border border-amber-200 rounded-xl p-4">
            <div className="flex items-center gap-2">
              <svg className="h-5 w-5 text-amber-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
              <p className="text-sm font-medium text-amber-800">
                This patient is already registered in your clinic
              </p>
            </div>
            <p className="text-sm text-amber-700 mt-1">
              File Number: <span className="font-semibold">{alreadyRegistered.fileNumber}</span>
            </p>
          </div>
        )}

        {/* Multiple Results List */}
        {searchResults.length > 1 && (
          <div className="border border-slate-200 rounded-xl overflow-hidden">
            <div className="bg-slate-50 px-4 py-2 border-b border-slate-200">
              <p className="text-sm font-medium text-slate-700">
                {searchResults.length} patients found - Select one:
              </p>
            </div>
            <ul className="divide-y divide-slate-200 max-h-48 overflow-y-auto">
              {searchResults.map((patient) => (
                <li
                  key={patient.id}
                  onClick={() => handleSelectPatient(patient)}
                  className="px-4 py-3 hover:bg-indigo-50 cursor-pointer transition-colors"
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-slate-900">{patient.full_name}</p>
                      <p className="text-xs text-slate-500">
                        UHID: {patient.uhid} | Phone: {patient.contact_number || 'N/A'}
                      </p>
                    </div>
                    <IconUser className="h-5 w-5 text-slate-400" />
                  </div>
                </li>
              ))}
            </ul>
          </div>
        )}

        <hr />

        {/* Patient Details (read-only) */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Input id="full_name" label="Full Name" icon={IconUser} disabled value={form.full_name ?? ''} />
          <Input id="uhid" label="UHID" icon={IconId} disabled value={form.uhid ?? ''} />
          <Input id="date_of_birth" label="Date of Birth" type="date" icon={IconCalendar} disabled value={form.date_of_birth ?? ''} />
          <Input id="email" label="Email" type="email" icon={IconMail} disabled value={form.email ?? ''} />
          <Input id="contact_number" label="Contact Number" icon={IconPhone} disabled value={form.contact_number ?? ''} />
          <Input id="address" label="Address" icon={IconHome} disabled value={form.address ?? ''} />
          <Select id="gender" label="Gender" icon={IconGenderMale} disabled value={form.gender ?? ''}>
            <option value="">Select Gender</option>
            <option value="male">Male</option>
            <option value="female">Female</option>
            <option value="other">Other</option>
          </Select>
          <Input id="city" label="City" icon={IconBuilding} disabled value={form.city ?? ''} />
          <Input id="state" label="State" icon={IconWorld} disabled value={form.state ?? ''} />

          {/* Only editable field */}
          <Select
            id="panel"
            name="panel"
            label="Panel"
            icon={IconTag}
            value={panel}
            disabled={isFormDisabled}
            onChange={(e) => setPanel(e.target.value)}
          >
            <option value="General">General</option>
            {panels.map((p) => (
              <option key={p} value={p}>{p}</option>
            ))}
          </Select>
        </div>

        <div className="flex justify-end gap-3 pt-4 border-t">
          <button className="px-4 py-2 text-sm bg-slate-100 rounded-xl hover:bg-slate-200 transition-colors" onClick={onClose}>
            Cancel
          </button>
          <button
            className="px-4 py-2 text-sm text-white bg-gradient-to-r from-indigo-600 to-sky-500 rounded-xl disabled:opacity-50 disabled:cursor-not-allowed hover:brightness-105 transition-all"
            disabled={isFormDisabled || saving || alreadyRegistered.exists}
            onClick={saveToClinic}
          >
            {saving ? "Saving..." : "Save Patient"}
          </button>
        </div>
      </div>
    </Modal>
  );
}