// src/pages/dashboard/Dashboard.tsx
import { useEffect, useState } from 'react';
import { DashboardStats } from './DashboardStats';
import { AppointmentCalendar } from './AppointmentCalendar';
import { getTodaysAppointmentCount, getMonthlyAppointmentCount } from '../../lib/apiClient';
import { useAuth } from '../../state/useAuth';

type Stats = {
  todays_appointments: number;
  monthly_appointments: number;
};

export default function Dashboard() {
  const { user } = useAuth();
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(true);


  useEffect(() => {
    const clinicId = user?.clinic_id ?? '';
    if (!clinicId) return;
    const fetchStats = async () => {
      setLoading(true);
      try {
        const today = new Date();
        const yyyy = today.getFullYear();
        const mm = String(today.getMonth() + 1).padStart(2, '0');
        const dd = String(today.getDate()).padStart(2, '0');
        const todayStr = `${yyyy}-${mm}-${dd}`;
        const startOfMonth = `${yyyy}-${mm}-01`;
        const endOfMonth = todayStr;
        const todays_appointments = await getTodaysAppointmentCount(clinicId, todayStr);
        const monthly_appointments = await getMonthlyAppointmentCount(clinicId, startOfMonth, endOfMonth);
        setStats({ todays_appointments, monthly_appointments });
      } catch (err) {
        console.error('Error fetching appointment stats:', err);
        setStats({ todays_appointments: 0, monthly_appointments: 0 });
      }
      setLoading(false);
    };
    fetchStats();
  }, [user?.clinic_id]);

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-semibold">Dashboard</h1>

      <DashboardStats
        todaysAppointments={stats?.todays_appointments ?? 0}
        monthlyAppointments={stats?.monthly_appointments ?? 0}
        loading={loading}
      />


      <AppointmentCalendar />
    </div>
  );
}
