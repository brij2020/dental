import React from 'react';
import type { AppointmentDetails } from '../types';

type Props = {
  isOpen: boolean;
  appointment: AppointmentDetails | null;
  onClose: () => void;
  onProceed: (id: string) => void;
};

type ConsentField = {
  id: string;
  label: string;
  type: 'text' | 'date' | 'signature';
  required: boolean;
  placeholder?: string;
};

type ConsentTemplate = {
  title: string;
  body: string;
  fields: ConsentField[];
  updatedAt?: string;
};

const TEMPLATE_STORAGE_KEY = 'settings:consent-template:v1';
const defaultTemplate: ConsentTemplate = {
  title: 'INFORMED CONSENT FORM FOR GENERAL DENTAL TREATMENT',
  body: 'I hereby confirm that I have been informed about the proposed consultation and agree to proceed.',
  fields: [
    { id: 'patient_name', label: 'Patient Name', type: 'text', required: true },
    { id: 'date_of_birth', label: 'Date of Birth', type: 'date', required: true },
    { id: 'visit_date', label: 'Date', type: 'date', required: true },
    { id: 'dentist_name', label: 'Dentist', type: 'text', required: true },
    { id: 'practice_name', label: 'Practice Name', type: 'text', required: true },
    { id: 'patient_signature', label: 'Patient / Guardian Signature', type: 'signature', required: true },
  ],
};

const normalizeDate = (value?: string | null) => {
  if (!value) return '';
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return '';
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
};

const toStringValue = (value: unknown) => (typeof value === 'string' ? value : '');

const inferFieldValue = (field: ConsentField, appointment: AppointmentDetails) => {
  const key = `${field.id} ${field.label}`.toLowerCase();
  const appt = appointment as AppointmentDetails & {
    date_of_birth?: string | null;
    patient_date_of_birth?: string | null;
    dob?: string | null;
    clinic_name?: string | null;
    clinics?: { name?: string | null } | null;
    clinic?: { name?: string | null } | null;
    contact_number?: string | null;
    phone?: string | null;
  };

  if (key.includes('patient') && key.includes('name')) return appointment.full_name || '';
  if (key.includes('date_of_birth') || key.includes('dob')) {
    return normalizeDate(appt.date_of_birth || appt.patient_date_of_birth || appt.dob);
  }
  if (key.includes('visit_date') || key.includes('appointment_date') || key === 'date' || key.includes(' date')) {
    return normalizeDate(appointment.appointment_date);
  }
  if (key.includes('doctor') || key.includes('dentist')) {
    return appointment.doctor_name || appointment.doctor?.full_name || '';
  }
  if (key.includes('practice') || key.includes('clinic') || key.includes('hospital')) {
    return toStringValue(appt.clinic_name) || toStringValue(appt.clinics?.name) || toStringValue(appt.clinic?.name);
  }
  if (key.includes('appointment_uid') || key.includes('appointment id')) return appointment.appointment_uid || '';
  if (key.includes('file_number') || key.includes('file number')) return appointment.file_number || '';
  if (key.includes('phone') || key.includes('contact')) return toStringValue(appt.contact_number) || toStringValue(appt.phone);

  return '';
};

export default function ConsentModal({ isOpen, appointment, onClose, onProceed }: Props) {
  const [checked, setChecked] = React.useState(false);
  const [template, setTemplate] = React.useState<ConsentTemplate>(defaultTemplate);
  const [values, setValues] = React.useState<Record<string, string>>({});

  React.useEffect(() => {
    if (!isOpen || !appointment) {
      setChecked(false);
      return;
    }

    setChecked(false);

    let nextTemplate = defaultTemplate;
    try {
      const raw = window.localStorage.getItem(TEMPLATE_STORAGE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw) as ConsentTemplate;
        if (parsed && Array.isArray(parsed.fields) && parsed.fields.length > 0) {
          nextTemplate = {
            title: parsed.title || defaultTemplate.title,
            body: parsed.body || defaultTemplate.body,
            fields: parsed.fields,
            updatedAt: parsed.updatedAt,
          };
        }
      }
    } catch {
      nextTemplate = defaultTemplate;
    }

    setTemplate(nextTemplate);
    const initialValues: Record<string, string> = {};
    nextTemplate.fields.forEach((field) => {
      initialValues[field.id] = inferFieldValue(field, appointment);
    });
    setValues(initialValues);
  }, [isOpen, appointment]);

  if (!isOpen || !appointment) return null;

  // Keep workflow practical for front-desk users:
  // signature fields can be captured offline/physically and should not block consultation start.
  const isBlockingRequiredField = (field: ConsentField) => {
    if (!field.required) return false;
    return field.type !== 'signature';
  };

  const missingRequired = template.fields.some((field) => {
    if (!isBlockingRequiredField(field)) return false;
    return !(values[field.id] || '').trim();
  });
  const requiredCount = template.fields.filter((field) => isBlockingRequiredField(field)).length;
  const filledRequiredCount = template.fields.filter((field) => {
    if (!isBlockingRequiredField(field)) return false;
    return Boolean((values[field.id] || '').trim());
  }).length;

  const handleProceed = () => {
    if (!checked) return;
    try {
      const ackKey = `consultation:consent:ack:v2:${appointment.id}`;
      const dataKey = `consultation:consent:data:v1:${appointment.id}`;
      window.localStorage.setItem(ackKey, 'accepted');
      window.localStorage.setItem(
        dataKey,
        JSON.stringify({
          appointment_id: appointment.id,
          appointment_uid: appointment.appointment_uid,
          accepted_at: new Date().toISOString(),
          template_title: template.title,
          fields: template.fields.map((field) => ({
            id: field.id,
            label: field.label,
            value: values[field.id] || '',
          })),
        }),
      );
    } catch {
      // non-blocking
    }
    onProceed(appointment.id);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="fixed inset-0 bg-black/40" onClick={onClose}></div>
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-3xl z-50 max-h-[90vh] overflow-hidden border border-slate-200">
        <div className="border-b border-slate-200 bg-gradient-to-r from-sky-50 to-cyan-50 px-6 py-4">
          <h3 className="text-base sm:text-lg font-semibold text-slate-900">
            {template.title || 'INFORMED CONSENT FORM FOR GENERAL DENTAL TREATMENT'}
          </h3>
          <p className="text-xs sm:text-sm text-slate-600 mt-1">Review and confirm before starting consultation.</p>
        </div>

        <div className="max-h-[calc(90vh-160px)] overflow-y-auto px-6 py-5">
          <div className="mb-4 rounded-xl border border-slate-200 bg-slate-50 p-3">
            <div className="text-sm font-medium text-slate-800">
              {appointment.full_name}{appointment.file_number ? ` • ${appointment.file_number}` : ''}
            </div>
            <div className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-slate-500">
              <span>Appointment: {appointment.appointment_uid}</span>
              <span>Required Fields: {filledRequiredCount}/{requiredCount}</span>
            </div>
          </div>

          {template.body ? (
            <div className="mb-4 rounded-xl border border-slate-200 bg-white p-3 text-sm text-slate-700 whitespace-pre-line leading-relaxed">
              {template.body}
            </div>
          ) : null}

          <div className="mb-4">
            <h4 className="mb-2 text-xs font-semibold tracking-wide text-slate-500 uppercase">Patient Consent Details</h4>
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              {template.fields.map((field) => (
                <label key={field.id} className="block">
                  <span className="mb-1 block text-xs font-medium text-slate-700">
                    {field.label}
                    {field.required ? <span className="text-rose-600"> *</span> : null}
                  </span>
                  <input
                    type={field.type === 'date' ? 'date' : 'text'}
                    value={values[field.id] || ''}
                    placeholder={field.placeholder || ''}
                    onChange={(e) => {
                      const nextVal = e.target.value;
                      setValues((prev) => ({ ...prev, [field.id]: nextVal }));
                    }}
                    className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-800 outline-none focus:border-sky-400 focus:ring-2 focus:ring-sky-200"
                  />
                </label>
              ))}
            </div>
          </div>

          <label className="flex items-start gap-3 mb-2 rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5">
            <input type="checkbox" className="h-4 w-4 mt-0.5" checked={checked} onChange={(e) => setChecked(e.target.checked)} />
            <div className="text-sm text-slate-700">I confirm patient consent has been reviewed and acknowledged.</div>
          </label>
          {missingRequired && <p className="mb-1 text-xs text-amber-600">Some required details are missing. You can still proceed and complete later.</p>}
        </div>

        <div className="border-t border-slate-200 bg-white px-6 py-3 flex justify-end gap-3">
          <button onClick={onClose} className="px-4 py-2 rounded-lg border border-slate-300 text-sm font-medium text-slate-700 hover:bg-slate-50">Cancel</button>
          <button
            disabled={!checked}
            onClick={handleProceed}
            className={!checked ? 'bg-zinc-300 cursor-not-allowed text-white px-4 py-2 rounded-lg text-sm font-medium' : 'bg-sky-600 hover:bg-sky-700 text-white px-4 py-2 rounded-lg text-sm font-medium'}
          >
            Proceed
          </button>
        </div>
      </div>
    </div>
  );
}
