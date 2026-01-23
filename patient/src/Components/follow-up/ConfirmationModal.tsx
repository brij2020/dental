import React from 'react';

interface AppointmentData {
  doctor: string;
  clinic: string;
  time: string;
  notes: string;
  files: string[];
}

interface ConfirmationModalProps {
  isOpen: boolean;
  onClose: () => void;
  appointmentData: AppointmentData | null;
}

const ConfirmationModal: React.FC<ConfirmationModalProps> = ({ isOpen, onClose, appointmentData }) => {
  if (!isOpen || !appointmentData) {
    return null;
  }

  return (
   
      <div 
        className="p-4 w-[500px]"
        onClick={e => e.stopPropagation()} // Prevent closing when clicking inside the modal
      >
        {/* Header */}
        <div className="flex justify-between items-center mb-4">
            <h2 className="font-semibold text-lg">
                Follow-Up Request Submitted!
            </h2>
           
        </div>

        {/* Details */}
        <div className="space-y-3 my-6">
            <p className='text-sm'><strong className="font-medium text-gray-600 mr-2">Doctor:</strong> {appointmentData.doctor}</p>
            <p className='text-sm'><strong className="font-medium text-gray-600 mr-2">Clinic:</strong> {appointmentData.clinic}</p>
            <p className='text-sm'><strong className="font-medium text-gray-600 mr-2">Time:</strong> {appointmentData.time}</p>
            {appointmentData.notes && (
                <p className='text-sm'><strong className="font-medium text-gray-600 mr-2">Notes:</strong> Added</p>
            )}
            {appointmentData.files.length > 0 && (
                <p className='text-sm'><strong className="font-medium text-gray-600 mr-2">Files:</strong> {appointmentData.files.length} uploaded</p>
            )}
        </div>

        {/* Footer Message & Button */}
        <div className="border-t pt-4 mt-6 flex flex-col items-center">
            <p className="text-xs text-slate-400 mb-4">You will receive a confirmation email shortly.</p>
            <button
                onClick={onClose}
                className="bg-cyan-800 w-full text-white hover:bg-cyan-700 py-2 px-8 font-medium text-sm rounded-sm"
            >
                OK
            </button>
        </div>
      </div>
  );
};

export default ConfirmationModal;