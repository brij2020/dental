import { useState } from 'react';
import { api } from '@/lib/apiClient';
import { toast } from 'react-toastify';

export interface ReschedulePayload {
  appointment_date: string; // YYYY-MM-DD
  appointment_time: string; // HH:MM
  patient_note?: string;
}

export interface RescheduleResponse {
  success: boolean;
  data?: any;
  message?: string;
  error?: string;
}

export const useRescheduleAppointment = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const reschedule = async (
    appointmentId: string,
    payload: ReschedulePayload
  ): Promise<RescheduleResponse> => {
    try {
      setLoading(true);
      setError(null);

      if (!appointmentId || appointmentId.trim() === '') {
        throw new Error('Appointment ID is required');
      }

      if (!payload.appointment_date || !payload.appointment_time) {
        throw new Error('New date and time are required');
      }

      // Validate date format (YYYY-MM-DD)
      const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
      if (!dateRegex.test(payload.appointment_date)) {
        throw new Error('Invalid date format. Expected YYYY-MM-DD');
      }

      // Validate time format (HH:MM)
      const timeRegex = /^\d{2}:\d{2}$/;
      if (!timeRegex.test(payload.appointment_time)) {
        throw new Error('Invalid time format. Expected HH:MM');
      }

      console.log('📅 Rescheduling appointment:', {
        id: appointmentId,
        newDate: payload.appointment_date,
        newTime: payload.appointment_time,
      });

      const response = await api.put(
        `/api/appointments/${appointmentId}`,
        {
          appointment_date: payload.appointment_date,
          appointment_time: payload.appointment_time,
          ...(payload.patient_note && { patient_note: payload.patient_note }),
        }
      );

      console.log('✅ Reschedule response:', response);

      if ((response as any)?.data?.success || (response as any)?.success) {
        toast.success('Appointment rescheduled successfully');
        return {
          success: true,
          data: (response as any)?.data?.data || (response as any)?.data,
          message: (response as any)?.data?.message || 'Appointment rescheduled successfully',
        };
      } else {
        const errorMsg = (response as any)?.data?.message || 'Failed to reschedule appointment';
        throw new Error(errorMsg);
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'An error occurred while rescheduling';
      setError(errorMessage);
      toast.error(errorMessage);
      console.error('❌ Reschedule error:', err);

      return {
        success: false,
        error: errorMessage,
      };
    } finally {
      setLoading(false);
    }
  };

  return {
    loading,
    error,
    reschedule,
  };
};

export default useRescheduleAppointment;
