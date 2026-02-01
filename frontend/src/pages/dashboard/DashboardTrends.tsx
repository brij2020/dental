import { useEffect, useState } from 'react';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
  Legend,
} from 'recharts';
import { getAnalyticsTrends } from '../../lib/apiClient';

type Point = { x: string; y: number };

export default function DashboardTrends({ clinicId }: { clinicId: string }) {
  const [appointments, setAppointments] = useState<Point[]>([]);
  const [consultations, setConsultations] = useState<Point[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!clinicId) return;
    const fetch = async () => {
      setLoading(true);
      try {
        const end = new Date();
        const start = new Date();
        start.setDate(end.getDate() - 29);
        const format = (d: Date) => `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`;
        const s = format(start);
        const e = format(end);

        const apptResp = await getAnalyticsTrends(clinicId, 'appointments', s, e, 'day');
        const consResp = await getAnalyticsTrends(clinicId, 'consultations', s, e, 'day');

        const appts = apptResp.data && apptResp.data.success ? apptResp.data.data : [];
        const cons = consResp.data && consResp.data.success ? consResp.data.data : [];

        // merge by x to ensure same x-axis
        const map: Record<string, { x: string; appointments: number; consultations: number }> = {};
        appts.forEach((p: Point) => { map[p.x] = { x: p.x, appointments: p.y || 0, consultations: 0 }; });
        cons.forEach((p: Point) => { map[p.x] = { ...(map[p.x] || { x: p.x, appointments: 0, consultations: 0 }), consultations: p.y || 0 }; });

        // fill missing dates in range
        const out: any[] = [];
        for (let d = new Date(start); d <= end; d.setDate(d.getDate()+1)) {
          const key = format(new Date(d));
          const entry = map[key] || { x: key, appointments: 0, consultations: 0 };
          out.push(entry);
        }

        setAppointments(out.map(o => ({ x: o.x, y: o.appointments })));
        setConsultations(out.map(o => ({ x: o.x, y: o.consultations })));
      } catch (err) {
        console.warn('Failed to load trends', err);
      } finally {
        setLoading(false);
      }
    };
    fetch();
  }, [clinicId]);

  // prepare combined data for chart
  const combined = appointments.map((p, i) => ({ date: p.x, appointments: p.y, consultations: consultations[i]?.y ?? 0 }));

  return (
    <div className="h-full">
      <div className="rounded-2xl border bg-white p-4 h-full flex flex-col">
        <h3 className="text-sm font-semibold mb-2">30-day Trends</h3>
        {loading ? (
          <div className="text-sm text-slate-500">Loading trends...</div>
        ) : (
          <div className="flex-1 min-h-[240px]">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={combined} margin={{ top: 8, right: 20, left: 0, bottom: 8 }}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="date" tick={{ fontSize: 11 }} />
                <YAxis />
                <Tooltip />
                <Legend />
                <Line type="monotone" dataKey="appointments" stroke="#0ea5e9" dot={false} />
                <Line type="monotone" dataKey="consultations" stroke="#10b981" dot={false} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        )}
      </div>
    </div>
  );
}
