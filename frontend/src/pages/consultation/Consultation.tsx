// src/features/consultation/Consultation.tsx
import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { supabase } from '../../lib/supabaseClient.ts';
import {
  getOrCreateConsultation,
  updateConsultation,
  getConsultationById,
  getAppointmentById,
  get,
  getProfileById,
  bookAppointmentAPI,
  getTreatmentProceduresByConsultationId,
} from '../../lib/apiClient';
import { format } from 'date-fns';
import { prescriptionAPI } from '../../lib/prescriptionAPI';
import type { AppointmentDetails } from '../appointments/types';
import ProgressBar from './components/ProgressBar';
import ClinicalExamination from './components/ClinicalExamination';
import Procedure from './components/Procedure';
import PostProcedure, { type PostProcedureData } from './components/PostProcedure';
import Prescription from './components/Prescription';
import Billing from './components/Billing';
import type { ClinicalExaminationData } from './components/ClinicalExamination';
import type { PrescriptionRow } from './components/Prescription';
import type { BillingData } from './components/Billing';
import type { FollowUpData } from './components/FollowUp';
import FollowUp from './components/FollowUp';
import type { ConsultationRow } from './types';
import type { TreatmentProcedureRow } from './types';
import { Modal } from '../../components/Modal';
import PatientDetailModal from './PatientDetailModal';
// --- UPDATED: Imports for icons ---
import { IconUser, IconClipboardList, IconArrowLeft } from '@tabler/icons-react';

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

type ConsultationDraft = {
  currentStep?: number;
  consultationId?: string | null;
  consultationData?: Partial<ConsultationRow> | null;
  procedures?: TreatmentProcedureRow[] | null;
  followUpDate?: string | null;
  followUpTime?: string | null;
  savedAt?: string;
};

// A simple spinner for loading state
const LoadingSpinner = () => (
  <div className="flex justify-center items-center h-full">
    <div className="animate-spin rounded-full h-16 w-16 border-t-2 border-b-2 border-sky-500"></div>
  </div>
);

// DetailItem moved to PatientDetailModal; keep consultation file lean


export default function Consultation() {
  const { appointmentId } = useParams<{ appointmentId: string }>();
  const navigate = useNavigate();
  const draftStorageKey = appointmentId ? `consultation:draft:${appointmentId}` : null;

  const [appointment, setAppointment] = useState<AppointmentDetails | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [currentStep, setCurrentStep] = useState(1);
  const [isSaving, setIsSaving] = useState(false);
  const [consultationData, setConsultationData] = useState<ConsultationRow | null>(null);
  const [consultationId, setConsultationId] = useState<string | null>(null);
  const [isMedicalModalOpen, setIsMedicalModalOpen] = useState(false);
  const [isPatientModalOpen, setIsPatientModalOpen] = useState(false);
  const [isFollowUpModalOpen, setIsFollowUpModalOpen] = useState(false);
  const [isPreviewModalOpen, setIsPreviewModalOpen] = useState(false);
  const [prescriptions, setPrescriptions] = useState<any[] | null>(null);
  const [procedures, setProcedures] = useState<TreatmentProcedureRow[] | null>(null);
  const [payments, setPayments] = useState<any[] | null>(null);
  const [previewLoading, setPreviewLoading] = useState(false);
  const [followUpSelection, setFollowUpSelection] = useState<FollowUpData>({ followUpDate: null, followUpTime: '' });
  // Track if a procedure was just saved so preview can refresh
  const [procedureJustSaved, setProcedureJustSaved] = useState(false);

  useEffect(() => {
    if (!isPreviewModalOpen || !consultationId) return;
    let mounted = true;
    (async () => {
      setPreviewLoading(true);
      try {
        // Prescriptions
        try {
          const rx = await prescriptionAPI.getByConsultation(consultationId);
          if (mounted) setPrescriptions(Array.isArray(rx) ? rx : (rx?.data || rx));
        } catch (rxErr) {
          console.warn('Failed to load prescriptions for preview:', rxErr);
          if (mounted) setPrescriptions([]);
        }

        // Procedures
        try {
        const procResp = await getTreatmentProceduresByConsultationId(consultationId);
        const procData = procResp?.data?.data || procResp?.data || procResp;
        if (mounted) setProcedures(Array.isArray(procData) ? procData : (procData ? [procData] : []));
        } catch (procErr) {
          console.warn('Failed to load procedures for preview:', procErr);
          if (mounted) setProcedures([]);
        }

        // Payments — stored in Supabase table `payments`
        try {
          const { data: pays, error: paysErr } = await supabase
            .from('payments')
            .select('*')
            .eq('consultation_id', consultationId)
            .order('created_at', { ascending: false });
          if (paysErr) throw paysErr;
          if (mounted) setPayments(pays || []);
        } catch (payErr) {
          console.warn('Failed to load payments for preview:', payErr);
          if (mounted) setPayments([]);
        }
      } finally {
        if (mounted) setPreviewLoading(false);
        // Reset the flag after refresh
        setProcedureJustSaved(false);
      }
    })();
    return () => {
      mounted = false;
    };
  }, [isPreviewModalOpen, consultationId, procedureJustSaved]);
  const [resolvedDoctorProfileId, setResolvedDoctorProfileId] = useState<string | null>(null);
  const [patient, setPatient] = useState<PatientClinicRow | null>(null);
  const [patientLoading, setPatientLoading] = useState(false);

  useEffect(() => {
    if (isPatientModalOpen) console.debug('Opening Patient modal; patient:', patient, 'loading:', patientLoading);
  }, [isPatientModalOpen, patient, patientLoading]);

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

  const extractApiErrorMessage = (err: any, fallback: string) => {
    const apiMessage =
      err?.response?.data?.message ||
      err?.response?.data?.error ||
      err?.message;
    if (typeof apiMessage === 'string' && apiMessage.trim().length > 0) {
      return apiMessage;
    }
    return fallback;
  };

  const readDraft = (): ConsultationDraft | null => {
    if (!draftStorageKey || typeof window === 'undefined') return null;
    try {
      const raw = window.localStorage.getItem(draftStorageKey);
      if (!raw) return null;
      return JSON.parse(raw) as ConsultationDraft;
    } catch {
      return null;
    }
  };

  const saveDraft = (patch: Partial<ConsultationDraft>) => {
    if (!draftStorageKey || typeof window === 'undefined') return;
    try {
      const prev = readDraft() || {};
      const next: ConsultationDraft = {
        ...prev,
        ...patch,
        savedAt: new Date().toISOString(),
      };
      window.localStorage.setItem(draftStorageKey, JSON.stringify(next));
    } catch {
      // Non-blocking: draft persistence should never break consultation flow.
    }
  };

  const clearDraft = () => {
    if (!draftStorageKey || typeof window === 'undefined') return;
    try {
      window.localStorage.removeItem(draftStorageKey);
    } catch {
      // ignore
    }
  };

  useEffect(() => {
    const draft = readDraft();
    const step = Number(draft?.currentStep || 1);
    if (step >= 1 && step <= 6) {
      setCurrentStep(step);
    }
    if (draft?.followUpDate) {
      const parsedDate = new Date(draft.followUpDate);
      setFollowUpSelection({
        followUpDate: Number.isNaN(parsedDate.getTime()) ? null : parsedDate,
        followUpTime: draft.followUpTime || '',
      });
    }
  }, [draftStorageKey]);

  const handleFollowUpSelectionChange = (data: FollowUpData) => {
    setFollowUpSelection(data);
    saveDraft({
      followUpDate: data.followUpDate ? format(data.followUpDate, 'yyyy-MM-dd') : null,
      followUpTime: data.followUpTime || null,
    });
  };

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
        const nextConsultationData = consultationData
          ? ({ ...consultationData, medical_history: selectedMedicalHistory } as Partial<ConsultationRow>)
          : ({ medical_history: selectedMedicalHistory } as Partial<ConsultationRow>);
        // Update local state to reflect the change
        setConsultationData(prev =>
          prev ? { ...prev, medical_history: selectedMedicalHistory } : prev
        );
        saveDraft({
          consultationId,
          currentStep,
          consultationData: nextConsultationData,
          procedures: procedures || undefined,
        });

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
      setError(null);
      try {
        // 1. Fetch the Appointment from MongoDB via API
        const appointmentResponse = await getAppointmentById(appointmentId);
        const responseData = appointmentResponse?.data;
        if (responseData?.success === false) {
          throw new Error(responseData?.message || 'Failed to fetch appointment');
        }
        const apptData =
          responseData?.data && typeof responseData.data === 'object'
            ? responseData.data
            : (responseData && typeof responseData === 'object' ? responseData : null);

        if (!apptData || !apptData.patient_id) {
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

              console.debug('Consultation: fetched patient', flatPatient);
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
            const draft = readDraft();
            const shouldApplyDraft =
              !draft?.consultationId || String(draft.consultationId) === String(mappedConsultation.id);
            const mergedConsultation = shouldApplyDraft && draft?.consultationData
              ? { ...mappedConsultation, ...draft.consultationData }
              : mappedConsultation;

            setConsultationData(mergedConsultation as ConsultationRow);
            setConsultationId(mappedConsultation.id);

            if (draft?.currentStep && draft.currentStep >= 1 && draft.currentStep <= 6) {
              setCurrentStep(draft.currentStep);
            }
          }
        } catch (consultationError: any) {
          console.error('Failed to get or create consultation:', consultationError);
          // Don't throw - allow page to load even if consultation creation fails
        }

        // Attempt to resolve a Supabase profile id for the doctor so FollowUp can query slots
        (async () => {
          try {
            const possible = (
              consultationData?.doctor_id ||
              apptData?.doctor_id ||
              (apptData as any)?.doctor?.profile_id ||
              (apptData as any)?.doctor_profile_id ||
              null
            );

            if (possible) {
              // If it already looks like a Supabase profile id (string), use it directly
              setResolvedDoctorProfileId(String(possible));
              return;
            }

            // As a fallback, try fetching backend profile by the doctor reference (if present)
            if (apptData?.doctor_id) {
              try {
                const profResp = await getProfileById(String(apptData.doctor_id));
                const profPayload = profResp?.data?.data || profResp?.data || profResp;
                const candidate = profPayload?.profile_id || profPayload?.supabase_id || profPayload?.id || null;
                if (candidate) setResolvedDoctorProfileId(String(candidate));
              } catch (e) {
                // ignore; leave resolvedDoctorProfileId null
              }
            }
          } catch (e) {
            // ignore
          }
        })();

      } catch (e: any) {
        console.error('Failed to fetch or create consultation:', e);
        setError(extractApiErrorMessage(e, 'An error occurred while fetching details.'));
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


  const handleProcedureCreatedFromExam = (
    entries: TreatmentProcedureRow | TreatmentProcedureRow[],
  ) => {
    const newEntries = Array.isArray(entries) ? entries : [entries];
    setProcedures((prev) => (prev ? [...newEntries, ...prev] : [...newEntries]));
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
        saveDraft({
          currentStep: 2,
          consultationId,
          consultationData: mappedConsultation as Partial<ConsultationRow>,
        });
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
        saveDraft({
          currentStep: 3,
          consultationId,
          consultationData: mappedConsultation as Partial<ConsultationRow>,
        });
      }
      // Refresh procedures list after save
      try {
        const procResp = await getTreatmentProceduresByConsultationId(consultationId);
        const procData = procResp?.data?.data || procResp?.data || procResp;
        setProcedures(Array.isArray(procData) ? procData : (procData ? [procData] : []));
        // Mark that a procedure was just saved so preview modal can refresh if open
        setProcedureJustSaved(true);
      } catch (procErr) {
        setProcedures([]);
      }
    } finally {
      setIsSaving(false);
    }
  };

  const handleSavePostProcedure = async (data: PostProcedureData[]) => {
    if (!consultationId) return;
    setIsSaving(true);
    try {
      const normalizedItems = (data || []).map((item) => ({
        diagnosed_tooth_no: item.diagnosedToothNo || null,
        diagnosed_procedure: item.diagnosedProcedure || null,
        status: item.status || 'Scheduled',
        instruction: item.instruction || null,
      }));

      const primaryItem = normalizedItems[0] || {
        diagnosed_tooth_no: null,
        diagnosed_procedure: null,
        status: 'Scheduled',
        instruction: null,
      };

      await updateConsultation(consultationId, {
        post_procedure: primaryItem,
        post_procedure_items: normalizedItems,
      });

      const freshResponse = await getConsultationById(consultationId);
      if (freshResponse.data && freshResponse.data.success && freshResponse.data.data) {
        const fresh = freshResponse.data.data;
        const mappedConsultation = {
          ...fresh,
          id: fresh.id || fresh._id,
        };
        setConsultationData(mappedConsultation as ConsultationRow);
        saveDraft({
          currentStep: 4,
          consultationId,
          consultationData: mappedConsultation as Partial<ConsultationRow>,
        });
      }
      setCurrentStep(4);
    } catch (e: any) {
      console.error('Failed to save post procedure:', e.message);
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
      setCurrentStep(5);
      saveDraft({
        currentStep: 5,
        consultationId,
      });
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
          saveDraft({
            currentStep: 6,
            consultationId,
            consultationData: mappedConsultation as Partial<ConsultationRow>,
          });
        }
        setCurrentStep(6);
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
      const selectedFollowUpDate = data.followUpDate ? format(data.followUpDate, 'yyyy-MM-dd') : null;
      const selectedFollowUpTime = data.followUpDate ? (data.followUpTime ? data.followUpTime : '09:00') : null;

      // 1️⃣ Mark the consultation itself as completed via MongoDB API
      const statusResponse = await updateConsultation(consultationId, {
        status: 'Completed',
        follow_up_date: selectedFollowUpDate,
        follow_up_time: selectedFollowUpTime,
      });
      if (!statusResponse.data || !statusResponse.data.success) {
        console.error('Failed to update consultation status');
      } else if (statusResponse.data.data) {
        const updated = statusResponse.data.data;
        setConsultationData((prev) => ({
          ...(prev || {}),
          ...(updated || {}),
          id: updated.id || updated._id || prev?.id || '',
        } as ConsultationRow));
      }

      // 2️⃣ Mark the *appointment* as completed
      try {
        const { error: appointmentStatusError } = await supabase
          .from('appointments')
          .update({ status: 'completed' })
          .eq('id', appointment.id);
        if (appointmentStatusError) {
          console.warn('Failed to update appointment status in Supabase:', appointmentStatusError);
        } else {
          setAppointment((prev) => prev ? { ...prev, status: 'completed' } : prev);
        }
      } catch (supErr) {
        console.warn('Supabase update error (non-fatal):', supErr);
      }

      // Optional but nice: keep local state in sync so if you ever stay
      // on this page or show status, it's correct in memory too
      setAppointment((prev) =>
        prev ? { ...prev, status: 'completed' } : prev
      );

      // 3️⃣ Create follow-up appointment via backend API if user picked a date
      if (data.followUpDate) {
        const existingFileNumber =
          patient?.file_number ||
          (consultationData as any)?.file_number ||
          (appointment as any)?.file_number ||
          null;
        const existingPatientId =
          consultationData?.patient_id ||
          appointment?.patient_id ||
          (appointment as any)?.patient?.id ||
          null;
        const existingUhid =
          patient?.uhid ||
          (appointment as any)?.uhid ||
          null;

        const payload = {
          clinic_id: consultationData.clinic_id,
          patient_id: existingPatientId,
          file_number: existingFileNumber,
          uhid: existingUhid,
          doctor_id:
            consultationData.doctor_id ||
            (appointment as any)?.doctor_id ||
            (appointment as any)?.doctor?.profile_id ||
            (appointment as any)?.doctor?.id ||
            null,
          doctor_name:
            (appointment as any)?.doctor_name ||
            (appointment as any)?.doctor?.full_name ||
            (appointment as any)?.doctor?.name ||
            null,
          full_name: appointment.full_name,
          appointment_date: selectedFollowUpDate,
          // backend expects HH:mm (no seconds)
          appointment_time: selectedFollowUpTime,
          status: 'scheduled',
          follow_up_for_consultation_id: consultationId,
        };

        try {
          const resp = await bookAppointmentAPI(payload);
          if (!resp?.data?.success) {
            console.warn('Failed to create follow-up appointment via API:', resp?.data || resp);
          }
        } catch (apiErr) {
          console.warn('Failed to create follow-up appointment via API (non-fatal):', apiErr);
        }
      }

      // 4️⃣ Done → go back to dashboard
      clearDraft();
      navigate('/appointments');
    } catch (e: any) {
      console.error('Failed to complete consultation:', e.message);
    } finally {
      setIsSaving(false);
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
            procedures={procedures || []}
            onProcedureCreated={handleProcedureCreatedFromExam}
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
          <PostProcedure
            onSaveAndContinue={handleSavePostProcedure}
            isSaving={isSaving}
            procedures={procedures || []}
            initialData={
              consultationData?.post_procedure_items && consultationData.post_procedure_items.length > 0
                ? consultationData.post_procedure_items.map((item) => ({
                    diagnosedToothNo: item?.diagnosed_tooth_no || '',
                    diagnosedProcedure: item?.diagnosed_procedure || '',
                    status: item?.status || 'Scheduled',
                    instruction: item?.instruction || '',
                  }))
                : consultationData?.post_procedure?.diagnosed_tooth_no
                  ? [
                      {
                        diagnosedToothNo: consultationData.post_procedure.diagnosed_tooth_no || '',
                        diagnosedProcedure: consultationData.post_procedure.diagnosed_procedure || '',
                        status: consultationData.post_procedure.status || 'Scheduled',
                        instruction: consultationData.post_procedure.instruction || '',
                      },
                    ]
                  : []
            }
          />
        );
      case 4:
        return (
          <Prescription
            onSaveAndContinue={handleSavePrescription}
            isSaving={isSaving}
            consultationId={consultationId}
            clinicId={consultationData.clinic_id}
          />
        );
      case 5:
        return (
          <Billing
            onSaveAndContinue={handleSaveBilling}
            isSaving={isSaving}
            consultationData={consultationData}
            procedureAmountOverride={(procedures || []).reduce(
              (sum, item) => sum + Number(item?.cost || 0),
              0,
            )}
          />
        );
      case 6:
        return (
          (() => {
            const followUpDoctorId = resolvedDoctorProfileId || (
              consultationData?.doctor_id ||
              (appointment as any)?.doctor_id ||
              (appointment as any)?.doctor?.profile_id ||
              (appointment as any)?.doctor?.id ||
              (appointment as any)?.doctor_profile_id ||
              ''
            );
            console.debug('Consultation: Step-6 FollowUp using doctorId', followUpDoctorId, { consultationData, appointment, resolvedDoctorProfileId });

            return (
              <div>
                {!followUpDoctorId && (
                  <p className="text-sm text-amber-600 mb-3">Doctor identifier not found for follow-up scheduling — receptionist may need to pick a doctor.</p>
                )}
                <FollowUp
                  onComplete={handleCompleteConsultation}
                  onSelectionChange={handleFollowUpSelectionChange}
                  isSaving={isSaving}
                  doctorId={followUpDoctorId}
                />
              </div>
            );
          })()
        );
      default:
        return null;
    }
  };

  useEffect(() => {
    if (!consultationId) return;
    saveDraft({
      consultationId,
      currentStep,
      consultationData: consultationData || undefined,
      procedures: procedures || undefined,
    });
  }, [consultationId, currentStep, consultationData, procedures]);

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <LoadingSpinner />
      </div>
    );
  }

  const previewFollowUpDate = followUpSelection.followUpDate
    ? format(followUpSelection.followUpDate, 'yyyy-MM-dd')
    : consultationData?.follow_up_date || (appointment as any)?.follow_up_date || '-';
  const previewFollowUpTime = followUpSelection.followUpDate
    ? (followUpSelection.followUpTime || '-')
    : consultationData?.follow_up_time || appointment?.appointment_time || '-';

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

  const handlePrintPreview = () => {
    const source = document.getElementById('consultation-preview');
    if (!source) return;

    const body = document.body;
    const className = 'print-consultation';
    const printRootId = 'consultation-print-root';
    const existingRoot = document.getElementById(printRootId);
    if (existingRoot) {
      existingRoot.remove();
    }

    const printRoot = document.createElement('div');
    printRoot.id = printRootId;
    printRoot.innerHTML = source.innerHTML;
    body.appendChild(printRoot);
    body.classList.add(className);

    let cleaned = false;
    const cleanup = () => {
      if (cleaned) return;
      cleaned = true;
      body.classList.remove(className);
      const root = document.getElementById(printRootId);
      if (root) root.remove();
      window.removeEventListener('afterprint', cleanup);
    };

    window.addEventListener('afterprint', cleanup);
    window.print();
    setTimeout(cleanup, 1200);
  };

  const handleGoBackStep = () => {
    if (currentStep <= 1) return;
    const prevStep = Math.max(1, currentStep - 1);
    setCurrentStep(prevStep);
    saveDraft({
      currentStep: prevStep,
      consultationId,
      consultationData: consultationData || undefined,
    });
  };


  return (
    <div className="min-h-screen bg-slate-100 p-4 sm:p-6 lg:p-8">
      <style>
        {`
          @media print {
            @page {
              size: A4 portrait;
              margin: 8mm;
            }
            body.print-consultation > * {
              visibility: hidden !important;
            }
            body.print-consultation #consultation-print-root,
            body.print-consultation #consultation-print-root * {
              visibility: visible !important;
            }
            body.print-consultation #consultation-print-root {
              position: fixed !important;
              inset: 0 !important;
              width: 100% !important;
              height: auto !important;
              overflow: visible !important;
              margin: 0 !important;
              padding: 8mm !important;
              background: #ffffff !important;
            }
            body.print-consultation #consultation-print-root .rx-page {
              box-shadow: none !important;
              border: 1px solid #cbd5e1 !important;
              border-radius: 0 !important;
              margin: 0 !important;
              width: 100% !important;
              max-width: none !important;
              page-break-inside: avoid;
              break-inside: avoid;
            }
            body.print-consultation #consultation-print-root .rx-page:not(:last-child) {
              page-break-after: always;
              break-after: page;
            }
            body.print-consultation #consultation-print-root .rx-page:last-child {
              page-break-after: auto;
              break-after: auto;
            }
          }
        `}
      </style>
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Page Header */}
        <div className="bg-white p-4 rounded-2xl shadow-sm border border-slate-200">
          <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">

            {/* --- LEFT SIDE: Info & History --- */}
            <div className="flex-1"> {/* Added flex-1 to utilize available space */}
              <h1 className="text-2xl font-bold text-slate-800">
                Consultation: {appointment.file_number ?? appointment.appointment_uid}
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
              <button
                type="button"
                onClick={() => navigate(`/consultation/${appointment.id || appointmentId}/preview`)}
                className="inline-flex items-center justify-center gap-2 px-4 py-2.5 text-sm font-medium rounded-xl border border-slate-300 text-slate-700 hover:bg-slate-50 active:bg-slate-100 transition-all w-full sm:w-auto"
              >
                Preview
              </button>
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
                onClick={() => {
                  console.debug('Consultation: Patient Details button clicked', { appointment, patient });
                  setIsPatientModalOpen(true);
                }}
                className="inline-flex items-center justify-center gap-2 px-4 py-2.5 text-sm font-medium rounded-xl bg-sky-600 text-white hover:bg-sky-700 active:bg-sky-800 shadow-sm transition-all w-full sm:w-auto"
              >
                <IconUser className="h-5 w-5" />
                Patient Details
              </button>
            </div>
          </div>
        </div>

        <Modal
          isOpen={isFollowUpModalOpen}
          onClose={() => setIsFollowUpModalOpen(false)}
          title="Schedule Follow-up"
        >
          {(() => {
            // Try several places for a plausible doctor id (Supabase profiles id expected)
              const followUpDoctorId = resolvedDoctorProfileId || (
                consultationData?.doctor_id ||
                (appointment as any)?.doctor_id ||
                // sometimes doctor is embedded
                (appointment as any)?.doctor?.id ||
                (appointment as any)?.doctor?.profile_id ||
                (appointment as any)?.doctor_profile_id ||
                ''
              );
            console.debug('Consultation: FollowUp modal using doctorId', followUpDoctorId, { appointment, resolvedDoctorProfileId });

            return (
              <FollowUp
                onComplete={(data) => {
                  setFollowUpSelection(data);
                  setIsFollowUpModalOpen(false);
                  handleCompleteConsultation(data);
                }}
                onSelectionChange={setFollowUpSelection}
                isSaving={isSaving}
                doctorId={followUpDoctorId}
              />
            );
          })()}
        </Modal>
        {/* Preview Modal */}
        <Modal
          isOpen={isPreviewModalOpen}
          onClose={() => setIsPreviewModalOpen(false)}
          title="Preview — Full Consultation"
          panelClassName="w-[96vw] max-w-[120rem] h-[98vh] mx-1 p-3 sm:p-5"
          contentClassName="pr-0"
        >
          <div className="space-y-4 h-full">
            <div id="consultation-preview" className="max-w-none">
              {(() => {
                const procedureList = Array.isArray(procedures) ? procedures : [];
                const prescriptionList = Array.isArray(prescriptions) ? prescriptions : [];
                const paymentCount = Array.isArray(payments) ? payments.length : 0;

                const patientName = patient?.full_name || appointment?.full_name || '-';
                const doctorName =
                  (appointment as any)?.doctor_name ||
                  (appointment as any)?.doctor?.full_name ||
                  (appointment as any)?.doctor?.name ||
                  '-';
                const issueDateRaw = appointment?.appointment_date
                  ? new Date(appointment.appointment_date)
                  : null;
                const issueDate =
                  issueDateRaw && !Number.isNaN(issueDateRaw.getTime())
                    ? format(issueDateRaw, 'dd/MM/yyyy')
                    : '-';
                const medicalHistory = Array.isArray(consultationData?.medical_history)
                  ? consultationData.medical_history
                  : [];
                const clinicName =
                  (appointment as any)?.clinic_name ||
                  (appointment as any)?.clinic?.name ||
                  'Clinic Name';
                const pdfLogoUrl = `${window.location.origin}/src/assets/spai.jpeg`;

                return (
                  <div className="space-y-5">
                    <article className="rx-page mx-auto w-full max-w-[850px] border border-slate-400 bg-white text-slate-800">
                      <div className="border-b border-slate-400 p-3 text-[11px] text-slate-600">Page 1 / 3</div>
                      <div className="grid grid-cols-1 border-b border-slate-400 sm:grid-cols-2">
                        <div className="border-b border-slate-400 p-4 sm:border-b-0 sm:border-r">
                          <div className="flex items-center gap-3">
                            <img
                              src={pdfLogoUrl}
                              alt="Clinic logo"
                              className="h-12 w-12 rounded-md border border-slate-200 object-contain p-1"
                              onError={(e) => {
                                (e.currentTarget as HTMLImageElement).style.display = 'none';
                              }}
                            />
                            <div className="text-sm font-semibold text-slate-900">{clinicName}</div>
                          </div>
                        </div>
                        <div className="p-4 text-sm">
                          <div className="grid grid-cols-[90px_1fr] gap-y-1">
                            <div className="text-slate-500">Dr. Name</div><div className="font-medium">{doctorName}</div>
                            <div className="text-slate-500">Reg. No.</div><div>-</div>
                            <div className="text-slate-500">Address</div><div>{clinicName}</div>
                          </div>
                        </div>
                      </div>

                      <div className="border-b border-slate-400 p-4 text-sm">
                        <div className="mb-2 text-xs font-semibold uppercase tracking-wide text-slate-600">Patient Information</div>
                        <div className="grid grid-cols-1 gap-2 sm:grid-cols-3">
                          <div className="rounded border border-slate-300 px-2 py-1"><span className="text-slate-500">Name:</span> <span className="font-medium">{patientName}</span></div>
                          <div className="rounded border border-slate-300 px-2 py-1"><span className="text-slate-500">Date:</span> <span className="font-medium">{issueDate}</span></div>
                          <div className="rounded border border-slate-300 px-2 py-1"><span className="text-slate-500">Age:</span> <span className="font-medium">{getAge(patient?.date_of_birth || null)}</span></div>
                        </div>
                      </div>

                      <div className="grid grid-cols-1 border-b border-slate-400 sm:grid-cols-[1fr_260px]">
                        <div className="border-b border-slate-400 p-4 sm:border-b-0 sm:border-r">
                          <div className="mb-2 text-xs font-semibold uppercase tracking-wide text-slate-600">Chief Complaint</div>
                          <div className="min-h-20 rounded border border-slate-300 bg-slate-50 px-3 py-2 text-sm whitespace-pre-wrap">
                            {consultationData?.chief_complaints || '-'}
                          </div>
                          <div className="mt-3 mb-2 text-xs font-semibold uppercase tracking-wide text-slate-600">Medical History</div>
                          <div className="min-h-20 rounded border border-slate-300 bg-slate-50 px-3 py-2 text-sm">
                            {medicalHistory.length > 0 ? medicalHistory.join(', ') : '-'}
                          </div>
                        </div>
                        <div className="p-4">
                          <div className="mb-2 text-xs font-semibold uppercase tracking-wide text-slate-600">Dental Chart Overview</div>
                          <div className="min-h-44 rounded border border-slate-300 bg-white p-3">
                            <div className="text-xs text-slate-500">Affected teeth</div>
                            <div className="mt-2 flex flex-wrap gap-1">
                              {procedureList.length > 0 ? (
                                procedureList.map((p: any) => (
                                  <span key={`tooth-${p.id || p._id}`} className="rounded bg-amber-100 px-2 py-0.5 text-xs font-medium text-amber-800">
                                    {p.tooth_number}
                                  </span>
                                ))
                              ) : (
                                <span className="text-sm text-slate-500">No procedures added</span>
                              )}
                            </div>
                          </div>
                        </div>
                      </div>

                      <div className="space-y-3 border-b border-slate-400 p-4 text-sm">
                        <div>
                          <div className="mb-1 text-xs font-semibold uppercase tracking-wide text-slate-600">Clinical Examination (On Examination)</div>
                          <div className="min-h-14 rounded border border-slate-300 bg-slate-50 px-3 py-2 whitespace-pre-wrap">{consultationData?.on_examination || '-'}</div>
                        </div>
                        <div>
                          <div className="mb-1 text-xs font-semibold uppercase tracking-wide text-slate-600">Diagnosis</div>
                          <div className="min-h-14 rounded border border-slate-300 bg-slate-50 px-3 py-2 whitespace-pre-wrap">{consultationData?.on_examination || '-'}</div>
                        </div>
                        <div>
                          <div className="mb-1 text-xs font-semibold uppercase tracking-wide text-slate-600">Advice</div>
                          <div className="min-h-14 rounded border border-slate-300 bg-slate-50 px-3 py-2 whitespace-pre-wrap">{consultationData?.advice || '-'}</div>
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-3 p-4 text-xs text-slate-500">
                        <div className="rounded border border-slate-300 px-3 py-2">Clinic Stamp</div>
                        <div className="rounded border border-slate-300 px-3 py-2 text-right">Doctor Signature</div>
                      </div>
                    </article>

                    <article className="rx-page mx-auto w-full max-w-[850px] border border-slate-400 bg-white text-slate-800">
                      <div className="border-b border-slate-400 p-3 text-[11px] text-slate-600">Page 2 / 3</div>
                      <div className="grid grid-cols-1 border-b border-slate-400 sm:grid-cols-2">
                        <div className="border-b border-slate-400 p-4 sm:border-b-0 sm:border-r">
                          <div className="flex items-center gap-3">
                            <img
                              src={pdfLogoUrl}
                              alt="Clinic logo"
                              className="h-12 w-12 rounded-md border border-slate-200 object-contain p-1"
                              onError={(e) => {
                                (e.currentTarget as HTMLImageElement).style.display = 'none';
                              }}
                            />
                            <div className="text-sm font-semibold text-slate-900">{clinicName}</div>
                          </div>
                        </div>
                        <div className="p-4 text-sm">
                          <div className="grid grid-cols-[90px_1fr] gap-y-1">
                            <div className="text-slate-500">Dr. Name</div><div className="font-medium">{doctorName}</div>
                            <div className="text-slate-500">Date</div><div>{issueDate}</div>
                            <div className="text-slate-500">Patient</div><div>{patientName}</div>
                          </div>
                        </div>
                      </div>

                      <div className="border-b border-slate-400 p-4">
                        <div className="mb-2 text-xs font-semibold uppercase tracking-wide text-slate-600">Prescribed Medicines Per Day</div>
                        {previewLoading && !prescriptions ? (
                          <p className="text-sm text-slate-500">Loading prescriptions...</p>
                        ) : (
                          <div className="overflow-x-auto border border-slate-300">
                            <table className="min-w-full text-sm">
                              <thead className="bg-sky-100">
                                <tr>
                                  <th className="border border-slate-300 px-2 py-2 text-left text-xs font-semibold text-slate-700">Medicine</th>
                                  <th className="border border-slate-300 px-2 py-2 text-left text-xs font-semibold text-slate-700">Per Day</th>
                                  <th className="border border-slate-300 px-2 py-2 text-left text-xs font-semibold text-slate-700">Quantity</th>
                                  <th className="border border-slate-300 px-2 py-2 text-left text-xs font-semibold text-slate-700">Days</th>
                                  <th className="border border-slate-300 px-2 py-2 text-left text-xs font-semibold text-slate-700">Instructions</th>
                                </tr>
                              </thead>
                              <tbody>
                                {(prescriptionList.length > 0 ? prescriptionList : [{}]).map((rx: any, idx: number) => (
                                  <tr key={rx.id || rx._id || `empty-rx-${idx}`} className="bg-amber-50">
                                    <td className="border border-slate-300 px-2 py-2">{rx.medicine_name || '-'}</td>
                                    <td className="border border-slate-300 px-2 py-2">{rx.times || '-'}</td>
                                    <td className="border border-slate-300 px-2 py-2">{rx.quantity || '-'}</td>
                                    <td className="border border-slate-300 px-2 py-2">{rx.days || '-'}</td>
                                    <td className="border border-slate-300 px-2 py-2">{rx.note || '-'}</td>
                                  </tr>
                                ))}
                              </tbody>
                            </table>
                          </div>
                        )}
                      </div>

                      <div className="border-b border-slate-400 p-4">
                        <div className="mb-2 text-xs font-semibold uppercase tracking-wide text-slate-600">Past / Planned Procedures</div>
                        {previewLoading && !procedures ? (
                          <p className="text-sm text-slate-500">Loading procedures...</p>
                        ) : (
                          <div className="overflow-x-auto border border-slate-300">
                            <table className="min-w-full text-sm">
                              <thead className="bg-amber-100">
                                <tr>
                                  <th className="border border-slate-300 px-2 py-2 text-left text-xs font-semibold text-slate-700">Procedure</th>
                                  <th className="border border-slate-300 px-2 py-2 text-left text-xs font-semibold text-slate-700">Symptoms / Problem</th>
                                </tr>
                              </thead>
                              <tbody>
                                {(procedureList.length > 0 ? procedureList : [{} as any]).map((p: any, idx: number) => (
                                  <tr key={p.id || p._id || `empty-proc-${idx}`} className="bg-yellow-50">
                                    <td className="border border-slate-300 px-2 py-2">{p.solutions?.join?.(', ') || '-'}</td>
                                    <td className="border border-slate-300 px-2 py-2">{p.problems?.join?.(', ') || '-'}</td>
                                  </tr>
                                ))}
                              </tbody>
                            </table>
                          </div>
                        )}
                      </div>

                      <div className="border-b border-slate-400 p-4">
                        <div className="mb-2 text-xs font-semibold uppercase tracking-wide text-slate-600">Post Procedure Status</div>
                        <div className="overflow-x-auto border border-slate-300">
                          <table className="min-w-full text-sm">
                            <thead className="bg-indigo-100">
                              <tr>
                                <th className="border border-slate-300 px-2 py-2 text-left text-xs font-semibold text-slate-700">Tooth No.</th>
                                <th className="border border-slate-300 px-2 py-2 text-left text-xs font-semibold text-slate-700">Procedure Name</th>
                                <th className="border border-slate-300 px-2 py-2 text-left text-xs font-semibold text-slate-700">Status</th>
                                <th className="border border-slate-300 px-2 py-2 text-left text-xs font-semibold text-slate-700">Instruction</th>
                              </tr>
                            </thead>
                            <tbody>
                              {(
                                consultationData?.post_procedure_items && consultationData.post_procedure_items.length > 0
                                  ? consultationData.post_procedure_items
                                  : consultationData?.post_procedure?.diagnosed_tooth_no
                                    ? [consultationData.post_procedure]
                                    : []
                              ).map((item: any, idx: number) => (
                                <tr className="bg-indigo-50" key={`post-procedure-${idx}`}>
                                  <td className="border border-slate-300 px-2 py-2">{item?.diagnosed_tooth_no || '-'}</td>
                                  <td className="border border-slate-300 px-2 py-2">{item?.diagnosed_procedure || '-'}</td>
                                  <td className="border border-slate-300 px-2 py-2">{item?.status || '-'}</td>
                                  <td className="border border-slate-300 px-2 py-2">{item?.instruction || '-'}</td>
                                </tr>
                              ))}
                              {(!consultationData?.post_procedure_items || consultationData.post_procedure_items.length === 0) &&
                                !consultationData?.post_procedure?.diagnosed_tooth_no && (
                                  <tr className="bg-indigo-50">
                                    <td className="border border-slate-300 px-2 py-2" colSpan={4}>-</td>
                                  </tr>
                                )}
                            </tbody>
                          </table>
                        </div>
                      </div>

                      <div className="p-4">
                        <div className="mb-2 text-xs font-semibold uppercase tracking-wide text-slate-600">Medication Cost Summary</div>
                        <div className="overflow-x-auto border border-slate-300">
                          <table className="min-w-full text-sm">
                            <thead className="bg-emerald-100">
                              <tr>
                                <th className="border border-slate-300 px-2 py-2 text-left text-xs font-semibold text-slate-700">Medication Name</th>
                                <th className="border border-slate-300 px-2 py-2 text-left text-xs font-semibold text-slate-700">Type</th>
                                <th className="border border-slate-300 px-2 py-2 text-left text-xs font-semibold text-slate-700">Quantity</th>
                                <th className="border border-slate-300 px-2 py-2 text-left text-xs font-semibold text-slate-700">Cost</th>
                              </tr>
                            </thead>
                            <tbody>
                              {(prescriptionList.length > 0 ? prescriptionList : [{}]).map((rx: any, idx: number) => (
                                <tr key={rx.id || rx._id || `sum-rx-${idx}`} className="bg-emerald-50">
                                  <td className="border border-slate-300 px-2 py-2">{rx.medicine_name || '-'}</td>
                                  <td className="border border-slate-300 px-2 py-2">Medicine</td>
                                  <td className="border border-slate-300 px-2 py-2">{rx.quantity || '-'}</td>
                                  <td className="border border-slate-300 px-2 py-2">-</td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      </div>
                    </article>

                    <article className="rx-page mx-auto w-full max-w-[850px] border border-slate-400 bg-white text-slate-800">
                      <div className="border-b border-slate-400 p-3 text-[11px] text-slate-600">Page 3 / 3</div>
                      <div className="grid grid-cols-1 border-b border-slate-400 sm:grid-cols-2">
                        <div className="border-b border-slate-400 p-4 sm:border-b-0 sm:border-r">
                          <div className="flex items-center gap-3">
                            <img
                              src={pdfLogoUrl}
                              alt="Clinic logo"
                              className="h-12 w-12 rounded-md border border-slate-200 object-contain p-1"
                              onError={(e) => {
                                (e.currentTarget as HTMLImageElement).style.display = 'none';
                              }}
                            />
                            <div className="text-sm font-semibold text-slate-900">{clinicName}</div>
                          </div>
                        </div>
                        <div className="p-4 text-sm">
                          <div className="grid grid-cols-[100px_1fr] gap-y-1">
                            <div className="text-slate-500">Dr. Name</div><div className="font-medium">{doctorName}</div>
                            <div className="text-slate-500">Address</div><div>{clinicName}</div>
                            <div className="text-slate-500">File Number</div><div>{patient?.file_number || '-'}</div>
                          </div>
                        </div>
                      </div>

                      <div className="border-b border-slate-400 p-4">
                        <div className="mb-2 text-xs font-semibold uppercase tracking-wide text-slate-600">Advice</div>
                        <div className="min-h-48 rounded border border-slate-300 bg-slate-50 px-3 py-2 text-sm whitespace-pre-wrap">
                          {consultationData?.advice || '-'}
                        </div>
                      </div>

                      <div className="grid grid-cols-1 border-b border-slate-400 sm:grid-cols-2">
                        <div className="border-b border-slate-400 p-4 sm:border-b-0 sm:border-r">
                          <div className="grid grid-cols-[120px_1fr] gap-y-1 text-sm">
                            <div className="text-slate-500">Date</div><div>{issueDate}</div>
                            <div className="text-slate-500">Appointment ID</div><div>{appointment?.appointment_uid || appointment?.id || '-'}</div>
                            <div className="text-slate-500">Follow-up Date</div><div>{previewFollowUpDate}</div>
                          </div>
                        </div>
                        <div className="p-4 text-sm">
                          <div className="grid grid-cols-[120px_1fr] gap-y-1">
                            <div className="text-slate-500">Patient Name</div><div>{patientName}</div>
                            <div className="text-slate-500">Contact</div><div>{patient?.contact_number || '-'}</div>
                            <div className="text-slate-500">Time</div><div>{previewFollowUpTime}</div>
                          </div>
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-3 p-4 text-xs text-slate-500">
                        <div className="rounded border border-slate-300 px-3 py-2">Clinic Stamp</div>
                        <div className="rounded border border-slate-300 px-3 py-2 text-right">Doctor Signature</div>
                      </div>
                    </article>

                    <article className="rx-page mx-auto w-full max-w-[850px] border border-slate-400 bg-white text-slate-800">
                      <div className="border-b border-slate-400 p-3 text-[11px] text-slate-600">Consent</div>
                      <div className="grid grid-cols-1 border-b border-slate-400 sm:grid-cols-2">
                        <div className="border-b border-slate-400 p-4 sm:border-b-0 sm:border-r">
                          <div className="flex items-center gap-3">
                            <img
                              src={pdfLogoUrl}
                              alt="Clinic logo"
                              className="h-12 w-12 rounded-md border border-slate-200 object-contain p-1"
                              onError={(e) => {
                                (e.currentTarget as HTMLImageElement).style.display = 'none';
                              }}
                            />
                            <div className="text-sm font-semibold text-slate-900">{clinicName}</div>
                          </div>
                        </div>
                        <div className="p-4 text-sm">
                          <div className="grid grid-cols-[100px_1fr] gap-y-1">
                            <div className="text-slate-500">Dr. Name</div><div className="font-medium">{doctorName}</div>
                            <div className="text-slate-500">Patient</div><div>{patientName}</div>
                            <div className="text-slate-500">Date</div><div>{issueDate}</div>
                          </div>
                        </div>
                      </div>

                      <div className="p-4">
                        <div className="mb-2 text-center text-xs font-semibold uppercase tracking-wide text-slate-600">Consent Form</div>
                        <div className="min-h-56 rounded border border-slate-300 bg-slate-50 px-3 py-2 text-sm leading-6">
                          I hereby confirm that the treatment plan, procedure options, expected outcomes, and potential risks
                          were explained to me. I had the opportunity to ask questions and all my questions were answered
                          satisfactorily. I consent to proceed with the advised treatment and prescription plan.
                        </div>
                        <div className="mt-2 text-right text-xs text-slate-500">
                          Payments recorded for this consultation: {paymentCount}
                        </div>
                      </div>

                      <div className="grid grid-cols-1 gap-3 border-t border-slate-400 p-4 sm:grid-cols-2">
                        <div className="min-h-20 rounded border border-slate-300 px-3 py-2 text-sm">
                          <div className="text-xs font-semibold uppercase tracking-wide text-slate-500">Patient / Guardian Signature</div>
                        </div>
                        <div className="min-h-20 rounded border border-slate-300 px-3 py-2 text-sm text-right">
                          <div className="text-xs font-semibold uppercase tracking-wide text-slate-500">Doctor Signature</div>
                        </div>
                      </div>
                    </article>
                  </div>
                );
              })()}
            </div>

            <div className="flex justify-end gap-3">
              <button
                type="button"
                onClick={handlePrintPreview}
                className="inline-flex items-center justify-center gap-2 px-4 py-2.5 text-sm font-medium rounded-xl bg-sky-600 text-white hover:bg-sky-700"
              >
                Download PDF
              </button>
            </div>
          </div>
        </Modal>
        
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
                          className={`flex items-center gap-3 p-2 rounded-lg border cursor-pointer transition-all ${isChecked
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


        {(() => {
          const modalPatientId = (appointment as any)?.patient_id || (appointment as any)?.patientId || (appointment as any)?._id || (appointment as any)?.patient?.id || (patient as any)?.patient_id || (patient as any)?.id || (patient as any)?._id;
          console.debug('Consultation: Rendering PatientDetailModal with patientId', modalPatientId, { appointmentId: appointment?.id || (appointment as any)?._id, appointment, patient });
          return (
            <PatientDetailModal
              isOpen={isPatientModalOpen}
              onClose={() => setIsPatientModalOpen(false)}
              patient={patient}
              loading={patientLoading}
              patientId={modalPatientId as string}
            />
          );
        })()}

        {/* Progress Bar */}
        <ProgressBar
          currentStep={currentStep}
          onStepChange={setCurrentStep} // <-- This is the only line I added
        />

        {/* Step Content */}
        {currentStep > 1 && (
          <div className="mt-4">
            <button
              type="button"
              onClick={handleGoBackStep}
              className="inline-flex items-center gap-2 rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
            >
              <IconArrowLeft size={16} />
              Back
            </button>
          </div>
        )}
        <div className="mt-6">{renderStepContent()}</div>
      </div>
    </div>
  );
}
