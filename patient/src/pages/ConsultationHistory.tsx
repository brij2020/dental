import { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { get, api } from "@/lib/apiClient";
import { useProfile } from "@/hooks/useProfile";
import Loading from "@/Components/Loading";

type ConsultationRow = {
  _id?: string;
  id?: string;
  appointment_id: string;
  status?: string;
  created_at?: string;
  chief_complaints?: string | null;
  on_examination?: string | null;
  advice?: string | null;
  notes?: string | null;
  medical_history?: string[] | null;
  follow_up_date?: string | null;
  follow_up_time?: string | null;
  consultation_fee?: number | null;
  other_amount?: number | null;
  discount?: number | null;
  subtotal?: number | null;
  total_amount?: number | null;
  amount_due?: number | null;
};

type ProcedureRow = {
  _id?: string;
  id?: string;
  tooth_number?: number | string | null;
  problems?: string[] | null;
  solutions?: string[] | null;
  cost?: number | null;
};

type PrescriptionRow = {
  _id?: string;
  id?: string;
  medicine_name?: string;
  times?: string | null;
  quantity?: string | null;
  days?: string | null;
  note?: string | null;
};

const formatDate = (value?: string | null) => {
  if (!value) return "—";
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return value;
  return d.toLocaleDateString("en-GB");
};

const formatCurrency = (value?: number | null) => `Rs ${Number(value || 0).toFixed(2)}`;

export default function ConsultationHistory() {
  const { appointmentId } = useParams();
  const navigate = useNavigate();
  const { profile, user } = useProfile();

  const patientId = profile?.patient_id || profile?.id || user?.patient_id || "";
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [consultations, setConsultations] = useState<ConsultationRow[]>([]);
  const [selectedAppointmentId, setSelectedAppointmentId] = useState<string | null>(appointmentId || null);
  const [selectedConsultation, setSelectedConsultation] = useState<ConsultationRow | null>(null);
  const [procedures, setProcedures] = useState<ProcedureRow[]>([]);
  const [prescriptions, setPrescriptions] = useState<PrescriptionRow[]>([]);
  const [appointmentMeta, setAppointmentMeta] = useState<any>(null);

  useEffect(() => {
    let mounted = true;
    (async () => {
      if (!patientId) {
        setError("Patient not found. Please login again.");
        setLoading(false);
        return;
      }
      setLoading(true);
      setError(null);
      try {
        const resp: any = await api.get(`/api/consultations/patient/${patientId}`, {
          params: { limit: 200 },
        });
        const rows = resp?.data?.data || resp?.data || [];
        const arr = Array.isArray(rows) ? rows : [];
        const completed = arr.filter((item: any) => String(item?.status || "").toLowerCase() === "completed");
        if (!mounted) return;
        setConsultations(completed);
        if (appointmentId) {
          const fromCompleted = completed.find(
            (item: any) =>
              String(item?.appointment_id || "") === String(appointmentId) ||
              String(item?.id || item?._id || "") === String(appointmentId),
          );
          if (fromCompleted?.appointment_id) {
            setSelectedAppointmentId(String(fromCompleted.appointment_id));
          } else {
            // Fallback: route param might be a consultation id
            try {
              const cResp: any = await api.get(`/api/consultations/${appointmentId}`);
              const c = cResp?.data?.data || cResp?.data || null;
              const cStatus = String(c?.status || "").toLowerCase();
              const cPatientId = String(c?.patient_id || "");
              if (c && c?.appointment_id && cStatus === "completed" && cPatientId === String(patientId)) {
                setSelectedAppointmentId(String(c.appointment_id));
              } else if (cStatus !== "completed") {
                setError("Consultation is not completed yet.");
              }
            } catch {
              // non-blocking; regular empty-state will show if nothing matches
            }
          }
        } else if (completed.length > 0) {
          setSelectedAppointmentId((prev) => prev || String(completed[0].appointment_id));
        }
      } catch (e: any) {
        if (!mounted) return;
        setError(e?.message || "Failed to load consultation history.");
      } finally {
        if (mounted) setLoading(false);
      }
    })();
    return () => {
      mounted = false;
    };
  }, [patientId, appointmentId]);

  useEffect(() => {
    let mounted = true;
    (async () => {
      if (!selectedAppointmentId) {
        setSelectedConsultation(null);
        setProcedures([]);
        setPrescriptions([]);
        return;
      }

      try {
        const consultationResp: any = await api.get(`/api/consultations/appointment/${selectedAppointmentId}`);
        const consultationData = consultationResp?.data?.data || consultationResp?.data || null;
        if (!consultationData) throw new Error("Consultation details not found.");
        if (!mounted) return;
        setSelectedConsultation(consultationData);

        const consultationId = consultationData.id || consultationData._id;
        const [procResp, rxResp, apptResp] = await Promise.allSettled([
          get(`/api/treatment-procedures/consultation/${consultationId}`),
          get("/api/prescriptions", { params: { consultation_id: consultationId } }),
          api.get(`/api/appointments/${selectedAppointmentId}`),
        ]);

        if (!mounted) return;

        if (procResp.status === "fulfilled") {
          const procData = procResp.value?.data?.data || procResp.value?.data || [];
          setProcedures(Array.isArray(procData) ? procData : procData ? [procData] : []);
        } else {
          setProcedures([]);
        }

        if (rxResp.status === "fulfilled") {
          const rxData = rxResp.value?.data?.data || rxResp.value?.data || [];
          setPrescriptions(Array.isArray(rxData) ? rxData : rxData ? [rxData] : []);
        } else {
          setPrescriptions([]);
        }

        if (apptResp.status === "fulfilled") {
          const apptData = apptResp.value?.data?.data || apptResp.value?.data || null;
          setAppointmentMeta(apptData);
        } else {
          setAppointmentMeta(null);
        }
      } catch (e: any) {
        if (!mounted) return;
        setError(e?.message || "Failed to load consultation summary.");
      }
    })();
    return () => {
      mounted = false;
    };
  }, [selectedAppointmentId]);

  const visitCount = consultations.length;
  const doctorName = useMemo(() => {
    return (
      appointmentMeta?.doctor_name ||
      appointmentMeta?.doctor?.full_name ||
      appointmentMeta?.doctor?.name ||
      "—"
    );
  }, [appointmentMeta]);

  if (loading) {
    return <Loading size={"500px"} />;
  }

  return (
    <div className="flex flex-col gap-5 p-0 md:p-4">
      <div className="rounded-xl border border-sky-100 bg-gradient-to-r from-sky-50 to-cyan-50 p-4">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-lg font-semibold text-slate-900">Consultation History</h1>
            <p className="mt-1 text-sm text-slate-600">Review completed visits, medicines, and procedures in one place.</p>
          </div>
          <button
            type="button"
            onClick={() => navigate("/previous-appointments")}
            className="inline-flex items-center justify-center rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
          >
            Back to Previous Appointments
          </button>
        </div>
      </div>

      {error && (
        <div className="rounded-lg border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-700">
          {error}
        </div>
      )}

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <div className="rounded-xl border border-slate-200 bg-white p-3">
          <p className="text-xs text-slate-500">Completed Visits</p>
          <p className="mt-1 text-xl font-semibold text-slate-900">{visitCount}</p>
        </div>
        <div className="rounded-xl border border-slate-200 bg-white p-3">
          <p className="text-xs text-slate-500">Selected Doctor</p>
          <p className="mt-1 truncate text-sm font-semibold text-slate-900">{doctorName}</p>
        </div>
        <div className="rounded-xl border border-slate-200 bg-white p-3">
          <p className="text-xs text-slate-500">Clinic</p>
          <p className="mt-1 truncate text-sm font-semibold text-slate-900">{appointmentMeta?.clinics?.name || "—"}</p>
        </div>
        <div className="rounded-xl border border-slate-200 bg-white p-3">
          <p className="text-xs text-slate-500">Total Bill</p>
          <p className="mt-1 text-sm font-semibold text-slate-900">{formatCurrency(selectedConsultation?.total_amount)}</p>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-[320px_1fr]">
        <div className="overflow-hidden rounded-xl border border-slate-200 bg-white">
          <div className="border-b border-slate-200 px-4 py-3 text-sm font-semibold text-slate-800">Visit Timeline</div>
          <div className="max-h-[68vh] overflow-y-auto">
            {consultations.length === 0 && (
              <p className="px-4 py-4 text-sm text-slate-500">No completed consultations found.</p>
            )}
            {consultations.map((item) => {
              const apptId = item.appointment_id;
              const active = selectedAppointmentId === apptId;
              return (
                <button
                  key={item.id || item._id || apptId}
                  type="button"
                  onClick={() => setSelectedAppointmentId(apptId)}
                  className={`w-full border-b border-slate-100 px-4 py-3 text-left transition hover:bg-slate-50 ${
                    active ? "bg-sky-50 ring-1 ring-inset ring-sky-200" : ""
                  }`}
                >
                  <p className="text-xs text-slate-500">{formatDate(item.created_at)}</p>
                  <p className="mt-0.5 truncate text-sm font-semibold text-slate-800">Appointment: {apptId}</p>
                  <p className="mt-1 line-clamp-1 text-xs text-slate-600">{item.chief_complaints || "Consultation record"}</p>
                </button>
              );
            })}
          </div>
        </div>

        <div className="rounded-xl border border-slate-200 bg-white p-4 space-y-4">
          {!selectedConsultation ? (
            <p className="text-sm text-slate-500">Select a consultation from the timeline.</p>
          ) : (
            <>
              <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
                <div className="rounded-lg border border-slate-200 bg-slate-50 p-3">
                  <p className="text-xs text-slate-500">Visit Date</p>
                  <p className="mt-1 text-sm font-semibold text-slate-900">{formatDate(selectedConsultation.created_at)}</p>
                </div>
                <div className="rounded-lg border border-slate-200 bg-slate-50 p-3">
                  <p className="text-xs text-slate-500">Follow-up</p>
                  <p className="mt-1 text-sm font-semibold text-slate-900">
                    {selectedConsultation.follow_up_date ? `${formatDate(selectedConsultation.follow_up_date)} ${selectedConsultation.follow_up_time || ""}` : "Not set"}
                  </p>
                </div>
                <div className="rounded-lg border border-slate-200 bg-slate-50 p-3">
                  <p className="text-xs text-slate-500">Amount Due</p>
                  <p className="mt-1 text-sm font-semibold text-slate-900">{formatCurrency(selectedConsultation.amount_due)}</p>
                </div>
              </div>

              <div className="space-y-3">
                <div>
                  <p className="mb-1 text-xs font-medium uppercase tracking-wide text-slate-500">Chief Complaints</p>
                  <div className="rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-800">{selectedConsultation.chief_complaints || "—"}</div>
                </div>
                <div>
                  <p className="mb-1 text-xs font-medium uppercase tracking-wide text-slate-500">Examination</p>
                  <div className="rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-800">{selectedConsultation.on_examination || "—"}</div>
                </div>
                <div>
                  <p className="mb-1 text-xs font-medium uppercase tracking-wide text-slate-500">Advice</p>
                  <div className="rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-800">{selectedConsultation.advice || "—"}</div>
                </div>
              </div>

              <div className="overflow-hidden rounded-xl border border-slate-200">
                <div className="bg-slate-50 px-3 py-2 text-xs font-semibold uppercase tracking-wide text-slate-600">Prescribed Medicines Per Day</div>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead className="border-b border-slate-200">
                      <tr>
                        <th className="px-3 py-2 text-left font-medium text-slate-600">Medicine</th>
                        <th className="px-3 py-2 text-left font-medium text-slate-600">Times</th>
                        <th className="px-3 py-2 text-left font-medium text-slate-600">Days</th>
                        <th className="px-3 py-2 text-left font-medium text-slate-600">Qty</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {prescriptions.length === 0 && (
                        <tr>
                          <td className="px-3 py-3 text-slate-500" colSpan={4}>No medicines added.</td>
                        </tr>
                      )}
                      {prescriptions.map((rx) => (
                        <tr key={rx.id || rx._id || `${rx.medicine_name}-${rx.times}`}>
                          <td className="px-3 py-2 text-slate-800">{rx.medicine_name || "—"}</td>
                          <td className="px-3 py-2 text-slate-700">{rx.times || "—"}</td>
                          <td className="px-3 py-2 text-slate-700">{rx.days || "—"}</td>
                          <td className="px-3 py-2 text-slate-700">{rx.quantity || "—"}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              <div className="overflow-hidden rounded-xl border border-slate-200">
                <div className="bg-slate-50 px-3 py-2 text-xs font-semibold uppercase tracking-wide text-slate-600">Procedures</div>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead className="border-b border-slate-200">
                      <tr>
                        <th className="px-3 py-2 text-left font-medium text-slate-600">Tooth</th>
                        <th className="px-3 py-2 text-left font-medium text-slate-600">Problems</th>
                        <th className="px-3 py-2 text-left font-medium text-slate-600">Solutions</th>
                        <th className="px-3 py-2 text-left font-medium text-slate-600">Cost</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {procedures.length === 0 && (
                        <tr>
                          <td className="px-3 py-3 text-slate-500" colSpan={4}>No procedures added.</td>
                        </tr>
                      )}
                      {procedures.map((proc) => (
                        <tr key={proc.id || proc._id || `${proc.tooth_number}-${proc.cost}`}>
                          <td className="px-3 py-2 text-slate-800">{proc.tooth_number || "—"}</td>
                          <td className="px-3 py-2 text-slate-700">{Array.isArray(proc.problems) ? proc.problems.join(", ") : "—"}</td>
                          <td className="px-3 py-2 text-slate-700">{Array.isArray(proc.solutions) ? proc.solutions.join(", ") : "—"}</td>
                          <td className="px-3 py-2 text-slate-700">{formatCurrency(proc.cost)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
