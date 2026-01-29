import React, { useState, useEffect, useMemo } from 'react';
import { toast } from 'react-toastify';
import { getDoctorProfile } from '@/lib/apiClient';
import useRescheduleAppointment from '@/hooks/useRescheduleAppointment';
import DateSelector from '../DateSelector';
import type { Appointment } from './types';
import type { Slots } from '../bookAppointments/types';
import Loading from '../Loading';

interface RescheduleModalProps {
  setOpenModal: React.Dispatch<React.SetStateAction<boolean>>;
  appointment?: Appointment;
  onSuccess?: () => void;
}

interface SlotGridProps {
  selectedTime: string;
  setSelectedTime: React.Dispatch<React.SetStateAction<string>>;
  slots: string[];
  label: string;
  icon: string;
  errorMessage: string;
}

interface DoctorProfile {
  _id?: string;
  id?: string;
  full_name?: string;
  name?: string;
  email?: string;
  mobile_number?: string;
  specialization?: string | string[];
  role?: string;
  availability?: Array<{ day: string; morning?: { start: string; end: string; is_off: boolean }; evening?: { start: string; end: string; is_off: boolean } }>;
  slot_duration_minutes?: number;
  profile_pic?: string;
  [key: string]: any;
}

const SlotGrid: React.FC<SlotGridProps> = ({ selectedTime, setSelectedTime, slots, label, icon, errorMessage }) => {
  return (
    <div className="flex flex-col gap-1.5">
      <h4 className="text-sm text-zinc-500">{label}:</h4>
      {
        slots?.length === 0 ? (
          <p className="flex items-center text-[11px] bg-zinc-50 rounded-sm py-4 text-zinc-400 gap-1 justify-center">
            <span className="material-symbols-sharp text-base">{icon}</span>
            {errorMessage}
          </p>
        ) : (
          <div className="grid grid-cols-4 gap-2">
            {slots?.map((slot) => (
              <button
                key={slot}
                onClick={() => setSelectedTime(slot)}
                className={`border rounded-sm py-1.5 text-xs ${selectedTime === slot ? "bg-sky-600 border-sky-600 text-white" : "border-zinc-200 hover:bg-[#c8ebf74c] hover:border-sky-700"}`}
              >
                {slot}
              </button>
            ))}
          </div>
        )
      }
    </div>
  );
};

const RescheduleModal: React.FC<RescheduleModalProps> = ({ setOpenModal, appointment }) => {
  const { reschedule, loading } = useRescheduleAppointment();
  
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [selectedTime, setSelectedTime] = useState<string | null>(null);
  const [availableSlots, setAvailableSlots] = useState<Slots | null>(null);
  const [doctor, setDoctor] = useState<DoctorProfile | null>(null);
  const [doctorLoading, setDoctorLoading] = useState(false);
  const [patientNote, setPatientNote] = useState<string>('');

  // Set initial date to today + 1 day
  useEffect(() => {
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    setSelectedDate(tomorrow);
  }, []);

  // Fetch doctor profile using doctor_id from appointment
  useEffect(() => {
    const fetchDoctorProfile = async () => {
      if (!appointment?.doctor_id) {
        return;
      }

      try {
        setDoctorLoading(true);
        const response = await getDoctorProfile(appointment.doctor_id);

        if (response.success && 'data' in response) {
          setDoctor(response.data as DoctorProfile);
        } else {
          console.error("Failed to load doctor profile");
        }
      } catch (err) {
        console.error("Error fetching doctor profile:", err);
      } finally {
        setDoctorLoading(false);
      }
    };

    if (appointment) {
      fetchDoctorProfile();
    }
  }, [appointment]);

  // Generate slots from doctor availability
  useEffect(() => {
    if (doctor?.availability && selectedDate) {
      const dayName = selectedDate.toLocaleDateString("en-US", { weekday: "long" });

      const daySchedule = Array.isArray(doctor.availability)
        ? doctor.availability.find((a: any) => a.day === dayName)
        : doctor.availability[dayName];

      const slots: Slots = { morning: [], evening: [] };

      if (!daySchedule) {
        setAvailableSlots(slots);
        setSelectedTime(null);
        return;
      }

      const step = doctor?.slot_duration_minutes || 30;

      // Helper functions for time conversion
      const timeToMinutes = (time: string) => {
        const [h, m] = time.split(":").map(Number);
        return h * 60 + m;
      };

      const minutesToTime = (mins: number) => {
        const h = Math.floor(mins / 60).toString().padStart(2, "0");
        const m = (mins % 60).toString().padStart(2, "0");
        return `${h}:${m}`;
      };

      const generateSlotsFromRange = (start: string, end: string, step: number) => {
        const slotsArr: string[] = [];
        let current = timeToMinutes(start);
        const endMinutes = timeToMinutes(end);

        while (current + step <= endMinutes) {
          slotsArr.push(minutesToTime(current));
          current += step;
        }

        return slotsArr;
      };

      // Generate morning slots
      if (!daySchedule.morning?.is_off && daySchedule.morning?.start && daySchedule.morning?.end) {
        slots.morning.push(...generateSlotsFromRange(
          daySchedule.morning.start,
          daySchedule.morning.end,
          step
        ));
      }

      // Generate evening slots
      if (!daySchedule.evening?.is_off && daySchedule.evening?.start && daySchedule.evening?.end) {
        slots.evening.push(...generateSlotsFromRange(
          daySchedule.evening.start,
          daySchedule.evening.end,
          step
        ));
      }

      // Filter out past slots for today
      const today = new Date();
      const isToday = selectedDate.toDateString() === today.toDateString();
      const currentMinutes = today.getHours() * 60 + today.getMinutes();

      if (isToday) {
        slots.morning = slots.morning.filter((slot) => {
          const mins = timeToMinutes(slot);
          return mins > currentMinutes;
        });

        slots.evening = slots.evening.filter((slot) => {
          const mins = timeToMinutes(slot);
          return mins > currentMinutes;
        });
      }

      setAvailableSlots(slots);
    } else {
      setAvailableSlots(null);
    }
    setSelectedTime(null);
  }, [selectedDate, doctor]);

  const handleReschedule = async () => {
    if (!appointment?.id && !appointment?._id) {
      toast.error('Appointment ID is missing');
      return;
    }

    if (!selectedDate || !selectedTime) {
      toast.error('Please select both date and time');
      return;
    }

    const appointmentId = appointment.id || appointment._id || '';
    const dateString = selectedDate.toISOString().split('T')[0];

    const result = await reschedule(appointmentId, {
      appointment_date: dateString,
      appointment_time: selectedTime,
      patient_note: patientNote || undefined,
    });

    if (result.success) {
      setOpenModal(false);
      // Prefer callback-based refetch when provided (React-friendly)
      if (typeof onSuccess === 'function') {
        onSuccess();
      } else {
        window.dispatchEvent(new Event('appointments:refetch'));
      }
    }
  };

  return (
    <div className="p-4 flex flex-col gap-4 w-[800px] max-w-full">
      <div className="flex flex-col gap-1">
        <h2 className="font-semibold text-lg">Reschedule Appointment</h2>
        <p className="text-sm text-zinc-500">Select a new date and time for your appointment</p>
      </div>

      {/* Current Appointment Info */}
      {appointment && (
        <div className="bg-blue-50 border border-blue-200 rounded-md p-3">
          <p className="text-xs font-semibold text-blue-900 mb-2">Current Appointment</p>
          <div className="flex items-center gap-4 text-sm text-blue-800">
            <div className="flex items-center gap-1">
              <span className="material-symbols-sharp text-base">calendar_today</span>
              <span>{appointment.appointment_date}</span>
            </div>
            <div className="flex items-center gap-1">
              <span className="material-symbols-sharp text-base">schedule</span>
              <span>{appointment.appointment_time}</span>
            </div>
            {appointment.clinics?.name && (
              <div className="flex items-center gap-1">
                <span className="material-symbols-sharp text-base">home_health</span>
                <span>{appointment.clinics.name}</span>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Loading State */}
      {doctorLoading && <Loading size={"200px"} />}

      {/* Date selector */}
      <div>
        <DateSelector selectedDate={selectedDate} onDateChange={setSelectedDate} />
      </div>

      {/* Available time-slots */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 mt-2">
        {
          availableSlots?.morning?.length === 0 && availableSlots?.evening?.length === 0 ? (
            <div className="col-span-full">
              <p className="flex items-center text-[11px] rounded-sm py-4 text-zinc-400 gap-1 justify-center">
                <span className="material-symbols-outlined text-base">info</span>
                No available time slots for this day. Please choose another date.
              </p>
            </div>
          ) : (
            <>
              <SlotGrid
                selectedTime={selectedTime || ''}
                setSelectedTime={setSelectedTime}
                slots={availableSlots?.morning || []}
                label="Morning"
                icon="light_mode"
                errorMessage="No morning slots available."
              />
              <SlotGrid
                selectedTime={selectedTime || ''}
                setSelectedTime={setSelectedTime}
                slots={availableSlots?.evening || []}
                label="Evening"
                icon="dark_mode"
                errorMessage="No evening slots available."
              />
            </>
          )
        }
      </div>

      {/* Patient Note */}
      <div className="flex flex-col gap-1 mt-2">
        <label htmlFor="reschedule_note" className="text-sm font-semibold text-zinc-700">Notes (Optional)</label>
        <p className="help-text text-[11px] text-gray-500 -mt-1">
          Share any additional information for the doctor.
        </p>
        <textarea
          value={patientNote}
          onChange={(e) => setPatientNote(e.target.value)}
          id="reschedule_note"
          className="mt-1.5 text-[12px] border border-gray-400 bg-gray-50 hover:bg-sky-50 rounded-sm py-2 px-2.5 outline-none focus:ring-2 focus:ring-sky-300/40 focus:border-sky-400 transition resize-none"
          rows={3}
          maxLength={300}
        />
        <p className="self-end text-xs text-zinc-500">{patientNote.length}/300</p>
      </div>

      {/* Action Buttons */}
      <div className="flex items-center gap-3 pt-4 border-t border-zinc-200">
        <button
          onClick={() => setOpenModal(false)}
          disabled={loading}
          className="bg-zinc-500 hover:bg-zinc-400 disabled:bg-zinc-300 text-white text-sm px-4 py-2 min-w-[100px] cursor-pointer rounded-md transition-colors"
        >
          Cancel
        </button>
        <button
          onClick={handleReschedule}
          disabled={loading || !selectedDate || !selectedTime}
          className="bg-sky-600 hover:bg-sky-700 disabled:bg-sky-400 text-white text-sm px-4 py-2 min-w-[120px] cursor-pointer rounded-md transition-colors flex items-center justify-center gap-2"
        >
          {loading ? (
            <>
              <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
              <span>Rescheduling...</span>
            </>
          ) : (
            <>
              <span className="material-symbols-sharp text-base">check</span>
              <span>Confirm Reschedule</span>
            </>
          )}
        </button>
      </div>
    </div>
  );
};

export default RescheduleModal;