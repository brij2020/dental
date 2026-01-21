import  { useEffect, useState, useRef } from 'react';
import { useAuth } from '../../state/useAuth';
import { toast } from 'react-toastify';
import { IconUserPlus, IconUserCircle } from '@tabler/icons-react';

import SearchBar from './components/SearchBar';
import PatientList from './components/PatientList';
import AddPatientModal from './components/AddPatientModal';
import NewPatientModal from './components/NewPatientModal';
import BookAppointmentModal from './components/BookAppointmentModal';

import { searchClinicPatients } from './api';
import { getAllPatients, getAllClinicPanels } from '../../lib/apiClient';
import type { ClinicPatientRow } from './types';

export default function Patients() {
  const { user } = useAuth();
  const clinicId = user?.clinic_id ?? null;

  const [searchTerm, setSearchTerm] = useState('');
  const [patients, setPatients] = useState<ClinicPatientRow[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const refreshTrigger = useRef(0);

  // modals
  const [addOpen, setAddOpen] = useState(false);
  const [regOpen, setRegOpen] = useState(false);
  const [bookingModalOpen, setBookingModalOpen] = useState(false);
  const [selectedPatient, setSelectedPatient] = useState<ClinicPatientRow | null>(null);

  // Fetch clinic panels
  useEffect(() => {
    const fetchPanels = async () => {
      if (!clinicId) return;
      try {
        await getAllClinicPanels(clinicId);

      } catch (err) {
        console.error('Error fetching panels:', err);
      }
    };
    fetchPanels();
  }, [clinicId]);

  // Debounced main search (patients_clinic) OR fetch all patients
  useEffect(() => {
    const t = setTimeout(() => {
      (async () => {
        if (!clinicId) {
          setPatients([]);
          setError('No clinic selected.');
          return;
        }

        setLoading(true);
        setError(null);
        try {
          if (searchTerm.trim()) {
            // Search mode
            const rows = await searchClinicPatients(clinicId, searchTerm);
            setPatients(rows);
          } else {
            // Fetch all patients for the clinic
            const response = await getAllPatients({ clinic_id: clinicId });
            const allPatients = response.data?.data || [];
            setPatients(allPatients);
          }
        } catch (e) {
          console.error(e);
          setError('Failed to fetch patients.');
          toast.error('An error occurred while fetching patients.');
        } finally {
          setLoading(false);
        }
      })();
    }, 300); // Debounce time

    return () => clearTimeout(t);
  }, [searchTerm, clinicId, refreshTrigger.current]);

  const handleSuccess = () => {
    setAddOpen(false);
    setRegOpen(false);
    // Trigger refresh of patient list
    refreshTrigger.current += 1;
  };

  // Handlers for opening and closing the booking modal
  const handleOpenBookAppointmentModal = (patient: ClinicPatientRow) => {
  setSelectedPatient(patient);
  setBookingModalOpen(true);
};

  const handleBookingSuccess = () => {
    setBookingModalOpen(false);
    setSelectedPatient(null);
  };

  return (
    <>
    <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
      <h1 className="text-2xl font-semibold">Patient Management</h1>
          </div>

          <div className="flex items-center gap-3">
            <button
              className="inline-flex items-center justify-center gap-2 px-4 py-2.5 font-medium text-white transition bg-gradient-to-r from-indigo-600 to-sky-500 rounded-xl shadow-sm hover:brightness-105 active:brightness-95 disabled:opacity-60 disabled:cursor-not-allowed"
              onClick={() => setAddOpen(true)}
              disabled={!clinicId}
              title={!clinicId ? 'Select a clinic first' : 'Find a patient by UHID and add them to your clinic'}
            >
              <IconUserPlus size={18} />
              Add Registered Patient
            </button>
            <button
              className="inline-flex items-center justify-center gap-2 px-4 py-2.5 font-medium text-white transition bg-gradient-to-r from-cyan-600 to-teal-500 rounded-xl shadow-sm hover:brightness-105 active:brightness-95 disabled:opacity-60 disabled:cursor-not-allowed"
              onClick={() => setRegOpen(true)}
              disabled={!clinicId}
              title={!clinicId ? 'Select a clinic first' : 'Register a new patient who does not have a UHID'}
            >
              <IconUserCircle size={18} />
              Register New Patient
            </button>
          </div>
        </div>

        {/* Main Content Area */}
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
          <SearchBar value={searchTerm} onChange={setSearchTerm} disabled={!clinicId} />
          
          <div className="mt-6">
            <PatientList 
              onBookAppointment={handleOpenBookAppointmentModal} 
              searchTerm={searchTerm} 
              loading={loading} 
              error={error} 
              patients={patients}
            />
            {!searchTerm.trim() && patients.length === 0 && !loading && !error && (
              <div className="text-center py-10">
                <h3 className="text-lg font-medium text-slate-700">No Patients Yet</h3>
                <p className="text-sm text-slate-500 mt-1">
                  Register a new patient or add an existing patient to get started.
                </p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Modals */}
      <AddPatientModal
        open={addOpen}
        clinicId={clinicId}
        onClose={() => setAddOpen(false)}
        onSuccess={handleSuccess}
      />
      
      <NewPatientModal
        open={regOpen}
        onClose={() => setRegOpen(false)}
        onSuccess={handleSuccess}
      />

      <BookAppointmentModal
        open={bookingModalOpen}
        onClose={() => setBookingModalOpen(false)}
        onSuccess={handleBookingSuccess}
        patient={selectedPatient}
        clinicId={clinicId}
      />
    </>
  );
}
