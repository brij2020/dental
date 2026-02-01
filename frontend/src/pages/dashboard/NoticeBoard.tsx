import { useEffect, useState } from 'react';
import { getDoctorLeavesByClinic, getProfileById, getClinicById } from '../../lib/apiClient';
import fallbackAvatar from '../../assets/spai.jpeg';

type Leave = {
  _id: string;
  doctor_id: string;
  doctor_name?: string;
  clinic_id?: string;
  leave_start_date?: string; // YYYY-MM-DD
  leave_end_date?: string; // YYYY-MM-DD
  date?: string;
  reason?: string;
};

function datePlusDays(base: Date, days: number) {
  const d = new Date(base);
  d.setDate(d.getDate() + days);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

export default function NoticeBoard({ clinicId }: { clinicId?: string }) {
  const [loading, setLoading] = useState(true);
  const [items, setItems] = useState<Leave[]>([]);
  const [rawResp, setRawResp] = useState<any>(null);
  const [showRaw, setShowRaw] = useState(false);
  const [clinicName, setClinicName] = useState<string | null>(null);

  useEffect(() => {
    if (!clinicId) return;
    // fetch clinic name for display
    (async () => {
      try {
        const c = await getClinicById();
        const data = c?.data?.data || c?.data;
        if (data && data.name) setClinicName(data.name);
      } catch (e) {
        // ignore
      }
    })();
    const fetch = async () => {
      setLoading(true);
      try {
        const resp = await getDoctorLeavesByClinic(clinicId);
        setRawResp(resp);
        const leaves: Leave[] = resp.data && resp.data.success ? resp.data.data : (Array.isArray(resp.data) ? resp.data : []);

        // Normalize leaves: accept records that may use `date` for single-day leaves
        const normalized = leaves.map(l => {
          const copy = { ...l } as any;
          if (!copy.leave_start_date && copy.date) {
            copy.leave_start_date = copy.date;
            copy.leave_end_date = copy.date;
          }
          // If day is present but date missing, leave as-is (can't resolve weekday to date)
          return copy;
        });

        // Filter leaves that overlap today..today+3
        const today = new Date();
        const windowStart = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;
        const windowEnd = datePlusDays(today, 3);

        const withinWindow = normalized.filter((l: any) => {
          if (!l.leave_start_date || !l.leave_end_date) return false;
          return !(l.leave_end_date < windowStart || l.leave_start_date > windowEnd);
        });

        // Resolve doctor names by fetching profiles for unique doctor_ids
        const doctorIds = Array.from(new Set(withinWindow.map(w => w.doctor_id).filter(Boolean)));
        const nameMap: Record<string, string> = {};
        const picMap: Record<string, string> = {};
        const phoneMap: Record<string, string> = {};
        await Promise.all(doctorIds.map(async (id) => {
          try {
            const resp = await getProfileById(id);
            if (resp && resp.data) {
              const p = resp.data.data || resp.data;
              nameMap[id] = p?.full_name || p?.name || p?.displayName || p?.fullName || id;
              picMap[id] = p?.profile_pic || p?.profilePic || p?.profile_pic_url || '';
              phoneMap[id] = p?.mobile_number || p?.mobile || p?.phone || '';
            }
          } catch (e) {
            nameMap[id] = id;
          }
        }));

        // Attach resolved names and pics, sort by start date and limit to 10
        withinWindow.forEach(w => {
          w.doctor_name = nameMap[w.doctor_id] || w.doctor_name || w.doctor_id;
          (w as any).doctor_pic = picMap[w.doctor_id] || (w as any).doctor_pic || '';
          (w as any).doctor_mobile = phoneMap[w.doctor_id] || (w as any).doctor_mobile || '';
        });
        withinWindow.sort((a, b) => a.leave_start_date.localeCompare(b.leave_start_date));
        setItems(withinWindow.slice(0, 10));
      } catch (e) {
        console.warn('Failed to fetch clinic leaves', e?.message || e);
        setRawResp({ error: (e && e.message) || String(e) });
        setItems([]);
      } finally {
        setLoading(false);
      }
    };
    fetch();
  }, [clinicId]);

  const todayStr = (() => {
    const d = new Date();
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
  })();
  const tomorrowStr = (() => {
    const d = new Date();
    d.setDate(d.getDate() + 1);
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
  })();

  return (
    <div className="rounded-2xl border bg-white p-4 sm:p-6 h-full flex flex-col">
      <h2 className="text-sm font-semibold text-slate-700 mb-2">Notice Board</h2>
      <p className="text-xs text-slate-500 mb-3">Staff leave (today → next 3 days)</p>
      {loading ? (
        <div className="text-sm text-slate-500">{clinicName ? clinicName : 'Loading…'}</div>
        ) : items.length === 0 ? (
        <div>
          <div className="text-sm text-slate-500">No upcoming leaves</div>
          <div className="mt-2 text-xs text-slate-400">Fetched: {rawResp ? (rawResp.data && rawResp.data.data ? (rawResp.data.data.length) : (rawResp.data ? JSON.stringify(rawResp.data).slice(0,80) : '0')) : 'no response'}</div>
          <button onClick={() => setShowRaw(s => !s)} className="mt-2 text-xs text-sky-600">{showRaw ? 'Hide' : 'Show'} raw response</button>
          {showRaw && <pre className="mt-2 text-xs text-slate-500 overflow-auto max-h-40 bg-slate-50 p-2 rounded">{JSON.stringify(rawResp, null, 2)}</pre>}
        </div>
      ) : (
        <div className="overflow-y-auto scroll-smooth max-h-48">
          <ul className="space-y-2">
          {items.map((l) => {
            const isToday = l.leave_start_date === todayStr;
            const isTomorrow = l.leave_start_date === tomorrowStr;
            return (
              <li key={l._id} className={`flex items-start gap-3 p-2 rounded ${isToday ? 'ring-1 ring-red-200' : isTomorrow ? 'ring-1 ring-yellow-100' : ''}`} aria-current={isToday ? 'true' : undefined}>
                <div className="flex-none">
                  <img
                    src={(l as any).doctor_pic ? (l as any).doctor_pic : fallbackAvatar}
                    onError={(e) => { (e.target as HTMLImageElement).src = fallbackAvatar; }}
                    alt={l.doctor_name || l.doctor_id || 'Staff'}
                    className={`w-10 h-10 rounded-full object-cover ring-1 ${isToday ? 'ring-red-200' : isTomorrow ? 'ring-yellow-100' : 'ring-white/20'}`}
                  />
                </div>
                <div className="flex-1">
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="text-sm font-medium text-slate-800">{l.doctor_name || l.doctor_id}</div>
                      {(l as any).doctor_mobile ? <div className="text-xs text-slate-500">{(l as any).doctor_mobile}</div> : null}
                    </div>
                    <div className="text-xs text-slate-500">{l.leave_start_date}{l.leave_end_date && l.leave_end_date !== l.leave_start_date ? ` → ${l.leave_end_date}` : ''}</div>
                  </div>
                  {l.reason ? <div className="text-xs text-slate-500">{l.reason}</div> : null}
                </div>
              </li>
            );
          })}
          </ul>
        </div>
      )}
    </div>
  );
}
