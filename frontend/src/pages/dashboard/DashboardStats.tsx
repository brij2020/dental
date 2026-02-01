// src/pages/dashboard/DashboardStats.tsx

import { IconCalendarTime, IconUsers } from '@tabler/icons-react';

type TrendPoint = { x: string; y: number };

type DashboardStatsProps = {
  todaysAppointments: number;
  monthlyAppointments: number;
  loading?: boolean;
  todaysConsultations?: number;
  completedConsultationsToday?: number;
  pendingBilling?: number;
  appointmentsTrend?: TrendPoint[];
  consultationsTrend?: TrendPoint[];
};

export const DashboardStats = ({
  todaysAppointments,
  monthlyAppointments,
  loading = false,
  todaysConsultations = 0,
  completedConsultationsToday = 0,
  pendingBilling = 0,
  appointmentsTrend = [],
  consultationsTrend = [],
}: DashboardStatsProps) => (
  <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
    {/* Tile 1: Today's Appointments */}
    <div className="relative rounded-2xl border bg-white p-4 sm:p-6 hover:shadow-lg transition-shadow cursor-pointer focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-sky-200" role="button" aria-labelledby="tile-appointments" tabIndex={0}>
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-md bg-sky-50 text-sky-600">
            <IconCalendarTime className="h-5 w-5" aria-hidden />
          </div>
          <div>
            <p id="tile-appointments" className="text-sm font-medium text-slate-700">Today's Appointments</p>
            <p className="text-2xl font-extrabold text-slate-900">{loading ? '...' : todaysAppointments}</p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <div className="w-28 h-8" aria-hidden>
            {appointmentsTrend && appointmentsTrend.length > 0 ? (
              <Sparkline data={appointmentsTrend.map(p => p.y)} color="#0369A1" label="Appointments trend" />
            ) : (
              <div className="text-xs text-slate-400">no data</div>
            )}
          </div>
          <ChangeBadge data={appointmentsTrend.map(p => p.y)} color="#0369A1" ariaLabelPrefix="Appointments change" />
        </div>
      </div>
    </div>

    {/* Tile 2: Monthly Appointments */}
    <div className="relative rounded-2xl border bg-white p-4 sm:p-6 hover:shadow-lg transition-shadow cursor-pointer focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-200" role="button" aria-labelledby="tile-monthly" tabIndex={0}>
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-md bg-indigo-50 text-indigo-700">
            <IconUsers className="h-5 w-5" aria-hidden />
          </div>
          <div>
            <p id="tile-monthly" className="text-sm font-medium text-slate-700">Monthly Appointments</p>
            <p className="text-2xl font-extrabold text-slate-900">{loading ? '...' : monthlyAppointments}</p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <div className="w-28 h-8" aria-hidden>
            {appointmentsTrend && appointmentsTrend.length > 0 ? (
              <Sparkline data={appointmentsTrend.map(p => p.y)} color="#4F46E5" label="Monthly appointments trend" />
            ) : (
              <div className="text-xs text-slate-400">no data</div>
            )}
          </div>
          <ChangeBadge data={appointmentsTrend.map(p => p.y)} color="#4F46E5" ariaLabelPrefix="Monthly appointments change" />
        </div>
      </div>
    </div>

    {/* Tile 3: Consultations Today */}
    <div className="relative rounded-2xl border bg-white p-4 sm:p-6 hover:shadow-lg transition-shadow cursor-pointer focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-emerald-200" role="button" aria-labelledby="tile-consultations" tabIndex={0}>
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-md bg-emerald-50 text-emerald-700">
            <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" aria-hidden><path d="M12 20v-6" /><circle cx="12" cy="8" r="3" /></svg>
          </div>
          <div>
            <p id="tile-consultations" className="text-sm font-medium text-slate-700">Consultations Today</p>
            <p className="text-2xl font-extrabold text-slate-900">{loading ? '...' : todaysConsultations}</p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <div className="w-28 h-8" aria-hidden>
            {consultationsTrend && consultationsTrend.length > 0 ? (
              <Sparkline data={consultationsTrend.map(p => p.y)} color="#047857" label="Consultations trend" />
            ) : (
              <div className="text-xs text-slate-400">no data</div>
            )}
          </div>
          <ChangeBadge data={consultationsTrend.map(p => p.y)} color="#047857" ariaLabelPrefix="Consultations change" />
        </div>
      </div>
    </div>

    {/* Tile 4: Completed Today */}
    <div className="relative rounded-2xl border bg-white p-4 sm:p-6 hover:shadow-lg transition-shadow cursor-pointer focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-200" role="button" aria-labelledby="tile-completed" tabIndex={0}>
      <div className="flex items-center gap-3">
        <div className="p-2 rounded-md bg-green-50 text-green-700">
          <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" aria-hidden><path d="M5 12l4 4L19 6" /></svg>
        </div>
        <div>
          <p id="tile-completed" className="text-sm font-medium text-slate-700">Completed Today</p>
          <p className="text-2xl font-extrabold text-slate-900">{loading ? '...' : completedConsultationsToday}</p>
        </div>
      </div>
    </div>

    {/* Tile 5: Pending Billing */}
    <div className="relative rounded-2xl border bg-white p-4 sm:p-6 hover:shadow-lg transition-shadow cursor-pointer focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-rose-200" role="button" aria-labelledby="tile-pending" tabIndex={0}>
      <div className="flex items-center gap-3">
        <div className="p-2 rounded-md bg-rose-50 text-rose-700">
          <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" aria-hidden><path d="M12 8v4l3 3" /></svg>
        </div>
        <div>
          <p id="tile-pending" className="text-sm font-medium text-slate-700">Pending Billing</p>
          <p className="text-2xl font-extrabold text-slate-900">{loading ? '...' : pendingBilling}</p>
        </div>
      </div>
    </div>
  </div>
);

function Sparkline({ data, color = '#0ea5e9', label }: { data: number[]; color?: string; label?: string }) {
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
    <svg width={width} height={height} viewBox={`0 0 ${width} ${height}`} preserveAspectRatio="none" role="img" aria-label={label ?? 'sparkline'}>
      <polyline fill="none" stroke={color} strokeWidth={2} points={points} strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function ChangeBadge({ data, color = '#0ea5e9', ariaLabelPrefix }: { data: number[]; color?: string; ariaLabelPrefix?: string }) {
  if (!data || data.length < 2) return <div className="text-xs text-slate-400" aria-hidden>—</div>;
  const last = data[data.length - 1] ?? 0;
  const prev = data[data.length - 2] ?? 0;
  const diff = last - prev;
  const pct = prev === 0 ? (diff === 0 ? 0 : 100) : (diff / Math.abs(prev)) * 100;
  const up = pct > 0;
  const absPct = Math.abs(Math.round(pct));
  const ariaLabel = `${ariaLabelPrefix ?? 'Change'}: ${up ? 'up' : 'down'} ${absPct} percent`;
  return (
    <div className={`text-xs font-semibold ${up ? 'text-emerald-600' : 'text-rose-600'}`} aria-label={ariaLabel}>
      {up ? '▲' : '▼'} {absPct}%
    </div>
  );
}
