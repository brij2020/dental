// src/pages/dashboard/DashboardStats.tsx
import { IconCalendarTime, IconUsers } from '@tabler/icons-react';

type DashboardStatsProps = {
  todaysAppointments: number;
  monthlyAppointments: number;
  loading?: boolean;
};

export const DashboardStats = ({
  todaysAppointments,
  monthlyAppointments,
  loading = false,
}: DashboardStatsProps) => (
  <div className="grid gap-4 sm:grid-cols-2">
    <div className="rounded-2xl border bg-white p-6">
      <div className="flex items-center gap-3">
        <IconCalendarTime className="h-6 w-6 text-sky-500" />
        <div>
          <p className="text-sm text-slate-500">Today's Appointments</p>
          <p className="text-2xl font-semibold">
            {loading ? '...' : todaysAppointments}
          </p>
        </div>
      </div>
    </div>
    <div className="rounded-2xl border bg-white p-6">
      <div className="flex items-center gap-3">
        <IconUsers className="h-6 w-6 text-indigo-500" />
        <div>
          <p className="text-sm text-slate-500">Total Appointments (Month)</p>
          <p className="text-2xl font-semibold">
            {loading ? '...' : monthlyAppointments}
          </p>
        </div>
      </div>
    </div>
  </div>
);
