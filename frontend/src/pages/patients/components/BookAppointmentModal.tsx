import React, { useState, useEffect, type FormEvent, type ElementType } from 'react';
import { getClinicById as getClinicInfo, updateAppointment as updateAppointmentAPI } from '../../../lib/apiClient';
import { toast } from 'react-toastify';
import { Modal } from '../../../components/Modal';
import {
  bookAppointment,
  getDoctorsByClinic,
  getMedicalConditionsByClinic,
  getBookedSlotsForDoctorOnDate,
  checkDoctorLeaveStatus,
} from '../api';
import type { ClinicPatientRow, MedicalCondition } from '../types'; 
import { IconUser, IconIdBadge, IconPhone, IconCalendar, IconStethoscope } from '@tabler/icons-react';
import { useAuth } from '../../../state/useAuth';
// ... (Keep your existing Availability types and helper functions: timeStringToMinutes, etc.) ...

export type AvailabilityPeriod = {
  start: string;
  end: string;
  is_off: boolean;
};

export type AvailabilityDay = {
  day: string;
  morning: AvailabilityPeriod;
  evening: AvailabilityPeriod;
};

export type DoctorProfile = {
  id: string;
  full_name: string | null;
  availability?: AvailabilityDay[] | null;
  slot_duration_minutes?: number | null;
};

function timeStringToMinutes(time: string): number {
  const [h, m] = time.split(':').map(Number);
  return h * 60 + m;
}

function minutesToTimeString(total: number): string {
  const h = Math.floor(total / 60);
  const m = total % 60;
  return `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}`;
}

function generateSlotsForRange(start: string, end: string, stepMinutes: number): string[] {
  if (!start || !end) return [];
  const slots: string[] = [];
  let current = timeStringToMinutes(start);
  const endMin = timeStringToMinutes(end);

  while (current < endMin) {
    slots.push(minutesToTimeString(current));
    current += stepMinutes;
  }
  return slots;
}

function getDayNameFromDate(dateStr: string): string {
  const d = new Date(`${dateStr}T00:00:00`);
  return d.toLocaleDateString('en-US', { weekday: 'long' });
}

function computeDoctorSlotsForDate(
  doctor: DoctorProfile,
  date: string
): string[] {
  if (!doctor || !doctor.availability || !doctor.slot_duration_minutes) return [];

  const availability = doctor.availability as AvailabilityDay[];

  const dayName = getDayNameFromDate(date);
  const dayConfig = availability.find(d => d.day === dayName);
  if (!dayConfig) return [];

  const step = doctor.slot_duration_minutes;
  const slots: string[] = [];

  if (!dayConfig.morning.is_off) {
    slots.push(...generateSlotsForRange(dayConfig.morning.start, dayConfig.morning.end, step));
  }
  if (!dayConfig.evening.is_off) {
    slots.push(...generateSlotsForRange(dayConfig.evening.start, dayConfig.evening.end, step));
  }
  return slots;
}

type Props = {
  open: boolean;
  onClose: () => void;
  onSuccess: () => void;
  patient: ClinicPatientRow | null;
  clinicId: string | null;
  // Optional: when editing an existing appointment
  appointment?: any | null;
  isEditing?: boolean;
};

type InputProps = React.InputHTMLAttributes<HTMLInputElement> & {
  label: string;
  icon: ElementType;
};

const Input = React.forwardRef<HTMLInputElement, InputProps>(({ id, label, icon: Icon, type = 'text', ...props }, ref) => (
  <div>
    <label htmlFor={id} className="block text-sm font-medium text-slate-700 mb-1">{label}</label>
    <div className="relative">
      <span className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
        <Icon className="h-5 w-5 text-slate-400" />
      </span>
      <input
        id={id}
        ref={ref}
        type={type}
        className="w-full rounded-xl border border-slate-300 bg-white pl-10 pr-3 py-2.5 text-slate-900 outline-none focus:ring-4 focus:ring-sky-300/40 focus:border-sky-400 transition disabled:bg-slate-100 disabled:cursor-not-allowed"
        {...props}
      />
    </div>
  </div>
));

export default function BookAppointmentModal({ open, onClose, onSuccess, patient, clinicId, appointment = null, isEditing = false }: Props) {
  const { user } = useAuth(); 
  const [date, setDate] = useState('');
  const [time, setTime] = useState('');
  const [saving, setSaving] = useState(false);
  const [phone, setPhone] = useState('');
  const [doctors, setDoctors] = useState<DoctorProfile[]>([]);
  const [selectedDoctorId, setSelectedDoctorId] = useState('');
  const [doctorsLoading, setDoctorsLoading] = useState(false);
  
  const [conditions, setConditions] = useState<MedicalCondition[]>([]);
  const [selectedConditions, setSelectedConditions] = useState<string[]>([]);
  // NEW: State to store values for conditions (e.g., {"Fever": "102F"})
  const [conditionValues, setConditionValues] = useState<Record<string, string>>({});
  
  const [conditionsLoading, setConditionsLoading] = useState(false);
  const [availableSlots, setAvailableSlots] = useState<string[]>([]);
  const [bookedSlots, setBookedSlots] = useState<string[]>([]);
  
  // Doctor leave state
  const [isDoctorOnLeave, setIsDoctorOnLeave] = useState(false);
  const [leaveReason, setLeaveReason] = useState<string | undefined>(undefined);
  const [checkingLeave, setCheckingLeave] = useState(false);

  // Clinic info state
  const [clinicInfo, setClinicInfo] = useState<any>(null);
  // Fetch clinic info when modal opens and clinicId is available
  useEffect(() => {
    if (open && clinicId) {
      setClinicInfo(null);
      // setClinicInfoLoading(true); // removed unused loading state
      const fetchClinicInfo = async () => {
        try {
          // getClinicInfo expects no argument, so we fetch all and filter by clinicId
          const res = await getClinicInfo();
          let clinic = null;
          if (Array.isArray(res.data)) {
            clinic = res.data.find((c: any) => c.clinic_id === clinicId || c.id === clinicId);
          } else if (res.data && (res.data.clinic_id === clinicId || res.data.id === clinicId)) {
            clinic = res.data;
          }
          setClinicInfo(clinic || null);
        } catch (err) {
          setClinicInfo(null);
        } finally {
          // setClinicInfoLoading(false); // removed unused loading state
        }
      };
      fetchClinicInfo();
    } else {
      setClinicInfo(null);
    }
  }, [open, clinicId]);

  // ... (Keep existing useEffects for slots, booked slots, patient data, and doctors) ...

  useEffect(() => {
    if (!selectedDoctorId || !date) {
      setAvailableSlots([]);
      setTime('');
      return;
    }
    const doctor = doctors.find(d => d.id === selectedDoctorId);
    if (!doctor) {
      setAvailableSlots([]);
      setTime('');
      return;
    }
    const slots = computeDoctorSlotsForDate(doctor, date);
    setAvailableSlots(slots);
    setTime('');
  }, [selectedDoctorId, date, doctors]);

  useEffect(() => {
    setBookedSlots([]); 
    if (!selectedDoctorId || !date) return;

    let cancelled = false;
    const fetchBooked = async () => {
      try {
        const slots = await getBookedSlotsForDoctorOnDate(selectedDoctorId, date);
        if (!cancelled) setBookedSlots(slots);
      } catch (err) {
        console.error('Error fetching booked slots:', err);
      }
    };
    fetchBooked();
    return () => { cancelled = true; };
  }, [selectedDoctorId, date]);

  // Check if doctor is on leave
  useEffect(() => {
    setIsDoctorOnLeave(false);
    setLeaveReason(undefined);
    if (!selectedDoctorId || !date) return;

    let cancelled = false;
    const checkLeave = async () => {
      try {
        setCheckingLeave(true);
        const leaveStatus = await checkDoctorLeaveStatus(selectedDoctorId, date, doctors);
        console.log('Leave status:', { selectedDoctorId, date, leaveStatus, doctorData: doctors.find(d => d.id === selectedDoctorId) });
        if (!cancelled) {
          setIsDoctorOnLeave(leaveStatus.isOnLeave);
          setLeaveReason(leaveStatus.leaveReason);
          if (leaveStatus.isOnLeave) {
            setTime(''); // Clear selected time if doctor is on leave
          }
        }
      } catch (err) {
        console.error('Error checking doctor leave:', err);
        // If there's an error checking leave, continue normally
      } finally {
        setCheckingLeave(false);
      }
    };
    checkLeave();
    return () => { cancelled = true; };
  }, [selectedDoctorId, date, doctors]);

  useEffect(() => {
    if (patient) {
      setPhone(patient?.contact_number ?? '');
      // If editing an appointment, prefill from appointment data
      if (isEditing && appointment) {
        setDate(appointment.appointment_date || new Date().toISOString().split('T')[0]);
        setTime(appointment.appointment_time || '');
        const docId = appointment.doctor_id && typeof appointment.doctor_id === 'object' ? appointment.doctor_id.id || appointment.doctor_id._id || '' : appointment.doctor_id || '';
        setSelectedDoctorId(docId);
        setSelectedConditions(appointment.medical_conditions || []);
      } else {
        setDate(new Date().toISOString().split('T')[0]);
        setTime('');
        setSelectedConditions([]);
        setConditionValues({}); // Clear values on new patient load
      }
    }
  }, [patient]);

  useEffect(() => {
    if (open && clinicId) {
      const fetchDoctors = async () => {
        setDoctorsLoading(true);
        try {
          const doctorList = await getDoctorsByClinic(clinicId);
          setDoctors(doctorList);
          setSelectedDoctorId(''); 
        } catch (error) {
          toast.error("Could not fetch the list of doctors.");
        } finally {
          setDoctorsLoading(false);
        }
      };
      fetchDoctors();
    }
  }, [open, clinicId]);

  useEffect(() => {
    if (open && clinicId) {
      const fetchConditions = async () => {
        setConditionsLoading(true);
        try {
          const list = await getMedicalConditionsByClinic(clinicId);
          setConditions(list);
          setSelectedConditions([]);
          setConditionValues({});
        } catch (err) {
          toast.error('Could not fetch medical conditions.');
        } finally {
          setConditionsLoading(false);
        }
      };
      fetchConditions();
    }
  }, [open, clinicId]);

  // NEW: Updated toggle logic to handle cleaning up values
  const toggleCondition = (condition: MedicalCondition) => {
    setSelectedConditions(prev => {
      const isSelected = prev.includes(condition.name);
      
      if (isSelected) {
        // If unchecking, remove from selected list AND remove any typed value
        const newValues = { ...conditionValues };
        delete newValues[condition.name];
        setConditionValues(newValues);
        return prev.filter(n => n !== condition.name);
      } else {
        // If checking, just add to list
        return [...prev, condition.name];
      }
    });
  };

  // NEW: Handler for typing in values
  const handleConditionValueChange = (name: string, value: string) => {
    setConditionValues(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!patient || !clinicId || !date || !time || !selectedDoctorId) {
      toast.warn('Please fill in all the required fields, including selecting a doctor.');
      return;
    }

    // Check if doctor is on leave
    if (isDoctorOnLeave) {
      toast.error('Cannot book appointment. The selected doctor is on leave on this date.');
      return;
    }

    // NEW: Format the conditions. 
    // If "Fever" is selected and has value "102F", save as "Fever: 102F".
    // If just "Diabetes", save as "Diabetes".
    const finalConditions = selectedConditions.map(name => {
      const conditionDef = conditions.find(c => c.name === name);
      const userValue = conditionValues[name];
      
      if (conditionDef?.has_value && userValue?.trim()) {
        return `${name}: ${userValue.trim()}`;
      }
      return name;
    });

    setSaving(true);

    try {
      const selectedDoctor = doctors.find(d => d.id === selectedDoctorId);
      const doctorName = selectedDoctor?.full_name || appointment?.doctor_name || null;

      const payload: any = {
        clinic_id: clinicInfo?.clinic_id,
        patient_id: patient?.id ?? (patient as any)?._id ?? 'null',
        uhid: patient?.uhid ?? '',
        full_name: patient?.full_name ?? '',
        contact_number: phone,
        appointment_date: date,
        appointment_time: time,
        doctor_id: selectedDoctorId,
        doctor_name: doctorName,
        medical_conditions: finalConditions, // Use the formatted array
        clinics: clinicInfo
          ? {
              id: user?.id ?? '',
              name: clinicInfo.name || '',
              contact_number: clinicInfo.phone || clinicInfo.contact_number || '',
              address: clinicInfo.address
                ? (typeof clinicInfo.address === 'string'
                    ? clinicInfo.address
                    : [clinicInfo.address.street, clinicInfo.address.city, clinicInfo.address.state, clinicInfo.address.postal_code, clinicInfo.address.country].filter(Boolean).join(', '))
                : '',
              location: clinicInfo.location
                ? [clinicInfo.location.floor, clinicInfo.location.room_number, clinicInfo.location.wing].filter(Boolean).join(', ')
                : '',
              admin_staff_name: clinicInfo.admin_staff_name || ''
            }
          : {
              id: clinicId,
              name: '',
              contact_number: '',
              address: '',
              location: '',
              admin_staff_name: ''
            }
      };
      
      // Validate payload before sending
      const missingFields: string[] = [];
      if (!payload.clinic_id) missingFields.push('clinic_id');
      if (!payload.patient_id) missingFields.push('patient_id');
      if (!payload.full_name) missingFields.push('full_name');
      if (!payload.appointment_date) missingFields.push('appointment_date');
      if (!payload.appointment_time) missingFields.push('appointment_time');
      if (!payload.doctor_id) missingFields.push('doctor_id');
      
      if (missingFields.length > 0) {
        console.error('Client-side validation failed:', { missingFields, payload });
        toast.error(`Missing fields: ${missingFields.join(', ')}`);
        setSaving(false);
        return;
      }

      
      if (isEditing && appointment) {
        // Update only doctor/time/date and clear provisional flag. Do not touch status.
        const upd: any = {
          doctor_id: selectedDoctorId,
          doctor_name: doctorName,
          appointment_time: time,
          appointment_date: date,
          provisional: false,
        };
        await updateAppointmentAPI(appointment._id || appointment.id, upd);
        toast.success('Appointment updated');
        onSuccess();
      } else {
        const confirmation = await bookAppointment(payload);
        toast.success(
          <div>
            <p className="font-semibold">Appointment Booked!</p>
            <p>ID: <strong>{confirmation.appointment_uid}</strong></p>
          </div>
        );
        onSuccess();
      }
    } catch (error: any) {
      console.error('Booking Error:', error);
      if (error.code === '23505' || error.message?.includes('unique_doctor_slot')) {
        toast.error('This time slot was just booked by someone else. Please choose another.');
        const slots = await getBookedSlotsForDoctorOnDate(selectedDoctorId, date);
const normalized = slots.map(t => String(t).slice(0, 5));

setBookedSlots(normalized);
        setTime('');
      } else {
        toast.error(error.message || 'Failed to book appointment.');
      }
    } finally {
      setSaving(false);
    }
  };

  if (!patient) return null; 

  return (
    <Modal isOpen={open} onClose={onClose} title={isEditing ? 'Update Appointment' : 'Book New Appointment'}>
      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Input label="Patient Name" id="name" icon={IconUser} value={patient?.full_name ?? ''} disabled />
            <Input label="UHID" id="uhid" icon={IconIdBadge} value={patient?.uhid ?? 'N/A'} disabled />
        </div>
        <hr/>
         <div className="pt-4">
            <label htmlFor="doctor" className="block text-sm font-medium text-slate-700 mb-1">Assign Doctor</label>
            <div className="relative">
                <span className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
                    <IconStethoscope className="h-5 w-5 text-slate-400" />
                </span>
                <select
                    id="doctor"
                    value={selectedDoctorId}
                    onChange={(e) => setSelectedDoctorId(e.target.value)}
                    disabled={doctorsLoading}
                    required
                    className="w-full rounded-xl border border-slate-300 bg-white pl-10 pr-3 py-2.5 text-slate-900 outline-none focus:ring-4 focus:ring-sky-300/40 focus:border-sky-400 transition"
                >
                    <option value="" disabled>{doctorsLoading ? 'Loading doctors...' : 'Select a doctor'}</option>
                    {doctors.map(doc => (
                        <option key={doc.id} value={doc.id}>{doc.full_name}</option>
                    ))}
                </select>
            </div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Input
            label="Contact Number"
            id="phone"
            icon={IconPhone}
            type="tel"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            disabled={isEditing}
            placeholder="Enter contact number"
            required
          />
          <Input
            label="Appointment Date"
            id="date"
            icon={IconCalendar}
            type="date"
            value={date}
            min={new Date().toISOString().split('T')[0]}
            onChange={(e) => setDate(e.target.value)}
            disabled={isEditing}
            required
          />
          <p className="text-xs text-slate-500 mt-1">Past dates are disabled. Select from today onwards.</p>
        </div>

        <div className="pt-1">
          <label className="block text-sm font-medium text-slate-700 mb-1">Appointment Time</label>
          
          {/* Doctor on leave warning */}
          {isDoctorOnLeave && (
            <div className="mb-3 p-3 rounded-lg bg-amber-50 border border-amber-200 text-amber-900">
              <p className="text-sm font-semibold">⚠️ Doctor on Leave</p>
              {leaveReason && <p className="text-sm mt-1">Reason: {leaveReason}</p>}
              <p className="text-xs mt-1">This doctor is not available on the selected date.</p>
            </div>
          )}
          
          {!selectedDoctorId ? (
            <p className="text-sm text-slate-500">Please select a doctor to see available time slots.</p>
          ) : !date ? (
            <p className="text-sm text-slate-500">Please select a date to see available time slots.</p>
          ) : isDoctorOnLeave ? (
            <div className="p-4 rounded-lg bg-gray-50 border border-gray-200 text-center">
              <p className="text-sm text-gray-600">Appointments cannot be booked as the doctor is on leave.</p>
            </div>
          ) : checkingLeave ? (
            <p className="text-sm text-slate-500">Checking availability...</p>
          ) : availableSlots.length === 0 ? (
            <p className="text-sm text-slate-500">No available slots for the selected day.</p>
          ) : (
            <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 gap-2">
              {availableSlots.map((slot) => {
                const isBooked = bookedSlots.includes(slot);
                const isDisabled = isDoctorOnLeave || isBooked;
                return (
                  <button
                    key={slot}
                    type="button"
                    disabled={isDisabled}
                    onClick={() => { if (!isDisabled) setTime(slot); }}
                    className={`px-3 py-2 text-sm rounded-lg border transition-colors ${
                      isDoctorOnLeave
                        ? 'bg-gray-100 text-gray-400 border-gray-200 line-through cursor-not-allowed'
                        : isBooked
                        ? 'bg-red-50 text-red-300 border-red-100 line-through cursor-not-allowed'
                        : time === slot
                        ? 'bg-sky-500 text-white font-semibold border-sky-500'
                        : 'bg-white hover:border-sky-400 border-slate-200'
                    }`}
                    title={isDoctorOnLeave ? "Doctor is on leave" : isBooked ? "Slot already booked" : ""}
                  >
                    {slot}
                  </button>
                );
              })}
            </div>
          )}
        </div>

        {/* MEDICAL CONDITIONS SECTION - UPDATED */}
        <div className="pt-2">
          <label className="block text-sm font-medium text-slate-700 mb-2">
            Medical Conditions
          </label>
          {conditionsLoading ? (
            <p className="text-sm text-slate-500">Loading conditions…</p>
          ) : conditions.length === 0 ? (
            <p className="text-sm text-slate-500">No medical conditions configured for this clinic.</p>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {conditions.map(c => {
                const isChecked = selectedConditions.includes(c.name);
                return (
                  <div key={c.id} className={`rounded-lg border p-2 transition-all ${isChecked ? 'border-sky-300 bg-sky-50' : 'border-slate-200'}`}>
                    <label className="flex items-center gap-2 cursor-pointer w-full">
                      <input
                        type="checkbox"
                        className="h-4 w-4 text-sky-600 focus:ring-sky-500 border-gray-300 rounded"
                        checked={isChecked}
                        onChange={() => toggleCondition(c)}
                      />
                      <span className="text-sm text-slate-800 font-medium">{c.name}</span>
                    </label>

                    {/* RENDER INPUT FIELD IF REQUIRED */}
                    {isChecked && c.has_value && (
                      <div className="mt-2 ml-6">
                        <input 
                          type="text" 
                          placeholder="Enter value (e.g. 102F)"
                          className="w-full text-sm border-b border-slate-300 bg-transparent py-1 px-1 outline-none focus:border-sky-500 transition-colors placeholder:text-slate-400"
                          value={conditionValues[c.name] || ''}
                          onChange={(e) => handleConditionValueChange(c.name, e.target.value)}
                          // Stop propagation so clicking input doesn't trigger the checkbox label logic
                          onClick={(e) => e.stopPropagation()}
                        />
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>

        <div className="flex justify-end gap-3 pt-4 border-t border-slate-200">
          <button
            type="button"
            className="px-4 py-2 text-sm font-medium text-slate-700 bg-slate-100 rounded-xl hover:bg-slate-200 transition"
            onClick={onClose}
          >
            Cancel
          </button>
          <button
            type="submit"
            className="inline-flex items-center justify-center gap-2 px-5 py-2.5 font-medium text-white transition bg-gradient-to-r from-sky-600 to-cyan-500 rounded-xl shadow-sm hover:brightness-105 active:brightness-95 disabled:opacity-60 disabled:cursor-not-allowed"
            disabled={saving}
          >
            {saving ? (isEditing ? 'Updating...' : 'Booking...') : (isEditing ? 'Update Appointment' : 'Book Appointment')}
          </button>
        </div>
      </form>
    </Modal>
  );
}