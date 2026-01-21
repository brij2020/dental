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
import { supabase } from '../../lib/supabaseClient';

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
      <div className="flex items-center gap-2"><span className="h-3 w-3 rounded bg-indigo-200 border border-indigo-300" /> Booked</div>
      <div className="flex items-center gap-2"><span className="h-3 w-3 rounded bg-slate-200 border border-slate-300" /> Free</div>
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
  const base = "relative rounded-lg p-3 text-sm text-center cursor-pointer transition-colors";
  const booked = "bg-indigo-100 text-indigo-800 font-semibold hover:bg-indigo-200";
  const free = "bg-slate-100 text-slate-700 hover:bg-slate-200";

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

  const [doctors, setDoctors] = useState<Doctor[]>([]);
  const [selectedDoctor, setSelectedDoctor] = useState<Doctor | null>(null);
  const [currentDate, setCurrentDate] = useState<Date>(new Date());
  const [appointments, setAppointments] = useState<Appointment[]>([]);

  // Store per-doctor metadata we need for slots (availability + slot duration)
  const [doctorMeta, setDoctorMeta] = useState<Record<string, { availability: Availability | null; slotDuration: number }>>({});

  // Load current user's role + doctor list (role-based)
  useEffect(() => {
    let mounted = true;
    (async () => {
      const { data: auth } = await supabase.auth.getUser();
      const userId = auth?.user?.id;
      if (!userId) return;

      // Current user's profile to know role and clinic
      const { data: me } = await supabase
        .from("profiles")
        .select("id, role, clinic_id")
        .eq("id", userId)
        .maybeSingle();

      const myRole = me?.role ?? "admin";

      // Helper to stash meta for a list of rows
      const stashMeta = (rows: any[]) => {
        const next: Record<string, { availability: Availability | null; slotDuration: number }> = {};
        for (const r of rows) {
          next[r.id] = {
            availability: (r.availability as Availability) ?? null,
            slotDuration: Number(r.slot_duration_minutes ?? 15),
          };
        }
        setDoctorMeta((prev) => ({ ...prev, ...next }));
      };

      if (myRole === "doctor") {
        // Doctor: only themselves
        const { data: row } = await supabase
          .from("profiles")
          .select("id, full_name, availability, slot_duration_minutes")
          .eq("id", userId)
          .single();
        if (!mounted || !row) return;
        const only = [{ id: row.id, name: row.full_name ?? "Doctor" }];
        setDoctors(only);
        setSelectedDoctor(only[0]);
        stashMeta([row]);
      } else {
        // Admin/Receptionist: show all doctors (optionally same clinic)
        const q = supabase
   .from("profiles")
   .select("id, full_name, role, availability, slot_duration_minutes, clinic_id")
   .in("role", ["doctor", "admin"])
   .order("full_name", { ascending: true });
        const { data: rows } = me?.clinic_id ? await q.eq("clinic_id", me.clinic_id) : await q;
        if (!mounted || !rows) return;
const list = rows.map((r) => ({
   id: r.id as string,
  name: r.role === "admin"
     ? `${(r.full_name as string) ?? "Admin"} (Admin)`
     : ((r.full_name as string) ?? "Doctor"),
 }));        setDoctors(list);
        if (!selectedDoctor && list.length) setSelectedDoctor(list[0]);
        stashMeta(rows);
      }
    })();
    return () => {
      mounted = false;
    };
  }, [supabase]);

  // Compute availability for the selected day
  const dayKey = useMemo(() => format(currentDate, "EEEE"), [currentDate]);
  const selectedMeta = selectedDoctor ? doctorMeta[selectedDoctor.id] : undefined;

  const morningWindow = useMemo(() => {
    const a = selectedMeta?.availability ?? null;
    const day = a?.find?.((d) => d.day === dayKey);
    return day?.morning && !day.morning.is_off ? { start: day.morning.start, end: day.morning.end } : null;
  }, [selectedMeta, dayKey]);

  const eveningWindow = useMemo(() => {
    const a = selectedMeta?.availability ?? null;
    const day = a?.find?.((d) => d.day === dayKey);
    return day?.evening && !day.evening.is_off ? { start: day.evening.start, end: day.evening.end } : null;
  }, [selectedMeta, dayKey]);

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

  // Load appointments for the current date + selected doctor
  useEffect(() => {
    let mounted = true;
    (async () => {
      if (!selectedDoctor) return;
      const dateStr = format(currentDate, "yyyy-MM-dd");
      const { data } = await supabase
        .from("appointments")
        .select("id, doctor_id, full_name, appointment_time, appointment_date")
        .eq("doctor_id", selectedDoctor.id)
        .eq("appointment_date", dateStr);

      if (!mounted || !data) return;
      const mapped: Appointment[] = data.map((row: any) => ({
        id: row.id,
        doctorId: row.doctor_id,
        patientName: row.full_name ?? "",
        timeHHmm: String(row.appointment_time).slice(0, 5), // HH:mm from HH:mm:ss
      }));
      setAppointments(mapped);
    })();
    return () => {
      mounted = false;
    };
  }, [supabase, currentDate, selectedDoctor?.id]);

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
          {selectedDoctor && (
            <DoctorSelector doctors={doctors} selected={selectedDoctor} onChange={(d) => setSelectedDoctor(d)} />
          )}
        </div>
      </div>

      <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
        <Legend />
      </div>

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
