import { useState, useEffect, type FormEvent } from 'react';
import { Link } from 'react-router-dom';
import { toast } from 'react-toastify';
import {
  IconChevronLeft,
  IconUserCog,
  IconDeviceFloppy,
  IconClockHour4,
} from '@tabler/icons-react';
import { useAuth } from '../../../state/useAuth';
import { getAllProfiles, updateProfile, getProfileSlots } from '../../../lib/apiClient';
// --- Types ---
type DoctorProfile = {
  _id: string;
  full_name: string;
  role?: string;
};

type TimeSlot = {
  start: string;
  end: string;
  is_off: boolean;
};

type Day = 'Monday' | 'Tuesday' | 'Wednesday' | 'Thursday' | 'Friday' | 'Saturday' | 'Sunday';

type DaySchedule = {
  day: Day;
  morning: TimeSlot;
  evening: TimeSlot;
};

// --- Helper Functions ---

const generateBlankSchedule = (): DaySchedule[] => {
  const days: Day[] = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
  return days.map(day => ({
    day,
    morning: { start: '', end: '', is_off: true },
    evening: { start: '', end: '', is_off: true },
  }));
};

const timeToMinutes = (time: string): number => {
  if (!time) return 0;
  const [hours, minutes] = time.split(':').map(Number);
  return hours * 60 + minutes;
};

// --- DayScheduleRow Sub-component ---
const DayScheduleRow = ({
  schedule,
  handleScheduleChange,
}: {
  schedule: DaySchedule;
  handleScheduleChange: (
    dayName: Day,
    slot: 'morning' | 'evening',
    field: keyof TimeSlot,
    value: string | boolean
  ) => void;
}) => {
  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 p-4 border rounded-lg bg-slate-50/50">
      <div className="font-semibold text-slate-700 md:flex md:items-center">{schedule.day}</div>

      {/* Morning Slot */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <label className="text-sm font-medium text-slate-600">Morning</label>
          <div className="flex items-center gap-2">
            <label
              htmlFor={`${schedule.day}-morning-off`}
              className="text-xs text-slate-500"
            >
              Off
            </label>
            <input
              type="checkbox"
              id={`${schedule.day}-morning-off`}
              checked={schedule.morning.is_off}
              onChange={(e) =>
                handleScheduleChange(schedule.day, 'morning', 'is_off', e.target.checked)
              }
              className="w-4 h-4 rounded text-indigo-600 focus:ring-indigo-500"
            />
          </div>
        </div>
        <div className="flex items-center gap-2">
          <input
            type="time"
            value={schedule.morning.start}
            disabled={schedule.morning.is_off}
            onChange={(e) =>
              handleScheduleChange(schedule.day, 'morning', 'start', e.target.value)
            }
            className="w-full text-sm border-slate-300 rounded-md shadow-sm disabled:bg-slate-200 disabled:cursor-not-allowed focus:border-sky-400 focus:ring-sky-300/40"
          />
          <span className="text-slate-400">-</span>
          <input
            type="time"
            value={schedule.morning.end}
            disabled={schedule.morning.is_off}
            onChange={(e) =>
              handleScheduleChange(schedule.day, 'morning', 'end', e.target.value)
            }
            className="w-full text-sm border-slate-300 rounded-md shadow-sm disabled:bg-slate-200 disabled:cursor-not-allowed focus:border-sky-400 focus:ring-sky-300/40"
          />
        </div>
      </div>

      {/* Evening Slot */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <label className="text-sm font-medium text-slate-600">Evening</label>
          <div className="flex items-center gap-2">
            <label
              htmlFor={`${schedule.day}-evening-off`}
              className="text-xs text-slate-500"
            >
              Off
            </label>
            <input
              type="checkbox"
              id={`${schedule.day}-evening-off`}
              checked={schedule.evening.is_off}
              onChange={(e) =>
                handleScheduleChange(schedule.day, 'evening', 'is_off', e.target.checked)
              }
              className="w-4 h-4 rounded text-indigo-600 focus:ring-indigo-500"
            />
          </div>
        </div>
        <div className="flex items-center gap-2">
          <input
            type="time"
            value={schedule.evening.start}
            disabled={schedule.evening.is_off}
            onChange={(e) =>
              handleScheduleChange(schedule.day, 'evening', 'start', e.target.value)
            }
            className="w-full text-sm border-slate-300 rounded-md shadow-sm disabled:bg-slate-200 disabled:cursor-not-allowed focus:border-sky-400 focus:ring-sky-300/40"
          />
          <span className="text-slate-400">-</span>
          <input
            type="time"
            value={schedule.evening.end}
            disabled={schedule.evening.is_off}
            onChange={(e) =>
              handleScheduleChange(schedule.day, 'evening', 'end', e.target.value)
            }
            className="w-full text-sm border-slate-300 rounded-md shadow-sm disabled:bg-slate-200 disabled:cursor-not-allowed focus:border-sky-400 focus:ring-sky-300/40"
          />
        </div>
      </div>
    </div>
  );
};

// --- Main Panel Component ---
export default function AppointmentTimingsPanel() {
  const { user } = useAuth();
  const [doctors, setDoctors] = useState<DoctorProfile[]>([]);
  const [selectedDoctorId, setSelectedDoctorId] = useState('');
  const [consultationType, setConsultationType] = useState<'in_person' | 'video'>('in_person');

  const [schedule, setSchedule] = useState<DaySchedule[]>([]);
  const [slotDuration, setSlotDuration] = useState<number>(15);
  const [capacity, setCapacity] = useState<string>('1x');

  const [hasSchedule, setHasSchedule] = useState(false);
  const [isListLoading, setIsListLoading] = useState(true);
  const [isScheduleLoading, setIsScheduleLoading] = useState(false);
  const [saving, setSaving] = useState(false);

  // 👉 State for copy-to-all-days popup (Option B: copy whole day, morning + evening)
  const [copyPromptDay, setCopyPromptDay] = useState<Day | null>(null);

  // Effect to fetch the list of doctors
  useEffect(() => {
    const fetchDoctors = async () => {
      if (!user?.clinic_id) return;
      setIsListLoading(true);
      try {
        const response = await getAllProfiles();
        
        if (response.status === 200 && response.data) {
          const profileData = response.data.data || response.data;
          const doctors = Array.isArray(profileData) ? profileData : [profileData];
          
          const mappedDoctors = doctors
            .filter((doc: any) => doc.role === 'doctor' || doc.role === 'admin')
            .map((doc: any) => ({
              _id: doc._id || doc.id,
              full_name: doc.full_name,
              role: doc.role,
            }));
          
          setDoctors(mappedDoctors);
          if (mappedDoctors.length > 0) setSelectedDoctorId(mappedDoctors[0]._id);
        }
      } catch (error: any) {
        toast.error('Failed to fetch doctors list.');
        console.error('Error fetching doctors:', error);
      } finally {
        setIsListLoading(false);
      }
    };

    fetchDoctors();
  }, [user]);

  // Effect to fetch the schedule and slot duration for the selected doctor
  useEffect(() => {
    if (!selectedDoctorId) {
      setSchedule([]);
      return;
    }

    const fetchSchedule = async () => {
      setIsScheduleLoading(true);
      setHasSchedule(false);
      try {
        const response = await getProfileSlots(selectedDoctorId, {
          consultation_type: consultationType,
        });
        if (response.status === 200 && response.data) {
          const { availability, slot_duration_minutes, capacity: fetchedCapacity } = response.data.data;
          setSlotDuration(slot_duration_minutes || 15);
          if (fetchedCapacity) {
            setCapacity(fetchedCapacity);
          } else {
            setCapacity('1x');
          }
          if (availability && Array.isArray(availability) && availability.length > 0) {
            setSchedule(availability as DaySchedule[]);
            setHasSchedule(true);
          } else {
            setSchedule(generateBlankSchedule());
            setHasSchedule(false);
          }
        }
      } catch (error: any) {
        toast.error("Failed to fetch doctor's schedule.");
        setSchedule(generateBlankSchedule());
        setCapacity('1x');
        console.error('Error fetching schedule:', error);
      } finally {
        setIsScheduleLoading(false);
      }
    };
    fetchSchedule();
  }, [selectedDoctorId, consultationType]);

  // State handler with validation + trigger copy popup
  const handleScheduleChange = (
    dayName: Day,
    slot: 'morning' | 'evening',
    field: keyof TimeSlot,
    value: string | boolean
  ) => {
    if ((field === 'start' || field === 'end') && typeof value === 'string' && value) {
      if (timeToMinutes(value) % slotDuration !== 0) {
        toast.error(`Invalid time. Must be in a ${slotDuration}-minute increment.`);
        return;
      }
    }

    setSchedule((currentSchedule) =>
      currentSchedule.map((day) => {
        if (day.day === dayName) {
          const updatedSlot: TimeSlot = { ...day[slot], [field]: value } as TimeSlot;
          if (field === 'is_off' && value === true) {
            updatedSlot.start = '';
            updatedSlot.end = '';
          }
          return { ...day, [slot]: updatedSlot };
        }
        return day;
      })
    );

    // 👉 Show popup when user sets a time (start/end) – copy this day's full timings to all days
    if ((field === 'start' || field === 'end') && typeof value === 'string' && value && !copyPromptDay) {
      setCopyPromptDay(dayName);
    }
  };

  // Submit Handler
  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!selectedDoctorId) return;
    setSaving(true);

    try {
      let doc_id = selectedDoctorId;
     const isAdmin =  doctors.find(d => d._id === selectedDoctorId)?.role === 'admin'
      
      const availabilityKey = consultationType === 'video' ? 'v_availability' : 'availability';
      const response = await updateProfile(doc_id, {
        [availabilityKey]: schedule,
        slot_duration_minutes: slotDuration,
        capacity: isAdmin ? capacity : undefined,
      });

      if (response.status === 200) {
        toast.success(`Schedule has been updated!`);
        setHasSchedule(true);
      }
    } catch (error: any) {
      toast.error('Failed to save schedule. Please try again.');
      console.error('API error:', error?.response?.data || error.message);
    } finally {
      setSaving(false);
    }
    
  };

  const isLoading = isListLoading || isScheduleLoading;
  return (
    <div>
      <Link
        to="/settings"
        className="flex items-center gap-2 text-sm font-medium text-slate-600 hover:text-slate-900 mb-4"
      >
        <IconChevronLeft className="h-5 w-5" />
        Back to Settings
      </Link>

      <div className="p-6 bg-white border rounded-2xl">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <h2 className="text-lg font-semibold text-slate-800">Appointment Timings</h2>
            <p className="text-sm text-slate-500 mt-1">
              Set the weekly consultation hours and appointment duration for each doctor.
            </p>
          </div>

          <div className="w-full sm:w-64">
            <label
              htmlFor="consultation-type"
              className="block text-sm font-medium text-slate-700 mb-1"
            >
              Consultation Type
            </label>
            <select
              id="consultation-type"
              value={consultationType}
              onChange={(e) => setConsultationType(e.target.value as 'in_person' | 'video')}
              className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2.5 text-slate-900 outline-none 
                         focus:ring-4 focus:ring-sky-300/40 focus:border-sky-400 transition"
            >
              <option value="in_person">In-person Consultation</option>
              <option value="video">Video Consultation</option>
            </select>
          </div>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="my-6 grid grid-cols-1 md:grid-cols-3 gap-6 items-end">
            {/* Doctor Selection */}
            <div>
              <label
                htmlFor="doctor-select"
                className="block text-sm font-medium text-slate-700 mb-1"
              >
                Select Doctor
              </label>
              <div className="relative">
                <span className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
                  <IconUserCog className="h-5 w-5 text-slate-400" />
                </span>

                <select
                  id="doctor-select"
                  value={selectedDoctorId} 
                  onChange={(e) => setSelectedDoctorId(e.target.value)}
                  disabled={isListLoading || doctors.length === 0}
                  className="w-full rounded-xl border border-slate-300 bg-white pl-10 pr-3 py-2.5 text-slate-900 outline-none 
                             focus:ring-4 focus:ring-sky-300/40 focus:border-sky-400 transition"
                >
                  {isListLoading ? (
                    <option>Loading doctors...</option>
                  ) : doctors.length > 0 ? (
                    doctors.map((doc) => (
                      <option key={doc._id} value={doc._id}>
                        {doc.full_name} {doc?.role === 'admin' ? '(Admin)' : ''}
                      </option>
                    ))
                  ) : (
                    <option>No doctors found</option>
                  )}
                </select>
              </div>
            </div>

            {/* Slot Duration */}
            <div>
              <label
                htmlFor="slot-duration"
                className="block text-sm font-medium text-slate-700 mb-1"
              >
                Appointment Duration (minutes)
              </label>

              <div className="relative">
                <span className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
                  <IconClockHour4 className="h-5 w-5 text-slate-400" />
                </span>

                <input
                  type="number"
                  id="slot-duration"
                  value={slotDuration}
                  onChange={(e) =>
                    setSlotDuration(Math.max(1, parseInt(e.target.value, 10) || 1))
                  }
                  disabled={isLoading || !selectedDoctorId}
                  className="w-full rounded-xl border border-slate-300 bg-white pl-10 pr-3 py-2.5 text-slate-900 outline-none 
                             focus:ring-4 focus:ring-sky-300/40 focus:border-sky-400 transition"
                />
              </div>
            </div>

            {/* Capacity (Admin Only) */}
            <div className={selectedDoctorId && doctors.find(d => d._id === selectedDoctorId)?.role === 'admin' ? '' : 'hidden'}>
              <label
                htmlFor="capacity"
                className="block text-sm font-medium text-slate-700 mb-1"
              >
                Patient Capacity
              </label>
              <select
                id="capacity"
                value={capacity}
                onChange={(e) => setCapacity(e.target.value)}
                disabled={isLoading || !selectedDoctorId}
                className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2.5 text-slate-900 outline-none 
                           focus:ring-4 focus:ring-sky-300/40 focus:border-sky-400 transition"
              >
                <option value="1x">1x Capacity</option>
                <option value="2x">2x Capacity</option>
                <option value="3x">3x Capacity</option>
                <option value="4x">4x Capacity</option>
                <option value="5x">5x Capacity</option>
                <option value="6x">6x Capacity</option>
                <option value="7x">7x Capacity</option>
                <option value="8x">8x Capacity</option>
                <option value="9x">9x Capacity</option>
                <option value="10x">10x Capacity</option>
              </select>
            </div>
          </div>

          {/* Schedule Loader */}
          {isScheduleLoading && (
            <div className="text-center p-8 text-slate-500">Loading schedule...</div>
          )}

          {/* Schedule Rows */}
          {!isScheduleLoading && selectedDoctorId && (
            <>
              {!hasSchedule && !isLoading && (
                <div className="p-4 mb-4 text-center bg-sky-50 text-sky-800 border border-sky-200 rounded-lg">
                  No schedule found. Configure the hours below and save.
                </div>
              )}

              <div className="space-y-4">
                {schedule.map((daySchedule) => (
                  <DayScheduleRow
                    key={daySchedule.day}
                    schedule={daySchedule}
                    handleScheduleChange={handleScheduleChange}
                  />
                ))}
              </div>
            </>
          )}

          {/* Save Button */}
          <div className="flex justify-end mt-8 pt-4 border-t">
            <button
              type="submit"
              disabled={saving || isLoading || !selectedDoctorId}
              className="inline-flex items-center justify-center gap-2 rounded-xl 
                         bg-gradient-to-r from-indigo-600 to-sky-500 px-5 py-2.5 
                         text-white font-medium shadow-sm hover:brightness-105 
                         active:brightness-95 disabled:opacity-60 disabled:cursor-not-allowed transition"
            >
              <IconDeviceFloppy className="h-5 w-5" />
              <span>{saving ? 'Saving...' : 'Save Changes'}</span>
            </button>
          </div>
        </form>
      </div>

      {/* ------------------------ */}
      {/* POPUP: Copy Whole Day? */}
      {/* ------------------------ */}
      {copyPromptDay && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded-xl shadow-xl w-80 text-center">
            <h3 className="text-lg font-semibold mb-3">Copy timings to all days?</h3>

            <p className="text-sm text-slate-600 mb-6">
              You updated timings for <b>{copyPromptDay}</b>.
              <br />
              Do you want to copy both <b>Morning + Evening</b> timings to all days?
            </p>

            <div className="flex justify-between gap-4">
              <button
                onClick={() => setCopyPromptDay(null)}
                className="flex-1 py-2 rounded-lg border border-slate-300 text-slate-700"
              >
                No
              </button>

              <button
                onClick={() => {
                  const source = schedule.find((d) => d.day === copyPromptDay);
                  if (!source) return;

                  setSchedule((prev) =>
                    prev.map((day) => ({
                      ...day,
                      morning: { ...source.morning },
                      evening: { ...source.evening },
                    }))
                  );

                  setCopyPromptDay(null);
                  toast.success('Copied timings to all days!');
                }}
                className="flex-1 py-2 rounded-lg bg-indigo-600 text-white"
              >
                Yes
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
