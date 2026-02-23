import  { useMemo, useState, useRef, useEffect } from "react";
import {
  IconChevronDown,
  IconChevronLeft,
  IconChevronRight,
  IconCalendar,
  IconChevronUp,
} from "@tabler/icons-react";
import {
  addDays,
  subDays,
  format,
  isToday,
  startOfMonth,
  endOfMonth,
  startOfWeek,
  endOfWeek,
  addMonths,
  isSameDay,
  isSameMonth,
} from "date-fns";

// ⬇️ Supabase (client-side). If you use a different client import, swap this line accordingly.
import { getClinicAppointments, getAllProfiles, getDoctorLeavesByClinic } from '../../lib/apiClient';
import { useAuth } from '../../state/useAuth';

// --- TYPES (kept minimal to avoid UI changes) ---
type Doctor = { id: string; name: string };

type Appointment = {
  id: string;
  doctorId: Doctor["id"];
  patientName: string;
  timeHHmm: string; // "HH:mm"
};

type DaySlot = { start: string; end: string; is_off: boolean };
export type AvailabilityDay = { day: string; morning: DaySlot; evening: DaySlot };
export type Availability = AvailabilityDay[];

// --- UTILS ---
const toTimeStr = (d: Date) => format(d, "HH:mm");

const generateTimeSlots = (startHHmm: string, endHHmm: string, intervalMins: number): string[] => {
  if (!startHHmm || !endHHmm) return [];
  const slots: string[] = [];
  const [sh, sm] = startHHmm.split(":").map(Number);
  const [eh, em] = endHHmm.split(":").map(Number);
  const day = new Date();
  day.setHours(0, 0, 0, 0);
  const start = new Date(day);
  start.setHours(sh, sm, 0, 0);
  const end = new Date(day);
  end.setHours(eh, em, 0, 0);
  if (isNaN(start.getTime()) || isNaN(end.getTime()) || intervalMins <= 0) return [];
  const cur = new Date(start);
  while (cur < end) {
    slots.push(toTimeStr(cur));
    cur.setMinutes(cur.getMinutes() + intervalMins);
  }
  return slots;
};

// Click outside helper
function useClickOutside<T extends HTMLElement>(open: boolean, onClose: () => void) {
  const ref = useRef<T | null>(null);
  useEffect(() => {
    if (!open) return;
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) onClose();
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [open, onClose]);
  return ref;
}

// --- MINI MONTH PICKER ---
function MiniMonthPicker({
  selectedDate,
  onSelect,
  onClose,
}: {
  selectedDate: Date;
  onSelect: (d: Date) => void;
  onClose: () => void;
}) {
  const [viewMonth, setViewMonth] = useState(startOfMonth(selectedDate));

  const weeks = useMemo(() => {
    const start = startOfWeek(startOfMonth(viewMonth), { weekStartsOn: 0 });
    const end = endOfWeek(endOfMonth(viewMonth), { weekStartsOn: 0 });
    const days: Date[] = [];
    let cur = start;
    while (cur <= end) {
      days.push(cur);
      cur = addDays(cur, 1);
    }
    return Array.from({ length: Math.ceil(days.length / 7) }, (_, w) =>
      days.slice(w * 7, w * 7 + 7)
    );
  }, [viewMonth]);

  return (
    <div className="w-80 rounded-2xl border border-slate-200 bg-white p-3 shadow-xl">
      <div className="flex items-center justify-between px-1 pb-2">
        <button
          onClick={() => setViewMonth(addMonths(viewMonth, -1))}
          className="p-2 rounded-lg hover:bg-slate-100"
          aria-label="Previous month"
        >
          <IconChevronLeft className="h-5 w-5 text-slate-700" />
        </button>
        <div className="text-sm font-semibold text-slate-900">
          {format(viewMonth, "MMMM yyyy")}
        </div>
        <button
          onClick={() => setViewMonth(addMonths(viewMonth, 1))}
          className="p-2 rounded-lg hover:bg-slate-100"
          aria-label="Next month"
        >
          <IconChevronRight className="h-5 w-5 text-slate-700" />
        </button>
      </div>

      <div className="grid grid-cols-7 gap-1 text-xs font-medium text-slate-500 px-1">
        {"SMTWTFS".split("").map((d, i) => (
          <div key={i} className="text-center py-1">
            {d}
          </div>
        ))}
      </div>

      <div className="mt-1 grid grid-cols-7 gap-1 px-1">
        {weeks.flat().map((day, idx) => {
          const isSelected = isSameDay(day, selectedDate);
          const muted = !isSameMonth(day, viewMonth);
          const today = isToday(day);
          return (
            <button
              key={idx}
              onClick={() => {
                onSelect(day);
                onClose();
              }}
              className={[
                "aspect-square rounded-xl text-sm transition focus:outline-none focus:ring-2 focus:ring-sky-300",
                "flex items-center justify-center",
                muted ? "text-slate-300" : "text-slate-700",
                isSelected ? "bg-indigo-600 text-white font-semibold" : today ? "border border-indigo-300" : "hover:bg-slate-100",
              ].join(" ")}
              aria-label={`Choose ${format(day, "PPP")}`}
            >
              {format(day, "d")}
            </button>
          );
        })}
      </div>
    </div>
  );
}

// --- UI PARTS ---
function Legend() {
  return (
    <div className="flex items-center gap-4 text-xs text-slate-600">
      <div className="flex items-center gap-2"><span className="h-3 w-3 rounded bg-rose-200 border border-rose-300" /> Booked</div>
      <div className="flex items-center gap-2"><span className="h-3 w-3 rounded bg-emerald-100 border border-emerald-300" /> Free</div>
      <div className="flex items-center gap-2"><span className="h-3 w-3 rounded border border-dashed border-slate-400" /> Current time window</div>
    </div>
  );
}

function DoctorSelector({ doctors, selected, onChange }: { doctors: readonly Doctor[]; selected: Doctor; onChange: (d: Doctor) => void }) {
  return (
    <div className="relative inline-block">
      <select
        value={selected.id}
        onChange={(e) => {
          const d = doctors.find((x) => x.id === e.target.value)!;
          onChange(d);
        }}
        className="appearance-none w-full md:w-auto rounded-xl border border-slate-300 bg-white pl-4 pr-10 py-2.5 text-slate-900 font-medium outline-none focus:ring-4 focus:ring-sky-300/40 focus:border-sky-400 transition"
      >
        {doctors.map((d) => (
          <option key={d.id} value={d.id}>
            {d.name}
          </option>
        ))}
      </select>
      <IconChevronDown className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400" />
    </div>
  );
}

function TimeSlot({ time, appointment, doctorName }: { time: string; appointment?: Appointment; doctorName: string }) {
  const hasApt = Boolean(appointment);
  const base = "relative rounded-lg border p-3 text-sm text-center cursor-pointer transition-colors";
  const booked = "border-rose-300 bg-rose-100 text-rose-800 font-semibold hover:bg-rose-200";
  const free = "border-emerald-300 bg-emerald-50 text-emerald-700 hover:bg-emerald-100";

  return (
    <div className={[base, hasApt ? booked : free, "group"].join(" ")}>
      {time}
      {hasApt && (
        <div className="pointer-events-none absolute left-1/2 -top-2 z-20 w-max -translate-x-1/2 -translate-y-full rounded-lg bg-slate-800 px-3 py-1.5 text-xs text-white opacity-0 shadow-lg transition-opacity group-hover:opacity-100">
          <p>
            <strong>Patient:</strong> {appointment!.patientName}
          </p>
          <p>
            <strong>Doctor:</strong> {doctorName}
          </p>
          <p>
            <strong>Time:</strong> {time}
          </p>
        </div>
      )}
    </div>
  );
}

function DateNavigator({ currentDate, setCurrentDate }: { currentDate: Date; setCurrentDate: (d: Date) => void }) {
  const [open, setOpen] = useState(false);
  const ref = useClickOutside<HTMLDivElement>(open, () => setOpen(false));

  return (
    <div className="relative" ref={ref}>
      <div className="flex items-center gap-3">
        <button
          onClick={() => setCurrentDate(subDays(currentDate, 1))}
          className="p-2 rounded-lg hover:bg-slate-100"
          aria-label="Previous day"
        >
          <IconChevronLeft className="h-5 w-5 text-slate-700" />
        </button>
        <div className="text-center min-w-[220px]">
          <p className="text-lg font-semibold text-slate-900">
            {format(currentDate, "EEEE, MMMM d")}
          </p>
          {isToday(currentDate) && (
            <p className="text-xs font-semibold text-indigo-600">Today</p>
          )}
        </div>
        <button
          onClick={() => setCurrentDate(addDays(currentDate, 1))}
          className="p-2 rounded-lg hover:bg-slate-100"
          aria-label="Next day"
        >
          <IconChevronRight className="h-5 w-5 text-slate-700" />
        </button>

        <button
          onClick={() => setCurrentDate(new Date())}
          className="ml-2 text-sm font-medium text-indigo-600 hover:underline"
        >
          Jump to Today
        </button>

        <div className="h-6 w-px bg-slate-200 mx-2" />

        {/* Go to date (popover + native input) */}
        <button
          onClick={() => setOpen((v) => !v)}
          className="inline-flex items-center gap-2 rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm font-medium shadow-sm hover:bg-slate-50"
        >
          <IconCalendar className="h-4 w-4" /> Go to date
          {open ? (
            <IconChevronUp className="ml-1 h-4 w-4" />
          ) : (
            <IconChevronDown className="ml-1 h-4 w-4" />
          )}
        </button>
      </div>

      {open && (
        <div className="absolute z-30 mt-2">
          <MiniMonthPicker
            selectedDate={currentDate}
            onSelect={(d) => setCurrentDate(d)}
            onClose={() => setOpen(false)}
          />
        </div>
      )}
    </div>
  );
}

// --- MAIN COMPONENT ---
export function AppointmentCalendar() {

  const { user } = useAuth();
  const isDoctorRole = user?.role === 'doctor';
  const [doctors, setDoctors] = useState<Doctor[]>([]);
  const [selectedDoctor, setSelectedDoctor] = useState<Doctor | null>(null);
  const [currentDate, setCurrentDate] = useState<Date>(new Date());
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [doctorMeta, setDoctorMeta] = useState<Record<string, { availability: Availability | null; slotDuration: number }>>({});
  const [clinicLeaves, setClinicLeaves] = useState<any[]>([]);
  const clinicId = user?.clinic_id ?? null;

  // Load all clinic doctors/admin and their slot info from backend
  useEffect(() => {
    if (!user?.clinic_id) return;

    (async () => {
      try {
        const resp = await getAllProfiles({ clinic_id: user.clinic_id });
        const raw = resp?.data?.data ?? resp?.data ?? [];
        const profileArr = Array.isArray(raw) ? raw : [raw];
        const clinicDoctors = profileArr.filter((d: any) => d && d.role === 'doctor');
        const clinicAdmins = profileArr.filter((d: any) => d && d.role === 'admin');
        const currentAdminProfile = clinicAdmins.find(
          (d: any) => String(d._id || d.id) === String(user?.id),
        );

        // Role rule:
        // - doctor login: only own dashboard slots
        // - admin/reception/super_admin login: all clinic doctors/admin
        const doctorArr = isDoctorRole
          ? [...clinicDoctors, ...clinicAdmins].filter((d: any) => String(d._id || d.id) === String(user?.id))
          : (user?.role === 'admin'
              ? [...clinicDoctors, ...(currentAdminProfile ? [currentAdminProfile] : [])]
              : (clinicDoctors.length > 0 ? clinicDoctors : clinicAdmins));

        const effectiveDoctors = doctorArr.length > 0
          ? doctorArr
          : (
            isDoctorRole && user?.id
              ? [{ _id: user.id, id: user.id, full_name: user.full_name || 'My Slots', role: 'doctor', availability: null, slot_duration_minutes: 15 }]
              : []
          );

        const list = effectiveDoctors.map((d: any) => ({
          id: d._id || d.id,
          name: d.full_name || d.name || 'Doctor',
        }));
        setDoctors(list);
        setSelectedDoctor((prev) => {
          if (!list.length) return null;
          if (prev && list.some((d) => d.id === prev.id)) return prev;
          return list[0];
        });

        // Stash meta
        const meta: Record<string, { availability: Availability | null; slotDuration: number }> = {};
        for (const d of effectiveDoctors) {
          meta[d._id || d.id] = {
            availability: d.availability ?? null,
            slotDuration: Number(d.slot_duration_minutes ?? 15),
          };
        }
        setDoctorMeta(meta);
      } catch (err) {
        setDoctors([]);
        setSelectedDoctor(null);
        setDoctorMeta({});
      }
    })();
  }, [isDoctorRole, user?.clinic_id, user?.full_name, user?.id]);

  // Load clinic leave records once clinic is known
  useEffect(() => {
    if (!clinicId) return;
    (async () => {
      try {
        const resp = await getDoctorLeavesByClinic(clinicId);
        const leaves = resp?.data?.data || resp?.data || [];
        setClinicLeaves(Array.isArray(leaves) ? leaves : []);
      } catch {
        setClinicLeaves([]);
      }
    })();
  }, [clinicId]);

  // Compute availability for the selected day
  const dateKey = useMemo(() => format(currentDate, "yyyy-MM-dd"), [currentDate]);
  const dayKey = useMemo(() => format(currentDate, "EEEE"), [currentDate]);
  const selectedMeta = selectedDoctor ? doctorMeta[selectedDoctor.id] : undefined;
  const activeLeave = useMemo(() => {
    if (!selectedDoctor) return null;
    return clinicLeaves.find((l: any) => {
      const leaveDoctorId = String(l?.doctor_id || l?.doctorId || '');
      const start = String(l?.leave_start_date || '');
      const end = String(l?.leave_end_date || '');
      if (!leaveDoctorId || !start || !end) return false;
      return leaveDoctorId === String(selectedDoctor.id) && start <= dateKey && end >= dateKey;
    }) || null;
  }, [clinicLeaves, dateKey, selectedDoctor]);

  const morningWindow = useMemo(() => {
    if (activeLeave) return null;
    const a = selectedMeta?.availability ?? null;
    const day = a?.find?.((d) => d.day === dayKey);
    return day?.morning && !day.morning.is_off ? { start: day.morning.start, end: day.morning.end } : null;
  }, [activeLeave, selectedMeta, dayKey]);

  const eveningWindow = useMemo(() => {
    if (activeLeave) return null;
    const a = selectedMeta?.availability ?? null;
    const day = a?.find?.((d) => d.day === dayKey);
    return day?.evening && !day.evening.is_off ? { start: day.evening.start, end: day.evening.end } : null;
  }, [activeLeave, selectedMeta, dayKey]);

  const slotInterval = selectedMeta?.slotDuration ?? 15;

  // Slots from availability (UI stays the same; we just compute dynamically)
  const morningSlots = useMemo(() => {
    if (!morningWindow) return [] as string[];
    return generateTimeSlots(morningWindow.start, morningWindow.end, slotInterval);
  }, [morningWindow, slotInterval]);

  const eveningSlots = useMemo(() => {
    if (!eveningWindow) return [] as string[];
    return generateTimeSlots(eveningWindow.start, eveningWindow.end, slotInterval);
  }, [eveningWindow, slotInterval]);

  // Load appointments for the current date + selected doctor (Mongo API)
  useEffect(() => {
    if (!clinicId || !selectedDoctor) return;
    (async () => {
      try {
        const dateStr = format(currentDate, "yyyy-MM-dd");
        // Send both canonical and fallback keys so backend date filtering is always applied.
        const filters = {
          doctorId: selectedDoctor.id,
          doctor_id: selectedDoctor.id,
          date: dateStr,
          appointment_date: dateStr,
          startDate: dateStr,
          endDate: dateStr,
        };
        const response = await getClinicAppointments(clinicId, filters);
        const data = response.data?.data || [];
        const mapped: Appointment[] = data.map((row: any) => ({
          id: row._id || row.id,
          doctorId: row.doctor_id,
          patientName: row.full_name ?? '',
          timeHHmm: String(row.appointment_time).slice(0, 5),
        }));
        setAppointments(mapped);
      } catch (err) {
        setAppointments([]);
      }
    })();
  }, [clinicId, currentDate, selectedDoctor?.id]);

  // Index appointments by HH:mm for the selected doctor/day
  const appointmentsByTime = useMemo(() => {
    return appointments.reduce<Record<string, Appointment>>((acc, apt) => {
      acc[apt.timeHHmm] = apt;
      return acc;
    }, {});
  }, [appointments]);

  return (
    <div className="rounded-2xl border bg-white p-6 shadow-sm">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <DateNavigator currentDate={currentDate} setCurrentDate={setCurrentDate} />
        <div className="flex items-center gap-4">
          {selectedDoctor && !isDoctorRole && (
            <DoctorSelector doctors={doctors} selected={selectedDoctor} onChange={(d) => setSelectedDoctor(d)} />
          )}
          {selectedDoctor && isDoctorRole && (
            <div className="rounded-xl border border-slate-300 bg-white px-4 py-2.5 text-sm font-medium text-slate-700">
              Doctor: {selectedDoctor.name}
            </div>
          )}
        </div>
      </div>

      <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
        <Legend />
      </div>

      {activeLeave && selectedDoctor && (
        <div className="mt-4 rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
          {selectedDoctor.name} is on leave on {format(currentDate, "dd MMM yyyy")}
          {activeLeave?.reason ? ` (${activeLeave.reason})` : ""}.
        </div>
      )}

      {/* Slots */}
      <div className="mt-6 space-y-6">
        <section>
          <h3 className="font-medium text-slate-600 mb-3">Morning</h3>
          <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 xl:grid-cols-8 gap-2">
            {morningSlots.length === 0 ? (
              <div className="text-sm text-slate-500">No morning availability.</div>
            ) : (
              morningSlots.map((time) => (
                <TimeSlot key={time} time={time} appointment={appointmentsByTime[time]} doctorName={selectedDoctor?.name ?? ""} />
              ))
            )}
          </div>
        </section>

        <section>
          <h3 className="font-medium text-slate-600 mb-3">Afternoon & Evening</h3>
          <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 xl:grid-cols-8 gap-2">
            {eveningSlots.length === 0 ? (
              <div className="text-sm text-slate-500">No afternoon/evening availability.</div>
            ) : (
              eveningSlots.map((time) => (
                <TimeSlot key={time} time={time} appointment={appointmentsByTime[time]} doctorName={selectedDoctor?.name ?? ""} />
              ))
            )}
          </div>
        </section>
      </div>
    </div>
  );
}

export default AppointmentCalendar;
