import React, { useState } from 'react';
import { api } from '@/lib/apiClient';
import { toast } from 'react-toastify';
import type { Appointment } from './types';

interface StatusUpdateModalProps {
  appointment: Appointment;
  setOpenModal: React.Dispatch<React.SetStateAction<boolean>>;
  onStatusUpdate?: () => void;
}

const StatusUpdateModal: React.FC<StatusUpdateModalProps> = ({ 
  appointment, 
  setOpenModal, 
  onStatusUpdate 
}) => {
  const [selectedStatus, setSelectedStatus] = useState<string>(appointment?.status || 'completed');
  const [loading, setLoading] = useState(false);

  const statusOptions = [
    { value: 'completed', label: 'Completed', icon: 'check_circle', color: 'text-green-600' },
    { value: 'no-show', label: 'No Show', icon: 'cancel', color: 'text-red-600' },
  ];

  const handleUpdateStatus = async () => {
    if (selectedStatus === appointment?.status) {
      toast.info('Status is already set to ' + selectedStatus);
      setOpenModal(false);
      return;
    }

    setLoading(true);
    try {
      const response: any = await api.put(`/api/appointments/${appointment?.id}`, {
        status: selectedStatus,
      });

      if (response?.success || response?.data) {
        toast.success(`Appointment status updated to ${selectedStatus}`);
        setOpenModal(false);
        onStatusUpdate?.();
      } else {
        toast.error(response?.message || 'Failed to update status');
      }
    } catch (error) {
      console.error('Error updating appointment status:', error);
      toast.error('Failed to update appointment status');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="w-[400px] max-w-full p-4 flex flex-col gap-4">
      <div className="flex flex-col gap-2">
        <h2 className="font-semibold text-lg">Update Appointment Status</h2>
        <p className="text-sm text-gray-600">
          Appointment on {appointment?.appointment_date} at {appointment?.appointment_time}
        </p>
      </div>

      <div className="flex flex-col gap-3">
        <label className="text-sm font-medium text-gray-700">Select Status:</label>
        
        <div className="space-y-2">
          {statusOptions.map((option) => (
            <div
              key={option.value}
              onClick={() => setSelectedStatus(option.value)}
              className={`flex items-center gap-3 p-3 border rounded-lg cursor-pointer transition ${
                selectedStatus === option.value
                  ? 'border-blue-500 bg-blue-50'
                  : 'border-gray-200 bg-white hover:border-gray-300'
              }`}
            >
              <input
                type="radio"
                name="status"
                value={option.value}
                checked={selectedStatus === option.value}
                onChange={() => setSelectedStatus(option.value)}
                className="w-4 h-4"
              />
              <span className={`material-symbols-sharp ${option.color}`}>
                {option.icon}
              </span>
              <label className="text-sm font-medium cursor-pointer flex-1">
                {option.label}
              </label>
            </div>
          ))}
        </div>
      </div>

      <div className="flex gap-3 pt-4">
        <button
          onClick={() => setOpenModal(false)}
          className="flex-1 px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition"
        >
          Cancel
        </button>
        <button
          onClick={handleUpdateStatus}
          disabled={loading}
          className={`flex-1 px-4 py-2 rounded-lg text-white font-medium transition ${
            loading
              ? 'bg-blue-400 cursor-not-allowed'
              : 'bg-blue-600 hover:bg-blue-700 cursor-pointer'
          }`}
        >
          {loading ? 'Updating...' : 'Update Status'}
        </button>
      </div>
    </div>
  );
};

export default StatusUpdateModal;
