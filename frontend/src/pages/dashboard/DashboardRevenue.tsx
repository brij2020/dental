import React, { useEffect, useState } from 'react';
import { getAnalyticsOverview, getAnalyticsTrends, getConsultationsByClinicId } from '../../lib/apiClient';

type Props = { clinicId: string };

export default function DashboardRevenue({ clinicId }: Props) {
  const [loading, setLoading] = useState(true);
  const [todayRevenue, setTodayRevenue] = useState<number | null>(null);
  const [monthRevenue, setMonthRevenue] = useState<number | null>(null);
  const [sparkData, setSparkData] = useState<number[]>([]);

  useEffect(() => {
    if (!clinicId) return;
    const fetch = async () => {
      setLoading(true);
      try {
        const today = new Date();
        const yyyy = today.getFullYear();
        const mm = String(today.getMonth() + 1).padStart(2, '0');
        const dd = String(today.getDate()).padStart(2, '0');
        const todayStr = `${yyyy}-${mm}-${dd}`;

        // Try analytics overview first
        try {
          const resp = await getAnalyticsOverview(clinicId, todayStr);
          if (resp.data && resp.data.success && resp.data.data) {
            const d = resp.data.data;
            if (typeof d.revenue_today === 'number') setTodayRevenue(d.revenue_today);
            if (typeof d.revenue_month === 'number') setMonthRevenue(d.revenue_month);
          }
        } catch (e) {
          // ignore and fall back
        }

        // Try trends for last 7 days for sparkline
        try {
          const end = todayStr;
          const startDateObj = new Date();
          startDateObj.setDate(startDateObj.getDate() - 6);
          const s = `${startDateObj.getFullYear()}-${String(startDateObj.getMonth()+1).padStart(2,'0')}-${String(startDateObj.getDate()).padStart(2,'0')}`;
          const trendsResp = await getAnalyticsTrends(clinicId, 'revenue', s, end, 'day');
          if (trendsResp.data && trendsResp.data.success && trendsResp.data.data) {
            setSparkData(trendsResp.data.data.map((p: any) => Number(p.y || 0)));
          }
        } catch (e) {
          // ignore
        }

        // Fallback: compute revenue from consultations
        if (todayRevenue === null || monthRevenue === null) {
          try {
            const resp = await getConsultationsByClinicId(clinicId, { limit: 2000 });
            const consultations = resp.data && resp.data.success ? resp.data.data : [];
            let tRev = 0;
            let mRev = 0;
            const monthStart = `${yyyy}-${mm}-01`;
            consultations.forEach((c: any) => {
              const paid = Number(c.amount_paid || 0) || 0;
              const created = c.created_at ? String(c.created_at).slice(0,10) : null;
              if (created === todayStr) tRev += paid;
              if (created >= monthStart && created <= todayStr) mRev += paid;
            });
            if (todayRevenue === null) setTodayRevenue(tRev);
            if (monthRevenue === null) setMonthRevenue(mRev);
          } catch (e) {
            // no-op
          }
        }
      } finally {
        setLoading(false);
      }
    };
    fetch();
  }, [clinicId]);

  const percentOfTarget = (() => {
    // simple target heuristic: monthly target = 100000 (configurable later)
    const target = 100000;
    if (!monthRevenue) return 0;
    return Math.min(100, Math.round((monthRevenue / target) * 100));
  })();

  return (
    <div className="rounded-2xl border bg-white p-4 sm:p-6">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm text-slate-600">Revenue</p>
          <p className="text-2xl font-semibold">{loading ? '...' : `₹${(todayRevenue ?? 0).toLocaleString()}`} <span className="text-sm text-slate-400">today</span></p>
          <p className="text-sm text-slate-500">This month: ₹{(monthRevenue ?? 0).toLocaleString()}</p>
        </div>
        <div className="flex items-center gap-4">
          <div style={{ width: 72, height: 72 }} aria-hidden>
            <svg viewBox="0 0 36 36" className="w-18 h-18">
              <path d="M18 2.0845a15.9155 15.9155 0 1 0 0 31.831 15.9155 15.9155 0 1 0 0-31.831" fill="#eee" />
              <path d="M18 2.0845a15.9155 15.9155 0 0 1 0 31.831" fill="none" stroke="#e5e7eb" strokeWidth="4" />
              <path d="M18 2.0845a15.9155 15.9155 0 0 1 0 31.831" fill="none" stroke="#10b981" strokeWidth="4" strokeDasharray={`${percentOfTarget} 100`} transform="rotate(-90 18 18)" />
              <text x="18" y="20" fontSize="6" textAnchor="middle" fill="#0f172a">{percentOfTarget}%</text>
            </svg>
          </div>
          <div className="w-36 h-8" aria-hidden>
            <Sparkline data={sparkData} color="#10b981" />
          </div>
        </div>
      </div>
    </div>
  );
}

function Sparkline({ data, color = '#0ea5e9' }: { data: number[]; color?: string }) {
  const width = 120;
  const height = 28;
  if (!data || data.length === 0) return <svg width={width} height={height} />;
  const max = Math.max(...data);
  const min = Math.min(...data);
  const range = max - min || 1;
  const points = data.map((v, i) => {
    const x = (i / (data.length - 1 || 1)) * width;
    const y = height - ((v - min) / range) * (height - 4) - 2;
    return `${x},${y}`;
  }).join(' ');
  return (
    <svg width={width} height={height} viewBox={`0 0 ${width} ${height}`} preserveAspectRatio="none">
      <polyline fill="none" stroke={color} strokeWidth={2} points={points} strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}
