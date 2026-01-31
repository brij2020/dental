// src/features/consultation/Consultation.tsx
import React, { useEffect, useState} from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { supabase } from '../../lib/supabaseClient.ts';
import {
  getOrCreateConsultation,
  updateConsultation,
  getConsultationById,
  getAppointmentById,
  get,
} from '../../lib/apiClient';
import { prescriptionAPI } from '../../lib/prescriptionAPI';
import type { AppointmentDetails } from '../appointments/types';
import ProgressBar from './components/ProgressBar';
import ClinicalExamination from './components/ClinicalExamination';
import Procedure from './components/Procedure';
import Prescription from './components/Prescription';
import Billing from './components/Billing';
import type { ClinicalExaminationData } from './components/ClinicalExamination';
import type { PrescriptionRow } from './components/Prescription';
import type { BillingData } from './components/Billing';
import type { FollowUpData } from './components/FollowUp';
import FollowUp from './components/FollowUp';
import type { ConsultationRow } from './types';
import { Modal } from '../../components/Modal';
// --- UPDATED: Imports for icons ---
import {
  IconUser,
  IconId,
  IconCalendar,
  IconGenderIntergender,
  IconPhone,
  IconMail,
  IconMapPin,
  IconFileDescription,
  IconClipboardList,
} from '@tabler/icons-react';
import type { ReactElement } from 'react';

// Local shape for patients_clinic row (minimal fields used in UI)
type PatientClinicRow = {
  id: string;
  clinic_id: string;
  full_name: string;
  date_of_birth: string | null;
  gender: string | null;
  address: string | null;
  city: string | null;
  state: string | null;
  file_number: string | null;
  email: string | null;
  contact_number: string | null;
  uhid: string;
};

// A simple spinner for loading state
const LoadingSpinner = () => (
  <div className="flex justify-center items-center h-full">
    <div className="animate-spin rounded-full h-16 w-16 border-t-2 border-b-2 border-sky-500"></div>
  </div>
);

const DetailItem = ({
  icon,
  label,
  value,
}: {
  icon: ReactElement<{ className?: string }>;
  label: string;
  value: string | null | undefined;
}) => (
  <div>
    <label className="block text-sm font-medium text-slate-500 mb-1">
      {label}
    </label>
    <div className="relative">
      <span className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
        {React.cloneElement(icon, {
          className: 'h-5 w-5 text-slate-400',
        })}
      </span>
      <div className="w-full min-h-[42px] flex items-center rounded-xl border border-slate-200 bg-slate-50 pl-10 pr-3 py-2.5 text-slate-800 font-medium text-sm">
        {value || <span className="text-slate-400 italic">—</span>}
      </div>
    </div>
  </div>
);


export default function Consultation() {
  const { appointmentId } = useParams<{ appointmentId: string }>();
  const navigate = useNavigate();

  const [appointment, setAppointment] = useState<AppointmentDetails | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [currentStep, setCurrentStep] = useState(1);
  const [isSaving, setIsSaving] = useState(false);
  const [consultationData, setConsultationData] = useState<ConsultationRow | null>(null);
  const [consultationId, setConsultationId] = useState<string | null>(null);
  const [isMedicalModalOpen, setIsMedicalModalOpen] = useState(false);
  const [isPatientModalOpen, setIsPatientModalOpen] = useState(false);
  const [patient, setPatient] = useState<PatientClinicRow | null>(null);
  const [patientLoading, setPatientLoading] = useState(false);

  const [appointmentNotes, setAppointmentNotes] = useState('');
  const [isSavingAppointmentNotes, setIsSavingAppointmentNotes] = useState(false);
  const [appointmentNotesError, setAppointmentNotesError] = useState<string | null>(null);
  const [appointmentNotesSaved, setAppointmentNotesSaved] = useState(false);
const [selectedMedicalHistory, setSelectedMedicalHistory] = useState<string[]>([]);
const [isSavingHistory, setIsSavingHistory] = useState(false);
const [isPrevSessionModalOpen, setIsPrevSessionModalOpen] = useState(false);
const [prevConsultation, setPrevConsultation] = useState<
  Partial<ConsultationRow> | null
>(null);
const [loadingPrev, setLoadingPrev] = useState(false);
const loadPreviousConsultation = async () => {
  if (!appointment?.follow_up_for_consultation_id) return;

  setLoadingPrev(true);
  try {
    const response = await getConsultationById(appointment.follow_up_for_consultation_id);
    
    if (response.data && response.data.success && response.data.data) {
      const consultation = response.data.data;
      setPrevConsultation({
        chief_complaints: consultation.chief_complaints,
        on_examination: consultation.on_examination,
        advice: consultation.advice,
        notes: consultation.notes,
      });
      setIsPrevSessionModalOpen(true);
    }
  } catch (e: any) {
    console.error("Failed to load previous consultation:", e.message);
  } finally {
    setLoadingPrev(false);
  }
};



useEffect(() => {
  if (consultationData?.medical_history) {
    setSelectedMedicalHistory(consultationData.medical_history);
  } else {
    // Optional: If you want to auto-select all items from appointment by default:
    // setSelectedMedicalHistory(appointment?.medical_conditions || []);
    setSelectedMedicalHistory([]); 
  }
}, [consultationData]);


const handleSaveMedicalHistory = async () => {
  if (!consultationId) return;
  setIsSavingHistory(true);

  try {
    const response = await updateConsultation(consultationId, {
      medical_history: selectedMedicalHistory
    });
    
    if (response.data && response.data.success) {
      // Update local state to reflect the change
      setConsultationData(prev => 
        prev ? { ...prev, medical_history: selectedMedicalHistory } : prev
      );
      
      // Optional: Close modal on success
      // setIsMedicalModalOpen(false); 
      
      // Or show a success toast (omitted for brevity)
    }
  } catch (e: any) {
    console.error('Failed to save medical history:', e.message);
  } finally {
    setIsSavingHistory(false);
  }
};

const toggleMedicalCondition = (condition: string) => {
  setSelectedMedicalHistory(prev => 
    prev.includes(condition)
      ? prev.filter(c => c !== condition) // Uncheck
      : [...prev, condition] // Check
  );
};

  useEffect(() => {
    async function fetchAppointmentAndConsultation() {
      if (!appointmentId) {
        setError('No appointment ID provided.');
        setLoading(false);
        return;
      }

      setLoading(true);
      try {
        // 1. Fetch the Appointment from MongoDB via API
        const appointmentResponse = await getAppointmentById(appointmentId);

        if (!appointmentResponse.data || !appointmentResponse.data.success) {
          throw new Error('Failed to fetch appointment');
        }

        const apptData = appointmentResponse.data.data;
        if (!apptData) {
          setError('Appointment not found.');
          setLoading(false);
          return;
        }
        // Normalize appointment object to always include `id` (uses `_id` from MongoDB when needed)
        const normalizedAppt = {
          ...apptData,
          id: apptData.id || apptData._id || apptData.appointment_uid,
        };
        setAppointment(normalizedAppt as unknown as AppointmentDetails);
        setAppointmentNotes(apptData.notes ?? '');
        setAppointmentNotesSaved(false);
        setAppointmentNotesError(null);

        // ---------------------------------------------------------
        // 1b. Fetch patient details from MongoDB via API
        // ---------------------------------------------------------
        setPatientLoading(true);

        try {
          const patientResponse = await get(`/api/patients/${apptData.patient_id}`);
          
          if (patientResponse.data && patientResponse.data.success) {
            const patientData = patientResponse.data.data;
            if (patientData) {
              const flatPatient = {
                id: patientData._id || patientData.id,
                patient_id: patientData._id || patientData.id,
                clinic_id: apptData.clinic_id,
                file_number: patientData.file_number || null,
                full_name: patientData.full_name,
                date_of_birth: patientData.date_of_birth,
                gender: patientData.gender,
                address: patientData.address,
                city: patientData.city,
                state: patientData.state,
                contact_number: patientData.contact_number,
                email: patientData.email,
                uhid: patientData.uhid,
              };

              setPatient(flatPatient as unknown as PatientClinicRow);
            }
          } else {
            console.warn('Failed to fetch patient details');
          }
        } catch (error) {
          console.warn('Error fetching patient details:', error);
        }
        setPatientLoading(false);

        // ---------------------------------------------------------
        // 2. GET or CREATE the consultation (Using MongoDB API)
        // ---------------------------------------------------------
        
        try {
          const response = await getOrCreateConsultation(normalizedAppt.id, {
            clinic_id: normalizedAppt.clinic_id,
            patient_id: normalizedAppt.patient_id,
            doctor_id: normalizedAppt.doctor_id,
          });

          if (response.data && response.data.success && response.data.data) {
            const activeConsultation = response.data.data;
            // Map MongoDB _id to id for compatibility
            const mappedConsultation = {
              ...activeConsultation,
              id: activeConsultation.id || activeConsultation._id,
            };
            setConsultationData(mappedConsultation as ConsultationRow);
            setConsultationId(mappedConsultation.id);
          }
        } catch (consultationError: any) {
          console.error('Failed to get or create consultation:', consultationError);
          // Don't throw - allow page to load even if consultation creation fails
        }

      } catch (e: any) {
        console.error('Failed to fetch or create consultation:', e);
        setError('An error occurred while fetching details.');
      } finally {
        setLoading(false);
      }
    }

    fetchAppointmentAndConsultation();
  }, [appointmentId]);

  const handleSaveAppointmentNotes = async () => {
  if (!appointmentId) return;

  setIsSavingAppointmentNotes(true);
  setAppointmentNotesError(null);
  setAppointmentNotesSaved(false);

  try {
    const trimmed = appointmentNotes.trim();

    const { error } = await supabase
      .from('appointments')
      .update({
        notes: trimmed === '' ? null : trimmed,
      })
      .eq('id', appointmentId);

    if (error) throw error;

    // keep local appointment in sync
    setAppointment(prev =>
      prev ? { ...prev, notes: trimmed === '' ? null : trimmed } : prev,
    );

    setAppointmentNotesSaved(true);
  } catch (e: any) {
    console.error('Failed to save appointment notes:', e);
    setAppointmentNotesError(
      e?.message ?? 'Failed to save notes. Please try again.',
    );
  } finally {
    setIsSavingAppointmentNotes(false);
  }
};


  const handleSaveClinicalExamination = async (
    data: ClinicalExaminationData,
  ) => {
    if (!consultationId) return;
    setIsSaving(true);
    const updates = {
      chief_complaints: data.chiefComplaints || null,
      on_examination: data.onExamination || null,
      advice: data.advice || null,
      notes: data.notes || null,
    };

    try {
      const response = await updateConsultation(consultationId, updates);
      if (response.data && response.data.success && response.data.data) {
        const updatedConsultation = response.data.data;
        const mappedConsultation = {
          ...updatedConsultation,
          id: updatedConsultation.id || updatedConsultation._id,
        };
        setConsultationData(mappedConsultation as ConsultationRow);
        setCurrentStep(2);
      }
    } catch (e: any) {
      console.error('Failed to save clinical examination:', e.message);
    } finally {
      setIsSaving(false);
    }
  };

  const handleSaveProcedure = async () => {
    if (!consultationId) return;
    setIsSaving(true);
    try {
      // Refresh consultation data from MongoDB
      const response = await getConsultationById(consultationId);
      if (response.data && response.data.success && response.data.data) {
        const fresh = response.data.data;
        const mappedConsultation = {
          ...fresh,
          id: fresh.id || fresh._id,
        };
        setConsultationData(mappedConsultation as ConsultationRow);
        setCurrentStep(3);
      }
    } finally {
      setIsSaving(false);
    }
  };

  const handleSavePrescription = async (data: PrescriptionRow[]) => {
    if (!consultationId || !consultationData?.clinic_id) return;
    setIsSaving(true);
    try {
      // 1. Delete all existing prescriptions for this consultation
      await prescriptionAPI.deleteByConsultation(consultationId);
      // 2. Prepare valid rows for saving
      const validRows = data
        .filter((row) => row.medicineName && row.medicineName.trim() !== '')
        .map((row) => ({
          consultation_id: consultationId,
          clinic_id: consultationData.clinic_id,
          medicine_name: row.medicineName.trim(),
          times: row.times,
          quantity: row.quantity,
          days: row.days,
          note: row.note,
        }));
      if (validRows.length > 0) {
        await prescriptionAPI.saveForConsultation(consultationId, validRows);
      }
      // Move to next step (Billing)
      setCurrentStep(4);
    } catch (e: any) {
      console.error('Failed to save prescription:', e.message);
      // Optionally: show error message
    } finally {
      setIsSaving(false);
    }
  };

  const handleSaveBilling = async (data: BillingData) => {
    if (
      !consultationId ||
      !consultationData?.clinic_id ||
      !consultationData?.patient_id
    ) {
      console.error('Missing critical data for billing.');
      return;
    }
    setIsSaving(true);
    try {
      // Update consultation billing data via MongoDB API
      const updateResponse = await updateConsultation(consultationId, {
        consultation_fee: data.consultationFee ?? 0,
        other_amount: data.otherAmount ?? 0,
        discount: data.discount ?? 0,
        previous_outstanding_balance: data.previousOutstandingBalance ?? 0,
      });
      
      if (updateResponse.data && updateResponse.data.success) {
        // Payments still handled via Supabase (separate table)
        if ((data.paid ?? 0) > 0) {
          const { error: paymentError } = await supabase.from('payments').insert({
            consultation_id: consultationId,
            clinic_id: consultationData.clinic_id,
            patient_id: consultationData.patient_id,
            amount: data.paid,
            payment_mode: data.modeOfPayment,
            reference: data.paymentReference || null,
          });
          if (paymentError) throw paymentError;
        }

        // Refresh consultation data
        const freshResponse = await getConsultationById(consultationId);
        if (freshResponse.data && freshResponse.data.success && freshResponse.data.data) {
          const fresh = freshResponse.data.data;
          const mappedConsultation = {
            ...fresh,
            id: fresh.id || fresh._id,
          };
          setConsultationData(mappedConsultation as ConsultationRow);
        }
        setCurrentStep(5);
      }
    } catch (e: any) {
      console.error('Failed to save billing:', e.message);
    } finally {
      setIsSaving(false);
    }
  };

  const handleCompleteConsultation = async (data: FollowUpData) => {
  if (!consultationId || !consultationData || !appointment) {
    console.error('Missing data to complete consultation.');
    return;
  }

  setIsSaving(true);

  try {
    // 1️⃣ Mark the consultation itself as completed via MongoDB API
    const statusResponse = await updateConsultation(consultationId, { 
      status: 'Completed' 
    });
    
    if (!statusResponse.data || !statusResponse.data.success) {
      throw new Error('Failed to update consultation status');
    }

    // 2️⃣ Mark the *appointment* as completed
    const { error: appointmentStatusError } = await supabase
      .from('appointments')
      .update({ status: 'completed' }) // <- matches StatusBadge + DB enum
      .eq('id', appointment.id);

    if (appointmentStatusError) throw appointmentStatusError;

    // Optional but nice: keep local state in sync so if you ever stay
    // on this page or show status, it's correct in memory too
    setAppointment((prev) =>
      prev ? { ...prev, status: 'completed' } : prev
    );

    // 3️⃣ Create follow-up appointment if user picked a date
    if (data.followUpDate) {
      const { error: followUpError } = await supabase
        .from('appointments')
        .insert({
          clinic_id: consultationData.clinic_id,
          patient_id: consultationData.patient_id,
          doctor_id: consultationData.doctor_id,
          full_name: appointment.full_name,
          appointment_date: data.followUpDate,
          appointment_time: data.followUpTime || '09:00:00',
          status: 'scheduled',
          follow_up_for_consultation_id: consultationId,
        });

      if (followUpError) throw followUpError;
    }

    // 4️⃣ Done → go back to dashboard
    navigate('/appointments');
  } catch (e: any) {
    console.error('Failed to complete consultation:', e.message);
  } finally {
    setIsSaving(false);
  }
};


  const formatDate = (d: string | null | undefined) => {
    if (!d) return '—';
    try {
      return new Date(d).toLocaleDateString();
    } catch {
      return String(d);
    }
  };

  const renderStepContent = () => {
    if (!consultationData || !consultationId) {
      return <LoadingSpinner />;
    }
    switch (currentStep) {
      case 1: {
        const initialExamData = {
          chiefComplaints: consultationData.chief_complaints || '',
          onExamination: consultationData.on_examination || '',
          advice: consultationData.advice || '',
          notes: consultationData.notes || '',
        };
        return (
          <ClinicalExamination
            onSaveAndContinue={handleSaveClinicalExamination}
            isSaving={isSaving}
            initialData={initialExamData}
            consultationId={consultationId}
            clinicId={consultationData.clinic_id}
          />
        );
      }
      case 2:
        return (
          <Procedure
            onSaveAndContinue={handleSaveProcedure}
            isSaving={isSaving}
            consultationId={consultationId}
          />
        );
      case 3:
        return (
          <Prescription
            onSaveAndContinue={handleSavePrescription}
            isSaving={isSaving}
            consultationId={consultationId}
            clinicId={consultationData.clinic_id}
          />
        );
      case 4:
        return (
          <Billing
            onSaveAndContinue={handleSaveBilling}
            isSaving={isSaving}
            consultationData={consultationData}
          />
        );
      case 5:
        return (
          <FollowUp
  onComplete={handleCompleteConsultation}
  isSaving={isSaving}
  doctorId={consultationData.doctor_id ?? ''}
  clinicId={consultationData.clinic_id}
/>
        );
      default:
        return null;
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <LoadingSpinner />
      </div>
    );
  }

  if (error || !appointment) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
        <div className="text-center bg-white p-8 rounded-2xl shadow-md">
          <h2 className="text-xl font-semibold text-red-600">
            {error ? 'An Error Occurred' : 'Appointment Not Found'}
          </h2>
          <p className="text-slate-600 mt-2">
            {error || 'The requested appointment could not be located.'}
          </p>
        </div>
      </div>
    );
  }

  const getAge = (dob: string | null) => {
  if (!dob) return '—';
  const birth = new Date(dob);
  const today = new Date();
  let age = today.getFullYear() - birth.getFullYear();
  const m = today.getMonth() - birth.getMonth();
  if (m < 0 || (m === 0 && today.getDate() < birth.getDate())) {
    age--;
  }
  return age;
};


return (
  <div className="min-h-screen bg-slate-100 p-4 sm:p-6 lg:p-8">
    <div className="max-w-7xl mx-auto space-y-6">
      {/* Page Header */}
      <div className="bg-white p-4 rounded-2xl shadow-sm border border-slate-200">
        <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
          
          {/* --- LEFT SIDE: Info & History --- */}
          <div className="flex-1"> {/* Added flex-1 to utilize available space */}
            <h1 className="text-2xl font-bold text-slate-800">
              Consultation: {appointment.appointment_uid}
            </h1>
            
            <div className="mt-1 flex flex-wrap items-center gap-y-2 gap-x-3">
              <p className="text-slate-600 whitespace-nowrap">
Patient: <span className="font-semibold">
  {appointment.full_name} 
  {patient?.date_of_birth ? ` (${getAge(patient.date_of_birth)} yrs)` : ''}
</span>
              </p>

              {/* --- NEW SECTION: Display Checked Medical History --- */}
              {selectedMedicalHistory && selectedMedicalHistory.length > 0 && (
                <>
                  <span className="hidden sm:inline text-slate-300">|</span>
                  <div className="flex flex-wrap gap-2">
                    {selectedMedicalHistory.map((condition) => (
                      <span
                        key={condition}
                        className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-rose-50 text-rose-700 border border-rose-200"
                      >
                        {condition}
                      </span>
                    ))}
                  </div>
                </>
              )}
            </div>
          </div>

          {/* --- RIGHT SIDE: Buttons (Unchanged) --- */}
          <div className="flex items-center gap-3">
            {appointment.follow_up_for_consultation_id && (
    <button
      type="button"
      onClick={loadPreviousConsultation}
      className="inline-flex items-center justify-center gap-2 px-4 py-2.5 text-sm font-medium rounded-xl border border-slate-300 text-slate-700 hover:bg-slate-50 active:bg-slate-100 transition-all w-full sm:w-auto"
    >
      Previous Session
    </button>
  )}
            <button
              type="button"
              onClick={() => setIsMedicalModalOpen(true)}
              className="inline-flex items-center justify-center gap-2 px-4 py-2.5 text-sm font-medium rounded-xl border border-slate-300 text-slate-700 hover:bg-slate-50 active:bg-slate-100 transition-all w-full sm:w-auto"
            >
              <IconClipboardList className="h-5 w-5" />
              Medical History
            </button>
            <button
              type="button"
              onClick={() => setIsPatientModalOpen(true)}
              className="inline-flex items-center justify-center gap-2 px-4 py-2.5 text-sm font-medium rounded-xl bg-sky-600 text-white hover:bg-sky-700 active:bg-sky-800 shadow-sm transition-all w-full sm:w-auto"
            >
              <IconUser className="h-5 w-5" />
              Patient Details
            </button>
          </div>
        </div>
      </div>
      <Modal
  isOpen={isMedicalModalOpen}
  onClose={() => setIsMedicalModalOpen(false)}
  title={`Medical History — APPOINTMENT ID: ${appointment.appointment_uid ?? 'N/A'}`}
>
  <div className="space-y-6">
    
    {/* 1. Verify Patient Conditions Section */}
    <div>
      <h3 className="text-sm font-semibold text-slate-800 mb-3">
        Highlight the medical conditions by checking boxes-
      </h3>
      
      {Array.isArray(appointment.medical_conditions) && appointment.medical_conditions.length > 0 ? (
        <div className="bg-slate-50 p-4 rounded-xl border border-slate-200">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {appointment.medical_conditions.map((cond: string, idx: number) => {
              const isChecked = selectedMedicalHistory.includes(cond);
              return (
                <label 
                  key={`${cond}-${idx}`} 
                  className={`flex items-center gap-3 p-2 rounded-lg border cursor-pointer transition-all ${
                    isChecked 
                      ? 'bg-sky-50 border-sky-200' 
                      : 'bg-white border-slate-200 hover:border-slate-300'
                  }`}
                >
                  <input
                    type="checkbox"
                    className="w-4 h-4 text-sky-600 rounded focus:ring-sky-500 border-gray-300"
                    checked={isChecked}
                    onChange={() => toggleMedicalCondition(cond)}
                  />
                  <span className={`text-sm ${isChecked ? 'text-sky-800 font-medium' : 'text-slate-700'}`}>
                    {cond}
                  </span>
                </label>
              );
            })}
          </div>
          
          <div className="mt-4 flex justify-end">
            <button
              type="button"
              onClick={handleSaveMedicalHistory}
              disabled={isSavingHistory}
              className="text-xs font-medium text-white bg-slate-700 hover:bg-slate-800 px-3 py-2 rounded-lg transition-colors disabled:opacity-50"
            >
              {isSavingHistory ? 'Saving...' : 'Check & Save'}
            </button>
          </div>
        </div>
      ) : (
        <p className="text-sm text-slate-500 italic">
          No medical conditions reported by patient during booking.
        </p>
      )}
    </div>

    {/* 2. Patient Note (Read-Only) */}
    {/* Only show if the note exists and is not an empty string */}
    {appointment.patient_note && (
      <div>
        <h3 className="text-sm font-semibold text-slate-800 mb-2">
          Patient's Note
        </h3>
        <div className="bg-amber-50 p-4 rounded-xl border border-amber-100 text-slate-700 text-sm whitespace-pre-wrap">
          {appointment.patient_note}
        </div>
      </div>
    )}

    {/* Divider */}
    <div className="border-t border-slate-200" />

    {/* 3. Appointment Notes (Doctor's Editable Notes) */}
    <div>
      <label className="block text-sm font-semibold text-slate-800 mb-2">
        Notes for this appointment
      </label>
      <textarea
        value={appointmentNotes}
        onChange={(e) => {
          setAppointmentNotes(e.target.value);
          if (appointmentNotesError) setAppointmentNotesError(null);
          if (appointmentNotesSaved) setAppointmentNotesSaved(false);
        }}
        rows={3}
        placeholder="Add or update simple notes for this appointment..."
        className="w-full py-3 px-4 text-sm text-slate-900 bg-slate-50 border-2 border-slate-200 rounded-xl outline-none focus:ring-4 focus:ring-sky-500/20 focus:border-sky-500 transition-all placeholder:text-slate-400"
      />

      <div className="mt-3 flex items-center justify-between gap-3">
        <div className="text-sm">
          {appointmentNotesError && (
            <span className="text-red-600">{appointmentNotesError}</span>
          )}
          {appointmentNotesSaved && !appointmentNotesError && (
            <span className="text-emerald-600">Notes saved.</span>
          )}
        </div>
        <button
          type="button"
          onClick={handleSaveAppointmentNotes}
          disabled={isSavingAppointmentNotes}
          className="inline-flex items-center justify-center gap-2 px-4 py-2.5 text-sm font-semibold rounded-xl bg-sky-600 text-white hover:bg-sky-700 active:bg-sky-800 shadow-sm transition-all disabled:opacity-60 disabled:cursor-not-allowed"
        >
          {isSavingAppointmentNotes ? 'Saving…' : 'Save Notes'}
        </button>
      </div>
    </div>
  </div>
</Modal>
{/* ⭐ Previous Consultation Modal */}
<Modal
  isOpen={isPrevSessionModalOpen}
  onClose={() => setIsPrevSessionModalOpen(false)}
  title="Previous Consultation Details"
>
  {loadingPrev ? (
    <LoadingSpinner />
  ) : prevConsultation ? (
    <div className="space-y-4">

      <div>
        <h3 className="font-semibold text-slate-800 mb-1">Chief Complaints</h3>
        <p className="text-slate-700 whitespace-pre-wrap">
          {prevConsultation.chief_complaints || "—"}
        </p>
      </div>

      <div>
        <h3 className="font-semibold text-slate-800 mb-1">On Examination</h3>
        <p className="text-slate-700 whitespace-pre-wrap">
          {prevConsultation.on_examination || "—"}
        </p>
      </div>

      <div>
        <h3 className="font-semibold text-slate-800 mb-1">Advice</h3>
        <p className="text-slate-700 whitespace-pre-wrap">
          {prevConsultation.advice || "—"}
        </p>
      </div>

      <div>
        <h3 className="font-semibold text-slate-800 mb-1">Notes</h3>
        <p className="text-slate-700 whitespace-pre-wrap">
          {prevConsultation.notes || "—"}
        </p>
      </div>

    </div>
  ) : (
    <p className="text-sm text-slate-600">No previous consultation found.</p>
  )}
</Modal>


        {/* Patient Details Modal */}
        <Modal
          isOpen={isPatientModalOpen}
          onClose={() => setIsPatientModalOpen(false)}
          title="Patient Details"
        >
          {patientLoading ? (
            <LoadingSpinner />
          ) : patient ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <DetailItem
                icon={<IconUser />}
                label="Full Name"
                value={patient.full_name}
              />
              <DetailItem icon={<IconId />} label="UHID" value={patient.uhid} />
              <DetailItem
                icon={<IconCalendar />}
                label="Date of Birth"
                value={formatDate(patient.date_of_birth)}
              />
              <DetailItem
                icon={<IconGenderIntergender />}
                label="Gender"
                value={patient.gender}
              />
              <DetailItem
                icon={<IconPhone />}
                label="Contact"
                value={patient.contact_number}
              />
              <DetailItem
                icon={<IconMail />}
                label="Email"
                value={patient.email}
              />
              <div className="sm:col-span-2">
                <DetailItem
                  icon={<IconMapPin />}
                  label="Address"
                  value={patient.address}
                />
              </div>
              <DetailItem
                icon={<IconMapPin />}
                label="City"
                value={patient.city}
              />
              <DetailItem
                icon={<IconMapPin />}
                label="State"
                value={patient.state}
              />
              <div className="sm:col-span-2">
                <DetailItem
                  icon={<IconFileDescription />}
                  label="File Number"
                  value={patient.file_number}
                />
              </div>
            </div>
          ) : (
            <p className="text-sm text-slate-600">
              Patient details could not be loaded.
            </p>
          )}
        </Modal>

        {/* Progress Bar */}
        <ProgressBar
  currentStep={currentStep}
  onStepChange={setCurrentStep} // <-- This is the only line I added
/>

        {/* Step Content */}
        <div className="mt-6">{renderStepContent()}</div>
      </div>
    </div>
  );
}