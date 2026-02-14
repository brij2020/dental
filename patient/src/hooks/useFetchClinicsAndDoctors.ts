import { useState, useEffect } from 'react';
import { api } from '@/lib/apiClient';
import { useProfile } from './useProfile';

export interface Doctor {
  id: string;
  _id?: string;
  full_name: string;
  name?: string;
  email: string;
  specialty?: string;
  specialization?: string[];
  role: string;
  clinic_id: string;
  availability: {
    [key: string]: {
      morning?: { start: string; end: string; is_off: boolean };
      evening?: { start: string; end: string; is_off: boolean };
    };
  };
  slot_duration_minutes: number;
  status: string;
  profile_pic?: string;
  leave?: Array<{ day: string; date: string }>;
}

export interface Clinic {
  id: string;
  _id?: string;
  clinic_id: string;
  name: string;
  address?: {
    street?: string;
    city?: string;
    state?: string;
    postal_code?: string;
  };
  contact_number?: string;
  location?: {
    latitude?: number;
    longitude?: number;
  };
  admin_staff_name?: string;
  status?: string;
}

export interface AppointmentHistory {
  _id?: string;
  id?: string;
  appointment_uid?: string;
  patient_id: string;
  doctor_id: string;
  clinic_id: string;
  appointment_date: string;
  appointment_time: string;
  status: 'scheduled' | 'confirmed' | 'completed' | 'cancelled';
  doctor_snapshot?: {
    full_name: string;
    email: string;
    profile_pic?: string;
    specialization?: string[];
  };
  clinic_snapshot?: {
    name: string;
    address?: string;
  };
  notes?: string;
  created_at?: string;
  updated_at?: string;
}

interface UseFetchClinicsAndDoctorsReturn {
  clinics: Clinic[];
  doctors: Doctor[];
  patientHistory: AppointmentHistory[];
  loading: boolean;
  error: Error | null;
  fetchClinics: () => Promise<void>;
  fetchDoctorsByClinic: (clinicId: string) => Promise<void>;
  fetchPatientHistory: (doctorId: string) => Promise<void>;
}

export function useFetchClinicsAndDoctors(): UseFetchClinicsAndDoctorsReturn {
  const { profile, user } = useProfile();
  const [clinics, setClinics] = useState<Clinic[]>([]);
  const [doctors, setDoctors] = useState<Doctor[]>([]);
  const [patientHistory, setPatientHistory] = useState<AppointmentHistory[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const normalizeToArray = <T,>(payload: unknown): T[] => {
    if (Array.isArray(payload)) return payload as T[];
    if (payload && typeof payload === "object" && Array.isArray((payload as { data?: unknown }).data)) {
      return (payload as { data: T[] }).data;
    }
    return [];
  };

  // Fetch all clinics
  const fetchClinics = async () => {
    try {
      setLoading(true);
      setError(null);
      console.log('📋 Fetching clinics...');

      const response = await api.get('/api/clinics');

      if (response.success && 'data' in response) {
        console.log('✅ Clinics fetched:', response.data);
        setClinics(normalizeToArray<Clinic>(response.data));
      } else {
        const errorMsg = 'error' in response ? response.error : 'Failed to fetch clinics';
        throw new Error(errorMsg);
      }
    } catch (err) {
      const error = err instanceof Error ? err : new Error('Failed to fetch clinics');
      console.error('❌ Error fetching clinics:', error);
      setError(error);
    } finally {
      setLoading(false);
    }
  };

  // Fetch doctors for a specific clinic
  const fetchDoctorsByClinic = async (clinicId: string) => {
    try {
      setLoading(true);
      setError(null);
      console.log('👨‍⚕️ Fetching doctors for clinic:', clinicId);

      const response = await api.get(`/api/profile/clinic/${clinicId}`);

      if (response.success && 'data' in response) {
        console.log('✅ Doctors fetched:', response.data);
        setDoctors(normalizeToArray<Doctor>(response.data));
      } else {
        const errorMsg = 'error' in response ? response.error : 'Failed to fetch doctors';
        throw new Error(errorMsg);
      }
    } catch (err) {
      const error = err instanceof Error ? err : new Error('Failed to fetch doctors');
      console.error('❌ Error fetching doctors:', error);
      setError(error);
      setDoctors([]); // Clear doctors on error
    } finally {
      setLoading(false);
    }
  };

  // Fetch patient history with a specific doctor
  const fetchPatientHistory = async (doctorId: string) => {
    try {
      const patientId = profile?.patient_id || user?.patient_id;
      
      console.log('📞 Fetching patient history:', { patientId, doctorId });

      if (!patientId) {
        throw new Error('Patient ID not found');
      }

      setLoading(true);
      setError(null);

      const response = await api.get(
        `/api/appointments/patient-history/${patientId}`,
        {
          params: { doctorId }
        }
      );

      if (response.success && 'data' in response) {
        console.log('✅ Patient history fetched:', response.data);
        setPatientHistory(normalizeToArray<AppointmentHistory>(response.data));
      } else {
        const errorMsg = 'error' in response ? response.error : 'Failed to fetch patient history';
        throw new Error(errorMsg);
      }
    } catch (err) {
      const error = err instanceof Error ? err : new Error('Failed to fetch patient history');
      console.error('❌ Error fetching patient history:', error);
      setError(error);
      setPatientHistory([]); // Clear history on error
    } finally {
      setLoading(false);
    }
  };

  // Fetch clinics on component mount
  useEffect(() => {
    fetchClinics();
  }, []);
  

  return {
    clinics,
    doctors,
    patientHistory,
    loading,
    error,
    fetchClinics,
    fetchDoctorsByClinic,
    fetchPatientHistory
  };
}

export type { UseFetchClinicsAndDoctorsReturn };
