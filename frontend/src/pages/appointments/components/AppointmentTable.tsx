// src/features/appointments/components/AppointmentTable.tsx

import React from 'react';
import type { AppointmentDetails } from '../types';
import AppointmentActions from './AppointmentActions';
import ConsentModal from './ConsentModal';
import { IconPlayerPlay } from '@tabler/icons-react';
import { useNavigate } from 'react-router-dom';

// Updated type to include has_value
type MedicalCondition = { id: string; name: string; has_value: boolean };

type Props = {
  appointments: AppointmentDetails[];
  loading: boolean;
  onStatusChange: (appointmentId: string, newStatus: 'in-progress') => void;
  clinicConditions: MedicalCondition[];
  onUpdateConditions: (appointmentId: string, names: string[]) => Promise<void> | void;
};

const formatTime = (timeStr: string) => {
  if (!timeStr) return '';
  const [hours, minutes] = timeStr.split(':');
  const date = new Date();
  date.setHours(parseInt(hours, 10));
  date.setMinutes(parseInt(minutes, 10));
  return date.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true });
};

const StatusBadge = ({ status }: { status: AppointmentDetails['status'] }) => {
  const baseClasses = "px-2.5 py-0.5 text-xs font-medium rounded-full";
  const statusClasses = {
    scheduled: "bg-sky-100 text-sky-800",
    'in-progress': "bg-yellow-100 text-yellow-800 animate-pulse",
    completed: "bg-green-100 text-green-800",
    cancelled: "bg-red-100 text-red-800",
  };
  const statusText = {
    scheduled: "Scheduled",
    'in-progress': "In Progress",
    completed: "Completed",
    cancelled: "Cancelled",
  };
  return (
    <span className={`${baseClasses} ${statusClasses[status]}`}>
      {statusText[status]}
    </span>
  );
};

export default function AppointmentTable({
  appointments,
  loading,
  onStatusChange,
  clinicConditions,
  onUpdateConditions,
}: Props) {
  const navigate = useNavigate();
  const [editorOpenId, setEditorOpenId] = React.useState<string | null>(null);
  const [noteOpenId, setNoteOpenId] = React.useState<string | null>(null); // State for tracking open notes
  const [consentOpenId, setConsentOpenId] = React.useState<string | null>(null);

  React.useEffect(() => {
    if (!editorOpenId || typeof document === 'undefined') return;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = previousOverflow;
    };
  }, [editorOpenId]);

  // Stores the selected condition names (e.g., ["Fever", "Cough"])
  const [draftMap, setDraftMap] = React.useState<Record<string, string[]>>({});

  // Stores the values for conditions that have has_value=true (e.g., { "appointment_id": { "Fever": "101.2" } })
  const [draftValues, setDraftValues] = React.useState<Record<string, Record<string, string>>>({});

  const openEditor = (appt: AppointmentDetails) => {
    setEditorOpenId(appt.id);
    setNoteOpenId(null); // Close note if open

    const currentConditions = appt.medical_conditions ?? [];
    const selectedNames: string[] = [];
    const values: Record<string, string> = {};

    // Parse existing strings. Expecting format "Name" or "Name: Value"
    currentConditions.forEach(condString => {
      const separatorIndex = condString.indexOf(': ');
      if (separatorIndex !== -1) {
        // Has a value
        const name = condString.substring(0, separatorIndex);
        const value = condString.substring(separatorIndex + 2);
        selectedNames.push(name);
        values[name] = value;
      } else {
        // No value
        selectedNames.push(condString);
      }
    });

    setDraftMap((m) => ({
      ...m,
      [appt.id]: selectedNames,
    }));

    setDraftValues((v) => ({
      ...v,
      [appt.id]: values
    }));
  };

  const closeEditor = () => setEditorOpenId(null);

  const toggleDraft = (apptId: string, name: string) => {
    setDraftMap((m) => {
      const curr = new Set(m[apptId] ?? []);
      if (curr.has(name)) {
        curr.delete(name);
        // Optional: Clean up value from draftValues if unchecked, 
        // but keeping it allows persistence if user re-checks immediately
      }
      else curr.add(name);
      return { ...m, [apptId]: Array.from(curr) };
    });
  };

  const handleValueChange = (apptId: string, conditionName: string, value: string) => {
    setDraftValues(prev => ({
      ...prev,
      [apptId]: {
        ...(prev[apptId] || {}),
        [conditionName]: value
      }
    }));
  };

  const saveDraft = async (apptId: string) => {
    const selectedNames = draftMap[apptId] ?? [];
    const currentValues = draftValues[apptId] ?? {};

    // Reconstruct the string array. 
    // If condition has_value=true, format as "Name: Value", otherwise "Name".
    const finalStrings = selectedNames.map(name => {
      const config = clinicConditions.find(c => c.name === name);
      if (config?.has_value) {
        const val = currentValues[name] || '';
        // Only append value if it's not empty, or strictly follow format "Name: Value"
        return val.trim() ? `${name}: ${val}` : name;
      }
      return name;
    });

    await onUpdateConditions(apptId, finalStrings);
    closeEditor();
  };

  const handleStartConsultation = (appointmentId: string) => {
    // open consent confirmation modal for staff to confirm patient consent
    setConsentOpenId(appointmentId);
  };

  const proceedToConsultation = async (appointmentId: string) => {
    try {
      await onStatusChange(appointmentId, 'in-progress');
    } finally {
      setConsentOpenId(null);
      navigate(`/consultation/${appointmentId}`);
    }
  };

  // Helper to toggle note visibility
  const toggleNote = (id: string) => {
    if (noteOpenId === id) {
      setNoteOpenId(null);
    } else {
      setNoteOpenId(id);
      setEditorOpenId(null); // Close conditions editor if open
    }
  };

  const consentAppt = consentOpenId ? (appointments.find(a => a.id === consentOpenId) || null) : null;

  if (loading) {
    return (
      <div className="text-center py-10">
        <p className="text-slate-500">Loading appointments...</p>
      </div>
    );
  }

  if (appointments.length === 0) {
    return (
      <div className="text-center py-10">
        <p className="text-slate-500 font-medium">No appointments found.</p>
        <p className="text-sm text-slate-400 mt-1">Please check the selected date or try a different search term.</p>
      </div>
    );
  }

  return (<>
    <div className="mt-6 -mx-4 sm:mx-0 overflow-x-auto">
      <table className="min-w-full divide-y divide-slate-200 table-auto">
        <thead className="bg-slate-50">
          <tr>
            <th scope="col" className="px-3 py-2 sm:px-6 sm:py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">File Number</th>
            <th scope="col" className="px-3 py-2 sm:px-6 sm:py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Patient / Doctor</th>
            <th scope="col" className="px-3 py-2 sm:px-6 sm:py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Time</th>
            <th scope="col" className="px-3 py-2 sm:px-6 sm:py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Status</th>
            <th scope="col" className="px-3 py-2 sm:px-6 sm:py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Patient Note</th>
            <th scope="col" className="px-3 py-2 sm:px-6 sm:py-3 text-center text-xs font-medium text-slate-500 uppercase tracking-wider">Conditions</th>
            <th scope="col" className="relative px-3 py-2 sm:px-6 sm:py-3">
              <span className="sr-only">Actions</span>
            </th>
          </tr>
        </thead>
        <tbody className="bg-white divide-y divide-slate-200">
          {appointments.map((appt) => (
            <tr key={appt.id}>
              <td className="px-3 py-3 sm:px-6 sm:py-4 whitespace-nowrap font-mono text-xs text-slate-700">{appt.file_number || '-'}</td>
              <td className="px-3 py-3 sm:px-6 sm:py-4 whitespace-nowrap">
                <div className="text-sm font-medium text-slate-900">{appt.full_name}</div>
                <div className="text-sm text-slate-500">({appt.doctor_name || appt.doctor?.full_name || '—'})</div>
              </td>
              <td className="px-3 py-3 sm:px-6 sm:py-4 whitespace-nowrap text-sm text-slate-700">{formatTime(appt.appointment_time)}</td>
              <td className="px-3 py-3 sm:px-6 sm:py-4 whitespace-nowrap">
                <StatusBadge status={appt.status} />
              </td>

              {/* Patient Note Column */}
              <td className="px-3 py-3 sm:px-6 sm:py-4 whitespace-nowrap">
                <div className="relative">
                  {appt.patient_note ? (
                    <>
                      <button
                        type="button"
                        onClick={() => toggleNote(appt.id)}
                        className="text-sm text-slate-600 hover:text-sky-600 underline decoration-dotted underline-offset-4 focus:outline-none max-w-[150px] truncate block"
                      >
                        {appt.patient_note.length > 10
                          ? `${appt.patient_note.substring(0, 10)}...`
                          : appt.patient_note}
                      </button>

                      {noteOpenId === appt.id && (
                        <div
                          className="absolute top-full left-0 mt-2 w-full sm:w-72 bg-white border border-slate-200 shadow-xl rounded-xl z-40 p-4"
                        >
                          <div className="flex justify-between items-start mb-2">
                            <h5 className="text-xs font-bold text-slate-500 uppercase tracking-wide">Patient Note</h5>
                            <button
                              onClick={() => setNoteOpenId(null)}
                              className="text-slate-400 hover:text-slate-600"
                            >
                              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" strokeWidth="2" stroke="currentColor" fill="none" strokeLinecap="round" strokeLinejoin="round"><path stroke="none" d="M0 0h24v24v0z" fill="none" /><path d="M18 6l-12 12" /><path d="M6 6l12 12" /></svg>
                            </button>
                          </div>
                          <p className="text-sm text-slate-800 whitespace-pre-wrap leading-relaxed">
                            {appt.patient_note}
                          </p>
                        </div>
                      )}
                    </>
                  ) : (
                    <span className="text-slate-400 text-sm">-</span>
                  )}
                </div>
              </td>

              <td className="px-3 py-3 sm:px-6 sm:py-4 whitespace-nowrap">
                <div className="relative flex justify-center">
                  <button
                    type="button"
                    onClick={() => openEditor(appt)}
                    className="inline-flex w-full sm:w-auto items-center gap-2 px-3 py-2 sm:py-1.5 text-sm sm:text-xs font-semibold bg-slate-100 text-slate-700 rounded-md hover:bg-slate-200 transition justify-center"
                  >
                    {(appt.medical_conditions?.length ?? 0) > 0
                      ? `Conditions (${appt.medical_conditions!.length})`
                      : 'Add Conditions'}
                  </button>

                  {editorOpenId === appt.id && (
                    <div
                      className="fixed inset-0 z-[9999] flex items-center justify-center px-4 py-8 bg-black/40 backdrop-blur-sm"
                      role="dialog"
                      aria-label="Edit medical conditions"
                      onMouseDown={(event) => {
                        if (event.target === event.currentTarget) {
                          closeEditor();
                        }
                      }}
                    >
                      <div className="w-full max-w-[32rem] bg-white border border-slate-200 shadow-2xl rounded-2xl flex flex-col overflow-hidden">
                        <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between">
                          <h4 className="text-sm font-semibold text-slate-900">
                            Edit Medical Conditions
                          </h4>
                          <button
                            type="button"
                            onClick={closeEditor}
                            className="text-slate-400 hover:text-slate-600"
                          >
                            <span className="sr-only">Close</span>
                            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" strokeWidth="2" stroke="currentColor" fill="none" strokeLinecap="round" strokeLinejoin="round">
                              <path stroke="none" d="M0 0h24v24H0z" fill="none" />
                              <path d="M18 6l-12 12" />
                              <path d="M6 6l12 12" />
                            </svg>
                          </button>
                        </div>

                        <div className="max-h-[60vh] overflow-y-auto overflow-x-hidden p-4 space-y-3">
                          {clinicConditions.length === 0 ? (
                            <p className="text-sm text-slate-500">No conditions configured.</p>
                          ) : (
                            <ul className="space-y-2">
                              {clinicConditions.map((c) => {
                                const checked = (draftMap[appt.id] ?? []).includes(c.name);
                                return (
                                  <li key={c.id} className="flex flex-col justify-center p-2 rounded-lg hover:bg-slate-50 transition-colors">
                                    <label
                                      htmlFor={`${appt.id}-${c.id}`}
                                      className="flex items-center gap-3 cursor-pointer"
                                    >
                                      <input
                                        id={`${appt.id}-${c.id}`}
                                        type="checkbox"
                                        className="h-4 w-4 rounded text-sky-600 focus:ring-sky-500 border-slate-300 shrink-0"
                                        checked={checked}
                                        onChange={() => toggleDraft(appt.id, c.name)}
                                      />
                                      <span className="text-sm text-slate-800 select-none">
                                        {c.name}
                                      </span>
                                    </label>

                                    {checked && c.has_value && (
                                      <div className="mt-2 ml-7">
                                        <input
                                          type="text"
                                          placeholder="Value (e.g. 102 F)"
                                          className="w-full px-2 py-1 text-sm border border-slate-300 rounded-md focus:ring-2 focus:ring-sky-200 outline-none"
                                          value={draftValues[appt.id]?.[c.name] || ''}
                                          onChange={(e) => handleValueChange(appt.id, c.name, e.target.value)}
                                          onClick={(e) => e.stopPropagation()}
                                        />
                                      </div>
                                    )}
                                  </li>
                                );
                              })}
                            </ul>
                          )}
                        </div>

                        <div className="p-4 flex flex-col sm:flex-row items-stretch sm:items-center justify-end gap-3 border-t border-slate-100">
                          <button
                            type="button"
                            onClick={closeEditor}
                            className="w-full sm:w-auto px-4 py-2 text-sm font-medium rounded-lg border border-slate-300 text-slate-700 hover:bg-slate-50 transition"
                          >
                            Cancel
                          </button>
                          <button
                            type="button"
                            onClick={() => saveDraft(appt.id)}
                            className="w-full sm:w-auto px-4 py-2 text-sm font-medium rounded-lg bg-sky-600 text-white hover:bg-sky-700 transition"
                          >
                            Save
                          </button>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </td>

              <td className="px-3 py-3 sm:px-6 sm:py-4 whitespace-nowrap">
                <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-end gap-2">
                  {appt.status === 'scheduled' && (
                    <button
                      onClick={() => handleStartConsultation(appt.id)}
                      className="inline-flex w-full sm:inline-flex sm:w-auto items-center gap-2 px-3 py-3 sm:py-1.5 text-sm sm:text-xs font-semibold text-white bg-green-600 rounded-md hover:bg-green-700 transition justify-center"
                    >
                      <IconPlayerPlay size={14} />
                      Start Consultation
                    </button>
                  )}
                  {appt.status === 'in-progress' && (
                    <button
                      onClick={() => handleStartConsultation(appt.id)}
                      className="inline-flex w-full sm:inline-flex sm:w-auto items-center gap-2 px-3 py-3 sm:py-1.5 text-sm sm:text-xs font-semibold text-white bg-indigo-600 rounded-md hover:bg-indigo-700 transition justify-center"
                    >
                      <IconPlayerPlay size={14} />
                      Continue Consultation
                    </button>
                  )}
                  <AppointmentActions />
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>

    <ConsentModal
      isOpen={!!consentAppt}
      appointment={consentAppt}
      onClose={() => setConsentOpenId(null)}
      onProceed={(id) => proceedToConsultation(id)}
    />
  </>);
}
