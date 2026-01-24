import { useState, useCallback } from 'react';
import api from '@/lib/apiClient';
import { useProfile } from './useProfile';

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

interface UseFetchDoctorHistoryReturn {
  history: AppointmentHistory[];
  loading: boolean;
  error: Error | null;
  fetchDoctorHistory: (doctorId: string) => Promise<void>;
}

export const useFetchDoctorHistory = (): UseFetchDoctorHistoryReturn => {
  const { profile, user } = useProfile();
  const [history, setHistory] = useState<AppointmentHistory[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const fetchDoctorHistory = useCallback(
    async (doctorId: string) => {
      // Get patient_id from profile or user session
      const patientId = profile?.patient_id || user?.patient_id;
      
      console.log('📞 Fetching doctor history:', { patientId, doctorId });

      if (!patientId) {
        const errorMsg = 'Patient ID not found in profile or session';
        setError(new Error(errorMsg));
        console.error('❌', errorMsg, { profile, user });
        return;
      }

      setLoading(true);
      setError(null);
      
      try {
        console.log(`🔗 API Call: GET /api/appointments/patient-history/${patientId}?doctorId=${doctorId}`);
        
        const response = await api.get(
          `/api/appointments/patient-history/${patientId}`,
          {
            params: { doctorId },
          }
        );

        console.log('✅ Doctor history response:', response.data);

        if (response.data?.success) {
          setHistory(response.data.data || []);
          console.log('📊 History updated:', response.data.data?.length || 0, 'appointments');
        } else {
          const errorMsg = response.data?.message || 'Failed to fetch history';
          setError(new Error(errorMsg));
          console.error('❌ API Error:', errorMsg);
        }
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : 'Failed to fetch appointment history';
        setError(new Error(errorMessage));
        console.error('❌ Error fetching doctor history:', err);
      } finally {
        setLoading(false);
      }
    },
    [profile?.patient_id, user?.patient_id]
  );

  return {
    history,
    loading,
    error,
    fetchDoctorHistory,
  };
};
