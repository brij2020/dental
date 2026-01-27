// features/appointments/Appointments.tsx
import React, { useState, useEffect, useCallback } from 'react';
import { toast } from 'react-toastify';
import { useAuth } from '../../state/useAuth';
import type { AppointmentDetails, MedicalCondition } from './types';
import AppointmentTable from './components/AppointmentTable';
import {
  getAppointments,
  updateAppointmentStatus,
  getMedicalConditionsByClinic,
  updateAppointmentMedicalConditions,
} from './api';

// --- SVG Icon (replaces @tabler/icons-react) ---
const IconSearch = (props: React.SVGProps<SVGSVGElement>) => (
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" strokeWidth="2" stroke="currentColor" fill="none" strokeLinecap="round" strokeLinejoin="round" {...props}>
        <path stroke="none" d="M0 0h24v24H0z" fill="none"></path>
        <path d="M10 10m-7 0a7 7 0 1 0 14 0a7 7 0 1 0 -14 0"></path>
        <path d="M21 21l-6 -6"></path>
    </svg>
);


// Re-creating a simplified SearchBar here to avoid dependency issues
type SearchBarProps = {
  value: string;
  onChange: (v: string) => void;
  disabled?: boolean;
  placeholder?: string;
};

function SearchBar({ value, onChange, disabled, placeholder }: SearchBarProps) {
  return (
    <div className="max-w-lg">
      <label className="sr-only">Search</label>
      <div className="relative">
        <span className="absolute inset-y-0 left-0 grid place-items-center pl-3 pointer-events-none">
          <IconSearch className="w-5 h-5 text-slate-400" />
        </span>
        <input
          type="text"
          value={value}
          disabled={disabled}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder || "Search..."}
          className="w-full py-2.5 pl-10 pr-3 text-slate-900 bg-white border border-slate-300 rounded-xl outline-none focus:ring-4 focus:ring-sky-300/40 focus:border-sky-400 transition disabled:opacity-60"
        />
      </div>
    </div>
  );
}


export default function Appointments() {
  const { user } = useAuth();
  const clinicId = user?.clinic_id ?? null;

  const [appointments, setAppointments] = useState<AppointmentDetails[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
const [clinicConditions, setClinicConditions] = useState<MedicalCondition[]>([]);
 const [, setConditionsLoading] = useState(false);

  // Returns today's date in IST (Asia/Kolkata) timezone
  const getTodayDateString = () => {
    const now = new Date();
    // Convert to IST by adding 5 hours 30 minutes (330 minutes)
    const istOffset = 330; // IST is UTC+5:30
    const utc = now.getTime() + (now.getTimezoneOffset() * 60000);
    const istTime = new Date(utc + (istOffset * 60000));
    const year = istTime.getFullYear();
    const month = String(istTime.getMonth() + 1).padStart(2, '0');
    const day = String(istTime.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };
  useEffect(() => {
    if (!clinicId) return;
    const load = async () => {
      try {
        setConditionsLoading(true);
        const list = await getMedicalConditionsByClinic(clinicId);
        setClinicConditions(list);
      } catch {
        // non-blocking
      } finally {
        setConditionsLoading(false);
      }
    };
    load();
  }, [clinicId]);
  const fetchAppointments = useCallback(async () => {
    if (!clinicId) {
      setLoading(false);
      return;
    }
    setLoading(true);
    try {
      const today = getTodayDateString();
      console.log("Fetching appointments for", clinicId, today, searchTerm);
      const data = await getAppointments(clinicId, today, searchTerm);
      setAppointments(data);
    } catch (error) {
      toast.error('Failed to fetch appointments.');
    } finally {
      setLoading(false);
    }
  }, [clinicId, searchTerm]);

  const handleUpdateConditions = async (appointmentId: string, names: string[]) => {
    // optimistic UI
    const prev = appointments;
    setAppointments(curr =>
      curr.map(a => (a.id === appointmentId ? { ...a, medical_conditions: names } : a))
    );
    try {
      await updateAppointmentMedicalConditions(appointmentId, names);
      toast.success('Medical conditions updated.');
    } catch (e) {
      setAppointments(prev); // rollback
      toast.error('Failed to update medical conditions.');
    }
  };

  useEffect(() => {
    // Using a timeout to debounce the search
    const handler = setTimeout(() => {
        fetchAppointments();
    }, 300); // 300ms delay

    return () => {
        clearTimeout(handler);
    };
  }, [searchTerm, fetchAppointments]);

  const handleStatusChange = async (appointmentId: string, newStatus: 'in-progress') => {
    try {
      setAppointments(currentAppointments =>
        currentAppointments.map(appt =>
          appt.id === appointmentId ? { ...appt, status: newStatus } : appt
        )
      );
      
      await updateAppointmentStatus(appointmentId, { status: newStatus });
      toast.success('Consultation started!');
    } catch (error) {
      toast.error('Failed to update status. Please try again.');
      fetchAppointments(); 
    }
  };

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-slate-800 mb-2">Today's Appointments</h1>
      <p className="text-slate-600 mb-6">View and manage the appointment queue for today.</p>

      <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
        <SearchBar
          value={searchTerm}
          onChange={setSearchTerm}
          disabled={!clinicId}
          placeholder="Search by Appointment ID..."
        />
        <AppointmentTable
          appointments={appointments}
          loading={loading}
          onStatusChange={handleStatusChange}
          clinicConditions={clinicConditions}
          onUpdateConditions={handleUpdateConditions}
        />
      </div>
    </div>
  );
}
