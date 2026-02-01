import React from 'react';
import type { AppointmentDetails } from '../types';

type Props = {
  isOpen: boolean;
  appointment: AppointmentDetails | null;
  onClose: () => void;
  onProceed: (id: string) => void;
};

export default function ConsentModal({ isOpen, appointment, onClose, onProceed }: Props) {
  const [checked, setChecked] = React.useState(false);

  React.useEffect(() => {
    if (!isOpen) setChecked(false);
  }, [isOpen]);

  if (!isOpen || !appointment) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="fixed inset-0 bg-black/40" onClick={onClose}></div>
      <div className="bg-white rounded-lg shadow-xl w-full max-w-md z-50 p-6">
        <h3 className="text-lg font-semibold mb-2">Confirm Patient Consent</h3>
        <p className="text-sm text-slate-600 mb-4">Before starting the consultation, please confirm the patient has given consent to proceed.</p>
        <div className="mb-4">
          <div className="text-sm font-medium">Patient</div>
          <div className="text-sm text-slate-800">{appointment.full_name}{appointment.file_number ? ` • ${appointment.file_number}` : ''}</div>
          <div className="text-xs text-slate-500 mt-1">Appointment: {appointment.appointment_uid}</div>
        </div>
        <label className="flex items-start gap-3 mb-4">
          <input type="checkbox" className="h-4 w-4 mt-1" checked={checked} onChange={(e) => setChecked(e.target.checked)} />
          <div className="text-sm">Patient verbally consents to proceed with consultation.</div>
        </label>
        <div className="flex justify-end gap-3">
          <button onClick={onClose} className="px-4 py-2 rounded border border-slate-300 text-sm">Cancel</button>
          <button
            disabled={!checked}
            onClick={() => onProceed(appointment.id)}
            className={checked ? 'bg-sky-600 hover:bg-sky-700 text-white px-4 py-2 rounded text-sm' : 'bg-zinc-300 cursor-not-allowed text-white px-4 py-2 rounded text-sm'}
          >
            Proceed
          </button>
        </div>
      </div>
    </div>
  );
}
