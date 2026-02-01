import { useState, useRef, useEffect } from 'react';
import { IconChevronLeft, IconChevronRight, IconCalendar } from '@tabler/icons-react';
import {
  format,
  addDays,
  subDays,
  getDaysInMonth,
  startOfMonth,
  endOfMonth,
  getDay,
  isToday,
  isSameDay,
  isBefore,
  parse,
  addMinutes
} from 'date-fns';

import { getProfileSlots, getBookedSlotsAPI } from '../../../lib/apiClient';

export type FollowUpData = { followUpDate: Date | null; followUpTime: string };

type Props = { onComplete: (data: FollowUpData) => void; isSaving: boolean; doctorId: string };

const generateSlots = (start: string | null, end: string | null, interval = 15) => {
  if (!start || !end) return [] as string[];
  const ref = new Date();
  let cur = parse(start, 'HH:mm', ref);
  const endT = parse(end, 'HH:mm', ref);
  const out: string[] = [];
  while (cur <= endT) {
    out.push(format(cur, 'HH:mm'));
    cur = addMinutes(cur, interval);
  }
  return out;
};

const CalendarMonthView = ({ currentDate, onDateSelect, close }: { currentDate: Date | null; onDateSelect: (d: Date) => void; close: () => void }) => {
  const [viewDate, setViewDate] = useState(currentDate || new Date());
  const start = startOfMonth(viewDate);
  const end = endOfMonth(viewDate);
  const today = new Date();
  const daysInMonth = getDaysInMonth(viewDate);
  const startingDay = getDay(start);

  return (
    <div className="absolute top-full mt-2 z-10 w-80 bg-white border border-slate-200 rounded-2xl shadow-lg p-4">
      <div className="flex items-center justify-between mb-3">
        <button onClick={() => setViewDate(subDays(start, 1))} className="p-1.5 rounded-full hover:bg-slate-100">
          <IconChevronLeft size={18} />
        </button>
        <p className="font-semibold text-sm">{format(viewDate, 'MMMM yyyy')}</p>
        <button onClick={() => setViewDate(addDays(end, 1))} className="p-1.5 rounded-full hover:bg-slate-100">
          <IconChevronRight size={18} />
        </button>
      </div>

      <div className="grid grid-cols-7 gap-1 text-center text-xs">
        {['S', 'M', 'T', 'W', 'T', 'F', 'S'].map((d, idx) => (
          <div key={`dow-${idx}`} className="font-medium text-slate-400 p-1">
            {d}
          </div>
        ))}

        {Array.from({ length: startingDay }).map((_, i) => (
          <div key={`empty-${i}`} />
        ))}

        {Array.from({ length: daysInMonth }).map((_, i) => {
          const day = i + 1;
          const date = new Date(viewDate.getFullYear(), viewDate.getMonth(), day);
          const isSelected = currentDate ? isSameDay(date, currentDate) : false;
          const isPast = isBefore(date, subDays(today, 1));

          const className = isSelected
            ? 'w-9 h-9 rounded-full bg-sky-500 text-white font-bold'
            : isToday(date)
            ? 'w-9 h-9 rounded-full bg-sky-100 text-sky-600'
            : isPast
            ? 'w-9 h-9 rounded-full text-slate-300 cursor-not-allowed'
            : 'w-9 h-9 rounded-full hover:bg-slate-100';

          return (
            <button
              key={day}
              disabled={isPast}
              onClick={() => {
                onDateSelect(date);
                close();
              }}
              className={className}
            >
              {day}
            </button>
          );
        })}
      </div>
    </div>
  );
};

export default function FollowUp({ onComplete, isSaving, doctorId }: Props) {
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [selectedTime, setSelectedTime] = useState('');
  const [isCalendarOpen, setCalendarOpen] = useState(false);
  const calendarRef = useRef<HTMLDivElement>(null);

  const [timeSlots, setTimeSlots] = useState<string[]>([]);
  const [bookedSlots, setBookedSlots] = useState<string[]>([]);
  const [, setSlotDuration] = useState(15);
  const [isDayOff, setIsDayOff] = useState(false);
  const [loadingSlots, setLoadingSlots] = useState(false);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (calendarRef.current && !calendarRef.current.contains(e.target as Node)) setCalendarOpen(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  useEffect(() => {
    if (!selectedDate || !doctorId) return;

    const loadData = async () => {
      setLoadingSlots(true);
      setTimeSlots([]);
      setBookedSlots([]);
      setIsDayOff(false);

      const dayName = format(selectedDate, 'EEEE');
      const dateStr = format(selectedDate, 'yyyy-MM-dd');

      try {
        const slotsResp = await getProfileSlots(doctorId);
        const slotsPayload = slotsResp?.data?.data ?? slotsResp?.data ?? slotsResp;
        const availability = slotsPayload?.availability ?? [];
        const slotMins = Number(slotsPayload?.slot_duration_minutes ?? 15);
        setSlotDuration(slotMins);

        const dayConfig = availability.find((d: any) => d.day === dayName);
        if (!dayConfig || (dayConfig.morning?.is_off && dayConfig.evening?.is_off)) {
          setIsDayOff(true);
          return;
        }

        const combined: string[] = [];
        if (!dayConfig.morning?.is_off) combined.push(...generateSlots(dayConfig.morning.start, dayConfig.morning.end, slotMins));
        if (!dayConfig.evening?.is_off) combined.push(...generateSlots(dayConfig.evening.start, dayConfig.evening.end, slotMins));
        setTimeSlots(combined);

        const bookedResp = await getBookedSlotsAPI(doctorId, dateStr);
        const bookedPayload = bookedResp?.data?.data ?? bookedResp?.data ?? bookedResp;
        const booked = (bookedPayload || []).map((a: any) => String(a.appointment_time || a.time || a).slice(0, 5));
        setBookedSlots(booked);
      } catch (err) {
        console.warn('FollowUp: failed to load slots from backend API', err);
        setIsDayOff(true);
        setTimeSlots([]);
        setBookedSlots([]);
      } finally {
        setLoadingSlots(false);
      }
    };

    loadData();
  }, [selectedDate, doctorId]);

  const handleComplete = () => onComplete({ followUpDate: selectedDate, followUpTime: selectedTime });

  const formatDateText = () => {
    if (!selectedDate) return 'Select Date (Optional)';
    if (isToday(selectedDate)) return 'Today';
    return format(selectedDate, 'E, dd MMM');
  };

  return (
    <div className="max-w-4xl mx-auto">
      <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200 space-y-6">
        <h2 className="text-xl font-semibold text-slate-800">Schedule Follow-up</h2>

        <div className="flex items-center gap-3 border rounded-xl p-3">
          <button onClick={() => setSelectedDate((prev) => subDays(prev || new Date(), 1))} className="p-2 rounded-lg hover:bg-slate-100">
            <IconChevronLeft size={20} />
          </button>

          <div ref={calendarRef} className="relative flex-1 text-center">
            <button onClick={() => setCalendarOpen((o) => !o)} className="flex items-center justify-center gap-2 w-full p-2 rounded-lg hover:bg-slate-100">
              <IconCalendar size={20} className="text-sky-600" />
              <span className="font-semibold text-slate-700 text-lg">{formatDateText()}</span>
            </button>

            {isCalendarOpen && <CalendarMonthView currentDate={selectedDate} onDateSelect={setSelectedDate} close={() => setCalendarOpen(false)} />}
          </div>

          <button onClick={() => setSelectedDate((prev) => addDays(prev || new Date(), 1))} className="p-2 rounded-lg hover:bg-slate-100">
            <IconChevronRight size={20} />
          </button>
        </div>

        <div>
          <h3 className="font-medium text-slate-600 mb-3">Available Slots (Optional)</h3>

          {loadingSlots && <p className="text-slate-500 text-sm">Loading available slots...</p>}
          {isDayOff && <p className="text-amber-600 text-sm">Doctor is not available on this day.</p>}

          {!loadingSlots && !isDayOff && (
            <div className="grid grid-cols-4 sm:grid-cols-5 md:grid-cols-6 gap-2">
              {timeSlots.map((time) => {
                const booked = bookedSlots.includes(time);
                const selected = selectedTime === time;
                return (
                  <button
                    key={time}
                    disabled={booked}
                    onClick={() => !booked && setSelectedTime(time)}
                    className={`px-4 py-2 text-sm rounded-lg border transition-colors ${booked ? 'bg-slate-100 text-slate-400 border-slate-200 cursor-not-allowed line-through' : selected ? 'bg-sky-500 text-white font-semibold border-sky-500' : 'bg-white hover:border-sky-400 border-slate-200'}`}
                  >
                    {time}
                  </button>
                );
              })}
            </div>
          )}

          {!loadingSlots && !isDayOff && timeSlots.length === 0 && <p className="text-slate-500 text-sm mt-2">No slots configured for this day.</p>}
        </div>

        <div className="flex justify-end pt-4 mt-4 border-t">
          <button onClick={handleComplete} disabled={isSaving} className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-indigo-600 to-sky-500 text-white font-semibold shadow disabled:opacity-60">
            {isSaving ? 'Completing...' : 'Complete Consultation'}
          </button>
        </div>
      </div>
    </div>
  );
}
