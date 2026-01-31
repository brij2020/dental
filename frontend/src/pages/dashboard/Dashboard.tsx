// src/pages/dashboard/Dashboard.tsx
import { useEffect, useState } from 'react';
import { DashboardStats } from './DashboardStats';
import { AppointmentCalendar } from './AppointmentCalendar';
import { getTodaysAppointmentCount, getMonthlyAppointmentCount, getConsultationsByClinicId, getAnalyticsOverview } from '../../lib/apiClient';
import DashboardTrends from './DashboardTrends';
import DashboardRevenue from './DashboardRevenue';
import NoticeBoard from './NoticeBoard';
import { useAuth } from '../../state/useAuth';

type Stats = {
  todays_appointments: number;
  monthly_appointments: number;
  todays_consultations: number;
  completed_consultations_today: number;
  pending_billing: number;
};

export default function Dashboard() {
  const { user } = useAuth();
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(true);
  const [appointmentsTrend, setAppointmentsTrend] = useState<any[]>([]);
  const [consultationsTrend, setConsultationsTrend] = useState<any[]>([]);


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

        // Prefer backend analytics overview
        try {
          const resp = await getAnalyticsOverview(clinicId, todayStr);
          if (resp.data && resp.data.success && resp.data.data) {
            const d = resp.data.data;
            setStats({
              todays_appointments: d.todays_appointments || 0,
              monthly_appointments: d.monthly_appointments || 0,
              todays_consultations: d.todays_consultations || 0,
              completed_consultations_today: d.completed_consultations || 0,
              pending_billing: d.pending_billing || 0,
            });
            setLoading(false);
            return;
          }
        } catch (e) {
          console.warn('Analytics overview request failed, falling back to local queries', e.message || e);
        }

        // Also try to fetch simple 7-day trends for sparklines (non-blocking)
        let triedAnalyticsTrends = false;
        try {
          const end = todayStr;
          const startDateObj = new Date();
          startDateObj.setDate(startDateObj.getDate() - 6);
          const s = `${startDateObj.getFullYear()}-${String(startDateObj.getMonth()+1).padStart(2,'0')}-${String(startDateObj.getDate()).padStart(2,'0')}`;
          const apptResp = await getAnalyticsTrends(clinicId, 'appointments', s, end, 'day');
          const consResp = await getAnalyticsTrends(clinicId, 'consultations', s, end, 'day');
          if (apptResp.data && apptResp.data.success && apptResp.data.data) setAppointmentsTrend(apptResp.data.data);
          if (consResp.data && consResp.data.success && consResp.data.data) setConsultationsTrend(consResp.data.data);
          triedAnalyticsTrends = true;
        } catch (e) {
          // non-blocking
          console.warn('analytics/trends failed:', e?.message || e);
        }

        // If analytics trends were not available, compute simple 7-day trends from existing endpoints
        if (!triedAnalyticsTrends) {
          try {
            const end = todayStr;
            const startDateObj = new Date();
            startDateObj.setDate(startDateObj.getDate() - 6);
            const s = `${startDateObj.getFullYear()}-${String(startDateObj.getMonth()+1).padStart(2,'0')}-${String(startDateObj.getDate()).padStart(2,'0')}`;

            // Appointments: fetch appointments in range and group by appointment_date
            try {
              const apptsResp = await getClinicAppointments(clinicId, { startDate: s, endDate: end });
              const appts = apptsResp.data && apptsResp.data.success ? apptsResp.data.data : [];
              const mapAppt: Record<string, number> = {};
              appts.forEach((a: any) => {
                const d = a.appointment_date;
                mapAppt[d] = (mapAppt[d] || 0) + 1;
              });
              const days: any[] = [];
              for (let i = 0; i < 7; i++) {
                const dt = new Date(startDateObj);
                dt.setDate(startDateObj.getDate() + i);
                const yyyy = dt.getFullYear();
                const mm = String(dt.getMonth() + 1).padStart(2, '0');
                const dd = String(dt.getDate()).padStart(2, '0');
                const key = `${yyyy}-${mm}-${dd}`;
                days.push({ x: key, y: mapAppt[key] || 0 });
              }
              setAppointmentsTrend(days);
            } catch (e) {
              // ignore
            }

            // Consultations: we already fetched consultations below for aggregates; reuse if present
            try {
              const resp = await getConsultationsByClinicId(clinicId, { limit: 1000 });
              const consultations = resp.data && resp.data.success ? resp.data.data : [];
              const mapCons: Record<string, number> = {};
              consultations.forEach((c: any) => {
                const created = c.created_at ? String(c.created_at).slice(0,10) : null;
                if (created && created >= s && created <= end) {
                  mapCons[created] = (mapCons[created] || 0) + 1;
                }
              });
              const consDays: any[] = [];
              for (let i = 0; i < 7; i++) {
                const dt = new Date(startDateObj);
                dt.setDate(startDateObj.getDate() + i);
                const yyyy = dt.getFullYear();
                const mm = String(dt.getMonth() + 1).padStart(2, '0');
                const dd = String(dt.getDate()).padStart(2, '0');
                const key = `${yyyy}-${mm}-${dd}`;
                consDays.push({ x: key, y: mapCons[key] || 0 });
              }
              setConsultationsTrend(consDays);
            } catch (e) {
              // ignore
            }
          } catch (e) {
            // ignore
          }
        }

        // Fallback: compute using existing endpoints
        const startOfMonth = `${yyyy}-${mm}-01`;
        const endOfMonth = todayStr;
        const todays_appointments = await getTodaysAppointmentCount(clinicId, todayStr);
        const monthly_appointments = await getMonthlyAppointmentCount(clinicId, startOfMonth, endOfMonth);

        // Fetch consultations for clinic and compute aggregates for today
        let todays_consultations = 0;
        let completed_consultations_today = 0;
        let pending_billing = 0;
        try {
          const resp = await getConsultationsByClinicId(clinicId, { limit: 1000 });
          const consultations = resp.data && resp.data.success ? resp.data.data : [];
          consultations.forEach((c: any) => {
            const created = c.created_at ? String(c.created_at).slice(0,10) : null;
            if (created === todayStr) {
              todays_consultations += 1;
              if (String(c.status) === 'Completed') completed_consultations_today += 1;
            }
            if ((c.amount_due || 0) > 0) pending_billing += 1;
          });
        } catch (e) {
          console.warn('Failed to fetch consultations for dashboard aggregates', e);
        }

        setStats({ todays_appointments, monthly_appointments, todays_consultations, completed_consultations_today, pending_billing });
      } catch (err) {
        console.error('Error fetching appointment stats:', err);
        setStats({ todays_appointments: 0, monthly_appointments: 0, todays_consultations: 0, completed_consultations_today: 0, pending_billing: 0 });
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
        todaysConsultations={stats?.todays_consultations ?? 0}
        completedConsultationsToday={stats?.completed_consultations_today ?? 0}
        pendingBilling={stats?.pending_billing ?? 0}
        loading={loading}
        appointmentsTrend={appointmentsTrend}
        consultationsTrend={consultationsTrend}
      />

      <div className="grid gap-4 md:grid-cols-3">
        <NoticeBoard clinicId={user?.clinic_id ?? ''} />
        <DashboardRevenue clinicId={user?.clinic_id ?? ''} />
        <DashboardTrends clinicId={user?.clinic_id ?? ''} />
      </div>

      <AppointmentCalendar />
    </div>
  );
}
