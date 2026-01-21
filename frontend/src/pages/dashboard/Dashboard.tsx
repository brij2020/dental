// src/pages/dashboard/Dashboard.tsx
import { useEffect, useState } from 'react';
import { DashboardStats } from './DashboardStats';
import { AppointmentCalendar } from './AppointmentCalendar';
import { supabase } from '../../lib/supabaseClient';
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
    // wait until we know clinic_id
    if (!user?.clinic_id) return;

    const fetchStats = async () => {
      setLoading(true);

      const { data, error } = await supabase.rpc('get_appointment_stats', {
        p_clinic_id: user.clinic_id,
        // p_date is optional; DB defaults to current_date
      });

      if (error) {
        console.error('Error fetching appointment stats:', error);
        setStats({ todays_appointments: 0, monthly_appointments: 0 });
      } else if (data && data.length > 0) {
        setStats({
          todays_appointments: Number(data[0].todays_appointments),
          monthly_appointments: Number(data[0].monthly_appointments),
        });
      } else {
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
