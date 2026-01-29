import React, { useState } from 'react';
import { api } from '@/lib/apiClient';
import { toast } from 'react-toastify';
import type { Appointment } from './types';

interface CancelModalProps {
  setOpenModal: React.Dispatch<React.SetStateAction<boolean>>;
  appointment?: Appointment;
  onSuccess?: () => void;
}

const CancelModal: React.FC<CancelModalProps> = ({ setOpenModal, appointment }) => {
  const [loading, setLoading] = useState(false);
  const [cancellationReason, setCancellationReason] = useState('');

  const handleCancelAppointment = async () => {
    if (!appointment?.id && !appointment?._id) {
      toast.error('Appointment ID is missing');
      return;
    }

    try {
      setLoading(true);

      const appointmentId = appointment.id || appointment._id || '';

      console.log('🗑️ Cancelling appointment:', appointmentId);

      const response = await api.put(`/api/appointments/${appointmentId}`, {
        status: 'cancelled',
        cancellation_reason: cancellationReason || 'Cancelled by patient',
      });

      console.log('✅ Cancel response:', response);

      if (response?.data?.success) {
        toast.success('Appointment cancelled successfully');
        setOpenModal(false);
        if (typeof onSuccess === 'function') {
          onSuccess();
        } else {
          window.dispatchEvent(new Event('appointments:refetch'));
        }
      } else {
        const errorMsg = response?.data?.message || 'Failed to cancel appointment';
        toast.error(errorMsg);
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'An error occurred while cancelling';
      toast.error(errorMessage);
      console.error('❌ Cancel error:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-4 flex flex-col gap-6 w-[600px] max-w-full">
      <div className="flex flex-col gap-1">
        <h2 className="font-semibold text-lg text-red-600">Cancel Appointment</h2>
        <p className="text-sm text-zinc-500">
          Are you sure you want to cancel this appointment? This action cannot be undone.
        </p>
      </div>

      {/* Current Appointment Info */}
      {appointment && (
        <div className="bg-red-50 border border-red-200 rounded-md p-3">
          <p className="text-xs font-semibold text-red-900 mb-2">Appointment Details</p>
          <div className="flex items-center gap-4 text-sm text-red-800">
            <div className="flex items-center gap-1">
              <span className="material-symbols-sharp text-base">calendar_today</span>
              <span>{appointment.appointment_date}</span>
            </div>
            <div className="flex items-center gap-1">
              <span className="material-symbols-sharp text-base">schedule</span>
              <span>{appointment.appointment_time}</span>
            </div>
            {appointment.clinics?.name && (
              <div className="flex items-center gap-1">
                <span className="material-symbols-sharp text-base">home_health</span>
                <span>{appointment.clinics.name}</span>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Cancellation Reason */}
      <div className="flex flex-col gap-2">
        <label className="text-sm font-semibold text-zinc-700">
          Reason for Cancellation (Optional)
        </label>
        <textarea
          value={cancellationReason}
          onChange={(e) => setCancellationReason(e.target.value)}
          placeholder="Please let us know why you're cancelling this appointment..."
          className="border border-zinc-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-red-500 resize-none"
          rows={3}
        />
      </div>

      {/* Action Buttons */}
      <div className="flex items-center gap-3 pt-4 border-t border-zinc-200">
        <button
          onClick={() => setOpenModal(false)}
          disabled={loading}
          className="bg-zinc-500 hover:bg-zinc-400 disabled:bg-zinc-300 text-white text-sm px-4 py-2 min-w-[100px] cursor-pointer rounded-md transition-colors"
        >
          Keep Appointment
        </button>
        <button
          onClick={handleCancelAppointment}
          disabled={loading}
          className="bg-red-600 hover:bg-red-700 disabled:bg-red-400 text-white text-sm px-4 py-2 min-w-[100px] cursor-pointer rounded-md transition-colors flex items-center justify-center gap-2"
        >
          {loading ? (
            <>
              <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
              <span>Cancelling...</span>
            </>
          ) : (
            <>
              <span className="material-symbols-sharp text-base">delete</span>
              <span>Cancel Appointment</span>
            </>
          )}
        </button>
      </div>
    </div>
  );
};

export default CancelModal;