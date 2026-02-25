import { useEffect, useMemo, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { getConsultationsByPatientId, get } from '../../lib/apiClient';
import { useAuth } from '../../state/useAuth';

type ConsultationItem = {
  _id?: string;
  id?: string;
  appointment_id?: string;
  status?: string;
  chief_complaints?: string | null;
  consultation_fee?: number | null;
  total_amount?: number | null;
  amount_due?: number | null;
  created_at?: string;
  updated_at?: string;
};

const formatDate = (value?: string | null) => {
  if (!value) return '—';
  const dt = new Date(value);
  if (Number.isNaN(dt.getTime())) return value;
  return dt.toLocaleDateString('en-GB');
};

export default function PatientConsultationHistory() {
  const { patientId } = useParams<{ patientId: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const clinicId = user?.clinic_id || '';

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [patientName, setPatientName] = useState<string>('');
  const [consultations, setConsultations] = useState<ConsultationItem[]>([]);

  useEffect(() => {
    let mounted = true;
    (async () => {
      if (!patientId) {
        setError('Patient ID missing.');
        setLoading(false);
        return;
      }
      setLoading(true);
      setError(null);
      try {
        const [patientResp, consultationsResp] = await Promise.allSettled([
          get(`/api/patients/${patientId}`),
          getConsultationsByPatientId(patientId, {
            clinic_id: clinicId || undefined,
            limit: 200,
          }),
        ]);

        if (!mounted) return;

        if (patientResp.status === 'fulfilled') {
          const patientData = patientResp.value?.data?.data || patientResp.value?.data || null;
          setPatientName(patientData?.full_name || '');
        }

        if (consultationsResp.status === 'fulfilled') {
          const rows = consultationsResp.value?.data?.data || consultationsResp.value?.data || [];
          const arr = Array.isArray(rows) ? rows : [];
          const completedOnly = arr.filter((item: ConsultationItem) => String(item?.status || '').toLowerCase() === 'completed');
          setConsultations(completedOnly);
        } else {
          throw consultationsResp.reason;
        }
      } catch (e: unknown) {
        const err = e as { response?: { data?: { message?: string } }; message?: string };
        if (!mounted) return;
        setError(err?.response?.data?.message || err?.message || 'Failed to fetch consultation history.');
      } finally {
        if (mounted) setLoading(false);
      }
    })();
    return () => {
      mounted = false;
    };
  }, [patientId, clinicId]);

  const completedCount = useMemo(
    () => consultations.filter((c) => String(c.status || '').toLowerCase() === 'completed').length,
    [consultations],
  );

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold">Patient Consultation History</h1>
          <p className="text-sm text-slate-500 mt-1">
            {patientName ? `${patientName} • ` : ''}{consultations.length} total, {completedCount} completed
          </p>
        </div>
        <button
          type="button"
          onClick={() => navigate('/patients')}
          className="rounded-lg border border-slate-300 px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
        >
          Back to Patients
        </button>
      </div>

      <div className="rounded-2xl border border-slate-200 bg-white shadow-sm">
        {loading ? (
          <div className="px-5 py-8 text-sm text-slate-500">Loading consultation history...</div>
        ) : error ? (
          <div className="px-5 py-8 text-sm text-rose-600">{error}</div>
        ) : consultations.length === 0 ? (
          <div className="px-5 py-8 text-sm text-slate-500">No consultation history found for this patient.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200">
                  <th className="px-4 py-3 text-left font-semibold text-slate-700">Date</th>
                  <th className="px-4 py-3 text-left font-semibold text-slate-700">Appointment ID</th>
                  <th className="px-4 py-3 text-left font-semibold text-slate-700">Status</th>
                  <th className="px-4 py-3 text-left font-semibold text-slate-700">Chief Complaints</th>
                  <th className="px-4 py-3 text-right font-semibold text-slate-700">Total</th>
                  <th className="px-4 py-3 text-right font-semibold text-slate-700">Due</th>
                  <th className="px-4 py-3 text-right font-semibold text-slate-700">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200">
                {consultations.map((c) => {
                  const consultationId = c.id || c._id || '';
                  const appointmentId = c.appointment_id || '';
                  const isCompleted = String(c.status || '').toLowerCase() === 'completed';
                  return (
                    <tr key={consultationId || appointmentId}>
                      <td className="px-4 py-3 text-slate-700">{formatDate(c.created_at || c.updated_at)}</td>
                      <td className="px-4 py-3 font-mono text-xs text-slate-700">{appointmentId || '—'}</td>
                      <td className="px-4 py-3">
                        <span className={`inline-flex rounded-full px-2.5 py-1 text-xs font-medium ${
                          isCompleted ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-100 text-slate-700'
                        }`}>
                          {c.status || '—'}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-slate-700 max-w-[280px] truncate">{c.chief_complaints || '—'}</td>
                      <td className="px-4 py-3 text-right text-slate-700">{Number(c.total_amount || 0).toFixed(2)}</td>
                      <td className="px-4 py-3 text-right text-slate-700">{Number(c.amount_due || 0).toFixed(2)}</td>
                      <td className="px-4 py-3 text-right">
                        <button
                          type="button"
                          disabled={!appointmentId}
                          onClick={() => navigate(`/consultation/${appointmentId}/preview`)}
                          className="rounded-md border border-slate-300 px-3 py-1.5 text-xs font-medium text-slate-700 hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          Open Preview
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
