import { useEffect, useMemo, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { format } from 'date-fns';
import spaiLogo from '../../assets/spai.jpeg';
import { get, getAppointmentById, getOrCreateConsultation, getTreatmentProceduresByConsultationId } from '../../lib/apiClient';
import { prescriptionAPI } from '../../lib/prescriptionAPI';
import { supabase } from '../../lib/supabaseClient';
import type { AppointmentDetails } from '../appointments/types';
import type { ConsultationRow, TreatmentProcedureRow } from './types';
import {
  ADULT_SVG_BY_INDEX,
  ADULT_TOOTH_COUNT_PER_JAW,
} from './components/dental-chart/adultTeeth';
import {
  CHILD_SVG_BY_INDEX,
  CHILD_TOOTH_COUNT_PER_JAW,
} from './components/dental-chart/childTeeth';
import { getAdultDisplayNumber, getChildDisplayNumber, normalizeToothNumber } from './components/dental-chart/toothNumbers';

type PatientClinicRow = {
  id: string;
  clinic_id: string;
  full_name: string;
  date_of_birth: string | null;
  gender: string | null;
  address: string | null;
  file_number: string | null;
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

const TOTAL_ADULT = ADULT_TOOTH_COUNT_PER_JAW * 2;
const TOTAL_CHILD = CHILD_TOOTH_COUNT_PER_JAW * 2;

export default function ConsultationPreview() {
  const { appointmentId } = useParams<{ appointmentId: string }>();
  const navigate = useNavigate();
  const draftStorageKey = appointmentId ? `consultation:draft:${appointmentId}` : null;

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [appointment, setAppointment] = useState<AppointmentDetails | null>(null);
  const [patient, setPatient] = useState<PatientClinicRow | null>(null);
  const [consultationData, setConsultationData] = useState<ConsultationRow | null>(null);
  const [prescriptions, setPrescriptions] = useState<any[] | null>(null);
  const [procedures, setProcedures] = useState<TreatmentProcedureRow[] | null>(null);
  const [payments, setPayments] = useState<any[] | null>(null);
  const [draftFollowUpDate, setDraftFollowUpDate] = useState<string | null>(null);
  const [draftFollowUpTime, setDraftFollowUpTime] = useState<string | null>(null);
  const [draftConsultationData, setDraftConsultationData] = useState<Partial<ConsultationRow> | null>(null);
  const [draftProcedures, setDraftProcedures] = useState<TreatmentProcedureRow[] | null>(null);

  useEffect(() => {
    if (!draftStorageKey || typeof window === 'undefined') return;
    try {
      const raw = window.localStorage.getItem(draftStorageKey);
      if (!raw) return;
      const parsed = JSON.parse(raw) as ConsultationDraft;
      setDraftConsultationData(parsed?.consultationData || null);
      setDraftProcedures(parsed?.procedures || null);
      setDraftFollowUpDate(
        parsed?.followUpDate ||
          parsed?.consultationData?.follow_up_date ||
          null,
      );
      setDraftFollowUpTime(
        parsed?.followUpTime ||
          parsed?.consultationData?.follow_up_time ||
          null,
      );
    } catch {
      setDraftConsultationData(null);
      setDraftProcedures(null);
      setDraftFollowUpDate(null);
      setDraftFollowUpTime(null);
    }
  }, [draftStorageKey]);

  useEffect(() => {
    if (!draftConsultationData) return;
    setConsultationData((prev) => {
      if (!prev) return prev;
      const pickId = (raw: { id?: unknown; _id?: unknown } | null | undefined) =>
        raw?.id ?? raw?._id ?? null;
      const prevId = pickId(prev as { id?: unknown; _id?: unknown });
      const draftId = pickId(draftConsultationData as { id?: unknown; _id?: unknown });
      if (prevId && draftId && String(prevId) !== String(draftId)) {
        return prev;
      }
      return { ...prev, ...draftConsultationData } as ConsultationRow;
    });
  }, [draftConsultationData]);

  useEffect(() => {
    async function fetchAll() {
      if (!appointmentId) {
        setError('No appointment ID provided');
        setLoading(false);
        return;
      }

      setLoading(true);
      setError(null);
      try {
        const apptResp = await getAppointmentById(appointmentId);
        const apptDataRaw = apptResp?.data?.data || apptResp?.data;
        if (!apptDataRaw) throw new Error('Appointment not found');
        const normalizedAppt = {
          ...apptDataRaw,
          id: apptDataRaw.id || apptDataRaw._id || apptDataRaw.appointment_uid,
        };
        setAppointment(normalizedAppt as AppointmentDetails);

        // Load patient and consultation in parallel to reduce time-to-first-render.
        const patientPromise = normalizedAppt.patient_id
          ? get(`/api/patients/${normalizedAppt.patient_id}`)
          : Promise.resolve(null);
        const consultationPromise = draftConsultationData
          ? Promise.resolve({ data: { data: draftConsultationData } })
          : getOrCreateConsultation(String(normalizedAppt.id), {
              clinic_id: normalizedAppt.clinic_id,
              patient_id: normalizedAppt.patient_id,
              doctor_id: normalizedAppt.doctor_id,
            });

        const [patientSettled, consultationSettled] = await Promise.allSettled([
          patientPromise,
          consultationPromise,
        ]);

        if (patientSettled.status === 'fulfilled' && patientSettled.value) {
          const p = (patientSettled.value as any)?.data?.data;
          if (p) {
            setPatient({
              id: p._id || p.id,
              clinic_id: normalizedAppt.clinic_id,
              file_number: p.file_number || null,
              full_name: p.full_name,
              date_of_birth: p.date_of_birth || null,
              gender: p.gender || null,
              address: p.address || null,
              contact_number: p.contact_number || null,
              uhid: p.uhid || '-',
            });
          }
        }

        if (consultationSettled.status !== 'fulfilled') {
          throw new Error('Consultation not found for appointment');
        }
        const consultationResp: any = consultationSettled.value;
        const c = consultationResp?.data?.data || consultationResp?.data;
        if (!c) throw new Error('Consultation not found for appointment');
        const mappedConsultation = { ...c, id: c.id || c._id };
        const pickId = (raw: { id?: unknown; _id?: unknown } | null | undefined) =>
          raw?.id ?? raw?._id ?? null;
        const shouldApplyDraft =
          !draftConsultationData ||
          !pickId(mappedConsultation) ||
          !pickId(draftConsultationData as { id?: unknown; _id?: unknown }) ||
          String(pickId(mappedConsultation)) ===
            String(
              pickId(draftConsultationData as { id?: unknown; _id?: unknown }),
            );
        const mergedConsultation =
          shouldApplyDraft && draftConsultationData
            ? { ...mappedConsultation, ...draftConsultationData }
            : mappedConsultation;
        setConsultationData(mergedConsultation as ConsultationRow);

        // Show the preview page as soon as core data is ready.
        setLoading(false);

        // Load heavier secondary data in background only when draft is not present.
        if (!draftConsultationData) {
          const consultationId = String(mappedConsultation.id);
          const [rxSettled, procSettled, paySettled] = await Promise.allSettled([
            prescriptionAPI.getByConsultation(consultationId),
            getTreatmentProceduresByConsultationId(consultationId),
            supabase.from('payments').select('*').eq('consultation_id', consultationId).order('created_at', { ascending: false }),
          ]);

          const rx = rxSettled.status === 'fulfilled' ? rxSettled.value : [];
          setPrescriptions(Array.isArray(rx) ? rx : ((rx as any)?.data || rx || []));

          const procResp = procSettled.status === 'fulfilled' ? (procSettled.value as any) : [];
          const procData = procResp?.data?.data || procResp?.data || procResp;
          setProcedures(Array.isArray(procData) ? procData : (procData ? [procData] : []));

          const pay = paySettled.status === 'fulfilled' ? paySettled.value : { data: [] };
          setPayments((pay as any)?.data || []);
        } else if (Array.isArray(draftProcedures)) {
          setProcedures(draftProcedures);
        }
      } catch (e: any) {
        setError(e?.message || 'Failed to load preview');
      } finally {
        setLoading(false);
      }
    }
    fetchAll();
  }, [appointmentId, draftConsultationData, draftProcedures]);

  const getAge = (dob: string | null) => {
    if (!dob) return '-';
    const birth = new Date(dob);
    if (Number.isNaN(birth.getTime())) return '-';
    const today = new Date();
    let age = today.getFullYear() - birth.getFullYear();
    const m = today.getMonth() - birth.getMonth();
    if (m < 0 || (m === 0 && today.getDate() < birth.getDate())) age--;
    return age;
  };

  const handlePrintPreview = () => {
    const source = document.getElementById('consultation-preview-page');
    if (!source) return;
    const body = document.body;
    const className = 'print-consultation';
    const printRootId = 'consultation-print-root';
    const existingRoot = document.getElementById(printRootId);
    if (existingRoot) existingRoot.remove();

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

  const procedureList =
    Array.isArray(procedures) && procedures.length > 0
      ? procedures
      : Array.isArray(draftProcedures)
        ? draftProcedures
        : [];
  const selectedFDISet = useMemo(() => {
    const set = new Set<number>();
    procedureList.forEach((p: any) => {
      const raw = Number(p?.tooth_number);
      if (!Number.isFinite(raw)) return;
      const normalized = normalizeToothNumber(raw);
      if (normalized != null) {
        if (normalized <= TOTAL_ADULT) {
          set.add(getAdultDisplayNumber(normalized));
        } else {
          set.add(getChildDisplayNumber(normalized));
        }
      }
      if (raw >= 11 && raw <= 85) {
        set.add(raw);
      }
    });
    return set;
  }, [procedureList]);

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-100 flex items-center justify-center p-6">
        <div className="w-full max-w-md rounded-2xl border border-slate-200 bg-white p-8 shadow-sm">
          <div className="flex flex-col items-center gap-4">
            <div className="h-10 w-10 animate-spin rounded-full border-2 border-slate-200 border-t-sky-500" />
            <div className="text-center">
              <p className="text-base font-semibold text-slate-800">Loading preview</p>
              <p className="text-sm text-slate-500">Preparing consultation details...</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (error || !appointment || !consultationData) {
    return (
      <div className="min-h-screen bg-slate-100 p-8">
        <div className="mx-auto max-w-3xl rounded-xl border border-rose-200 bg-white p-6 text-rose-700">
          {error || 'Unable to load consultation preview'}
        </div>
      </div>
    );
  }

  const effectiveConsultationData = ({
    ...(consultationData || {}),
    ...(draftConsultationData || {}),
  } as ConsultationRow);
  const prescriptionList = Array.isArray(prescriptions) ? prescriptions : [];
  const paymentCount = Array.isArray(payments) ? payments.length : 0;
  const patientName = patient?.full_name || appointment.full_name || (appointment as any)?.patient_name || '-';
  const doctorName =
    (appointment as any)?.doctor_name ||
    (appointment as any)?.doctor?.full_name ||
    (appointment as any)?.doctor?.name ||
    '-';
  const issueDateRaw = appointment?.appointment_date ? new Date(appointment.appointment_date) : null;
  const issueDate =
    issueDateRaw && !Number.isNaN(issueDateRaw.getTime()) ? format(issueDateRaw, 'dd/MM/yyyy') : '-';
  const medicalHistory = Array.isArray(effectiveConsultationData?.medical_history) ? effectiveConsultationData.medical_history : [];
  const clinicName =
    (appointment as any)?.clinic_name ||
    (appointment as any)?.clinic?.name ||
    (effectiveConsultationData as any)?.clinic_name ||
    'Clinic Name';
  const renderAdultStripTooth = (toothNumber: number) => {
    const upperIndex =
      toothNumber <= ADULT_TOOTH_COUNT_PER_JAW
        ? toothNumber
        : (TOTAL_ADULT + 1) - toothNumber;
    const svgSrc = ADULT_SVG_BY_INDEX[upperIndex];
    if (!svgSrc) return null;
    const isLower = toothNumber > ADULT_TOOTH_COUNT_PER_JAW;
    const displayNumber = getAdultDisplayNumber(toothNumber);
    const isSelected = selectedFDISet.has(displayNumber);

    return (
      <div key={`adult-strip-${toothNumber}`} className="flex w-9 flex-col items-center gap-1 sm:w-10">
        <div className="text-[11px] font-semibold text-slate-700">{displayNumber}</div>
        <div className="relative h-8 w-8 sm:h-9 sm:w-9">
          <img
            src={svgSrc}
            alt={`Tooth ${displayNumber}`}
            className={`h-full w-full ${isLower ? '-scale-y-100' : ''}`}
          />
          {isSelected && (
            <span className="absolute -right-2 -top-3 rounded-full border border-rose-300 bg-white px-1.5 py-0.5 text-[12px] font-black leading-none text-rose-600 shadow-sm">
              **
            </span>
          )}
        </div>
      </div>
    );
  };

  const renderChildStripTooth = (childToothNumber: number) => {
    const upperIndex =
      childToothNumber <= CHILD_TOOTH_COUNT_PER_JAW
        ? childToothNumber
        : (TOTAL_CHILD + 1) - childToothNumber;
    const svgSrc = CHILD_SVG_BY_INDEX[upperIndex];
    if (!svgSrc) return null;
    const isLower = childToothNumber > CHILD_TOOTH_COUNT_PER_JAW;
    const displayNumber = getChildDisplayNumber(TOTAL_ADULT + childToothNumber);
    const isSelected = selectedFDISet.has(displayNumber);

    return (
      <div key={`child-strip-${childToothNumber}`} className="flex w-8 flex-col items-center gap-1 sm:w-9">
        <div className="text-[11px] font-semibold text-slate-700">{displayNumber}</div>
        <div className="relative h-7 w-7 sm:h-8 sm:w-8">
          <img
            src={svgSrc}
            alt={`Tooth ${displayNumber}`}
            className={`h-full w-full ${isLower ? '-scale-y-100' : ''}`}
          />
          {isSelected && (
            <span className="absolute -right-2 -top-3 rounded-full border border-rose-300 bg-white px-1.5 py-0.5 text-[12px] font-black leading-none text-rose-600 shadow-sm">
              **
            </span>
          )}
        </div>
      </div>
    );
  };

  const renderCommonHeader = (pageLabel: string) => (
    <>
      <div className="border-b border-slate-400 p-3 text-[11px] text-slate-600">{pageLabel}</div>
      <div className="grid grid-cols-1 border-b border-slate-400 sm:grid-cols-2">
        <div className="border-b border-slate-400 p-4 sm:border-b-0 sm:border-r">
          <div className="flex items-center gap-3">
            <img
              src={spaiLogo}
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
            <div className="text-slate-500">Date</div><div>{issueDate}</div>
            <div className="text-slate-500">Patient</div><div>{patientName}</div>
            <div className="text-slate-500">File Number</div><div>{patient?.file_number || appointment.file_number || '-'}</div>
          </div>
        </div>
      </div>
    </>
  );

  return (
    <div className="min-h-screen bg-slate-100 px-3 py-4 sm:px-6">
      <style>
        {`
          #consultation-print-root { display: none; }
          @media print {
            @page { size: A4 portrait; margin: 0; }
            html, body { margin: 0 !important; padding: 0 !important; }
            body.print-consultation #root { display: none !important; }
            body.print-consultation #consultation-print-root {
              display: block !important;
              position: static !important;
              width: 100% !important;
              padding: 2mm !important;
              background: #fff !important;
            }
            body.print-consultation #consultation-print-root .rx-page {
              border: 0 !important;
              border-radius: 0 !important;
              margin: 0 !important;
              width: 100% !important;
              max-width: none !important;
              min-height: auto !important;
              box-sizing: border-box !important;
              page-break-inside: auto !important;
              break-inside: auto !important;
            }
            body.print-consultation #consultation-print-root .space-y-5 > :not([hidden]) ~ :not([hidden]) {
              margin-top: 0 !important;
            }
            body.print-consultation #consultation-print-root .rx-page > div:first-child {
              display: none !important;
            }
            body.print-consultation #consultation-print-root .advice-block {
              page-break-inside: avoid !important;
              break-inside: avoid !important;
            }
          }
        `}
      </style>

      <div className="mx-auto mb-4 flex w-full max-w-[1280px] items-center justify-between">
        <button
          type="button"
          onClick={() => navigate(-1)}
          className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm font-medium text-slate-700"
        >
          Back
        </button>
        <button
          type="button"
          onClick={handlePrintPreview}
          className="rounded-lg bg-sky-600 px-4 py-2 text-sm font-medium text-white hover:bg-sky-700"
        >
          Download PDF
        </button>
      </div>

      <div id="consultation-preview-page" className="space-y-5">
        <article className="rx-page mx-auto w-full max-w-[850px] border border-slate-400 bg-white text-slate-800">
          {renderCommonHeader('Page 1 / 3')}

          <div className="border-b border-slate-400 p-4 text-sm">
            <div className="mb-2 text-xs font-semibold uppercase tracking-wide text-slate-600">Patient Information</div>
            <div className="grid grid-cols-1 gap-2 sm:grid-cols-3">
              <div className="rounded border border-slate-300 px-2 py-1"><span className="text-slate-500">Name:</span> <span className="font-medium">{patientName}</span></div>
              <div className="rounded border border-slate-300 px-2 py-1"><span className="text-slate-500">Date:</span> <span className="font-medium">{issueDate}</span></div>
              <div className="rounded border border-slate-300 px-2 py-1"><span className="text-slate-500">Age:</span> <span className="font-medium">{getAge(patient?.date_of_birth || null)}</span></div>
              <div className="rounded border border-slate-300 px-2 py-1"><span className="text-slate-500">Gender:</span> <span className="font-medium">{patient?.gender || (appointment as any)?.gender || '-'}</span></div>
              <div className="rounded border border-slate-300 px-2 py-1"><span className="text-slate-500">Contact:</span> <span className="font-medium">{patient?.contact_number || (appointment as any)?.contact_number || '-'}</span></div>
              <div className="rounded border border-slate-300 px-2 py-1"><span className="text-slate-500">File No:</span> <span className="font-medium">{patient?.file_number || appointment.file_number || '-'}</span></div>
            </div>
          </div>

          <div className="border-b border-slate-400 p-4">
            <div className="grid grid-cols-1 gap-3">
              <div className="mb-2 text-xs font-semibold uppercase tracking-wide text-slate-600">Chief Complaint</div>
              <div className="min-h-20 rounded border border-slate-300 bg-slate-50 px-3 py-2 text-sm whitespace-pre-wrap">{effectiveConsultationData?.chief_complaints || '-'}</div>
              <div className="mt-3 mb-2 text-xs font-semibold uppercase tracking-wide text-slate-600">Medical History</div>
              <div className="min-h-20 rounded border border-slate-300 bg-slate-50 px-3 py-2 text-sm">{medicalHistory.length > 0 ? medicalHistory.join(', ') : '-'}</div>
            </div>
            <div>
              <div className="mb-2 text-xs font-semibold uppercase tracking-wide text-slate-600">Dental Chart Overview</div>
              <div className="rounded border border-slate-300 bg-white p-3">
                <div className="mb-2 text-xs text-slate-600">
                  Selected teeth are marked with <span className="rounded-full border border-rose-300 bg-white px-1.5 py-0.5 text-[11px] font-black text-rose-600">**</span>
                </div>
                <div className="space-y-3">
                  <div>
                    <div className="mb-1 text-[11px] font-semibold uppercase tracking-wide text-slate-500">Adult Upper</div>
                    <div className="flex flex-wrap gap-1 rounded border border-slate-200 bg-slate-50 p-2">
                      {Array.from({ length: ADULT_TOOTH_COUNT_PER_JAW }, (_, i) => i + 1).map(renderAdultStripTooth)}
                    </div>
                  </div>
                  <div>
                    <div className="mb-1 text-[11px] font-semibold uppercase tracking-wide text-slate-500">Adult Lower</div>
                    <div className="flex flex-wrap gap-1 rounded border border-slate-200 bg-slate-50 p-2">
                      {Array.from({ length: ADULT_TOOTH_COUNT_PER_JAW }, (_, i) => TOTAL_ADULT - i).map(renderAdultStripTooth)}
                    </div>
                  </div>
                  <div>
                    <div className="mb-1 text-[11px] font-semibold uppercase tracking-wide text-slate-500">Child Upper</div>
                    <div className="flex flex-wrap gap-1 rounded border border-slate-200 bg-slate-50 p-2">
                      {Array.from({ length: CHILD_TOOTH_COUNT_PER_JAW }, (_, i) => i + 1).map(renderChildStripTooth)}
                    </div>
                  </div>
                  <div>
                    <div className="mb-1 text-[11px] font-semibold uppercase tracking-wide text-slate-500">Child Lower</div>
                    <div className="flex flex-wrap gap-1 rounded border border-slate-200 bg-slate-50 p-2">
                      {Array.from({ length: CHILD_TOOTH_COUNT_PER_JAW }, (_, i) => CHILD_TOOTH_COUNT_PER_JAW + i + 1).map(renderChildStripTooth)}
                    </div>
                  </div>
                </div>
                <div className="mt-2 flex flex-wrap gap-1">
                  {Array.from(selectedFDISet).sort((a, b) => a - b).map((num) => (
                    <span key={`selected-fdi-${num}`} className="rounded bg-amber-100 px-2 py-0.5 text-xs font-medium text-amber-800">
                      {num}
                    </span>
                  ))}
                  {selectedFDISet.size === 0 && <span className="text-sm text-slate-500">No procedures added</span>}
                </div>
              </div>
            </div>
          </div>

            <div className="space-y-3 border-b border-slate-400 p-4 text-sm">
            <div>
              <div className="mb-1 text-xs font-semibold uppercase tracking-wide text-slate-600">Clinical Examination (On Examination)</div>
              <div className="min-h-14 rounded border border-slate-300 bg-slate-50 px-3 py-2 whitespace-pre-wrap">{effectiveConsultationData?.on_examination || '-'}</div>
            </div>
            <div>
              <div className="mb-1 text-xs font-semibold uppercase tracking-wide text-slate-600">Diagnosis</div>
              <div className="min-h-14 rounded border border-slate-300 bg-slate-50 px-3 py-2 whitespace-pre-wrap">{effectiveConsultationData?.on_examination || '-'}</div>
            </div>
            <div>
              <div className="mb-1 text-xs font-semibold uppercase tracking-wide text-slate-600">Advice</div>
              <div className="min-h-14 rounded border border-slate-300 bg-slate-50 px-3 py-2 whitespace-pre-wrap">{effectiveConsultationData?.advice || '-'}</div>
            </div>
            <div>
              <div className="mb-1 text-xs font-semibold uppercase tracking-wide text-slate-600">Notes</div>
              <div className="min-h-14 rounded border border-slate-300 bg-slate-50 px-3 py-2 whitespace-pre-wrap">{effectiveConsultationData?.notes || '-'}</div>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3 p-4 text-xs text-slate-500">
            <div className="rounded border border-slate-300 px-3 py-2">Clinic Stamp</div>
            <div className="rounded border border-slate-300 px-3 py-2 text-right">Doctor Signature</div>
          </div>
        </article>

        <article className="rx-page mx-auto w-full max-w-[850px] border border-slate-400 bg-white text-slate-800">
          {renderCommonHeader('Page 2 / 3')}

          <div className="border-b border-slate-400 p-4">
            <div className="mb-2 text-xs font-semibold uppercase tracking-wide text-slate-600">Prescribed Medicines Per Day</div>
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
          </div>

          <div className="border-b border-slate-400 p-4">
            <div className="mb-2 text-xs font-semibold uppercase tracking-wide text-slate-600">Past / Planned Procedures</div>
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
                    effectiveConsultationData?.post_procedure_items && effectiveConsultationData.post_procedure_items.length > 0
                      ? effectiveConsultationData.post_procedure_items
                      : effectiveConsultationData?.post_procedure?.diagnosed_tooth_no
                        ? [effectiveConsultationData.post_procedure]
                        : []
                  ).map((item: any, idx: number) => (
                    <tr className="bg-indigo-50" key={`post-procedure-preview-${idx}`}>
                      <td className="border border-slate-300 px-2 py-2">{item?.diagnosed_tooth_no || '-'}</td>
                      <td className="border border-slate-300 px-2 py-2">{item?.diagnosed_procedure || '-'}</td>
                      <td className="border border-slate-300 px-2 py-2">{item?.status || '-'}</td>
                      <td className="border border-slate-300 px-2 py-2">{item?.instruction || '-'}</td>
                    </tr>
                  ))}
                  {(!effectiveConsultationData?.post_procedure_items || effectiveConsultationData.post_procedure_items.length === 0) &&
                    !effectiveConsultationData?.post_procedure?.diagnosed_tooth_no && (
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
          {renderCommonHeader('Page 3 / 3')}

          <div className="advice-block border-b border-slate-400 p-4">
            <div className="mb-2 text-xs font-semibold uppercase tracking-wide text-slate-600">Advice</div>
            <div className="min-h-48 rounded border border-slate-300 bg-slate-50 px-3 py-2 text-sm whitespace-pre-wrap">{effectiveConsultationData?.advice || '-'}</div>
          </div>

          <div className="grid grid-cols-1 border-b border-slate-400 sm:grid-cols-2">
            <div className="border-b border-slate-400 p-4 sm:border-b-0 sm:border-r">
              <div className="grid grid-cols-[120px_1fr] gap-y-1 text-sm">
                <div className="text-slate-500">Date</div><div>{issueDate}</div>
                <div className="text-slate-500">Appointment ID</div><div>{appointment?.appointment_uid || appointment?.id || '-'}</div>
                <div className="text-slate-500">Follow-up Date</div><div>{draftFollowUpDate || effectiveConsultationData?.follow_up_date || (appointment as any)?.follow_up_date || '-'}</div>
              </div>
            </div>
            <div className="p-4 text-sm">
              <div className="grid grid-cols-[120px_1fr] gap-y-1">
                <div className="text-slate-500">Patient Name</div><div>{patientName}</div>
                <div className="text-slate-500">Contact</div><div>{patient?.contact_number || '-'}</div>
                <div className="text-slate-500">Time</div><div>{draftFollowUpTime || effectiveConsultationData?.follow_up_time || appointment?.appointment_time || '-'}</div>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3 p-4 text-xs text-slate-500">
            <div className="rounded border border-slate-300 px-3 py-2">Clinic Stamp</div>
            <div className="rounded border border-slate-300 px-3 py-2 text-right">Doctor Signature</div>
          </div>
        </article>

        <article className="rx-page mx-auto w-full max-w-[850px] border border-slate-400 bg-white text-slate-800">
          {renderCommonHeader('Consent')}

          <div className="p-4">
            <div className="mb-2 text-center text-xs font-semibold uppercase tracking-wide text-slate-600">Consent Form</div>
            <div className="min-h-56 rounded border border-slate-300 bg-slate-50 px-3 py-2 text-sm leading-6">
              I hereby confirm that the treatment plan, procedure options, expected outcomes, and potential risks were explained to me.
              I had the opportunity to ask questions and all my questions were answered satisfactorily.
              I consent to proceed with the advised treatment and prescription plan.
            </div>
            <div className="mt-2 text-right text-xs text-slate-500">Payments recorded for this consultation: {paymentCount}</div>
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
    </div>
  );
}
