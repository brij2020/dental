// features/appointments/components/AppointmentActions.tsx
import React from 'react';
import { toast } from 'react-toastify';
import { IconDotsVertical, IconTrash, IconBrandWhatsapp, IconCalendarTime, IconX, IconEye } from '@tabler/icons-react';
import {
  getAppointmentById,
  getBookedSlotsAPI,
  getProfileById,
  getProfileSlots,
  updateAppointment,
} from '../../../lib/apiClient';
import DateSelector from '../../../components/DateSelector';

type Props = {
  appointmentId: string;
  currentDate: string;
  currentTime: string;
  appointmentType?: 'in_person' | 'video';
  currentMedicalConditions?: string[];
  currentPatientNote?: string | null;
  onRescheduled?: () => void;
};

export default function AppointmentActions({
  appointmentId,
  currentDate,
  currentTime,
  appointmentType = 'in_person',
  currentMedicalConditions = [],
  currentPatientNote = null,
  onRescheduled,
}: Props) {
  const [open, setOpen] = React.useState(false);
  const [coords, setCoords] = React.useState<{ top: number; left: number } | null>(null);
  const [isRescheduleOpen, setIsRescheduleOpen] = React.useState(false);
  const [isViewOpen, setIsViewOpen] = React.useState(false);
  const [isCancelConfirmOpen, setIsCancelConfirmOpen] = React.useState(false);
  const [isCancelling, setIsCancelling] = React.useState(false);
  const [loadingView, setLoadingView] = React.useState(false);
  const [appointmentDetails, setAppointmentDetails] = React.useState<any | null>(null);
  const [loadingDoctorInfo, setLoadingDoctorInfo] = React.useState(false);
  const [rescheduleDate, setRescheduleDate] = React.useState(currentDate || '');
  const [rescheduleTime, setRescheduleTime] = React.useState(currentTime || '');
  const [doctorId, setDoctorId] = React.useState<string | null>(null);
  const [doctorName, setDoctorName] = React.useState<string>('');
  const [slotDuration, setSlotDuration] = React.useState<number>(15);
  const [availableSlots, setAvailableSlots] = React.useState<string[]>([]);
  const [bookedSlots, setBookedSlots] = React.useState<string[]>([]);
  const [loadingSlots, setLoadingSlots] = React.useState(false);
  const [isSubmitting, setIsSubmitting] = React.useState(false);
  const btnRef = React.useRef<HTMLButtonElement | null>(null);
  const menuRef = React.useRef<HTMLDivElement | null>(null);

  const generateSlots = React.useCallback((start: string | null, end: string | null, interval = 15) => {
    if (!start || !end) return [] as string[];
    const [sH, sM] = start.split(':').map(Number);
    const [eH, eM] = end.split(':').map(Number);
    const startTotal = sH * 60 + sM;
    const endTotal = eH * 60 + eM;
    const out: string[] = [];

    for (let t = startTotal; t <= endTotal; t += interval) {
      const h = Math.floor(t / 60);
      const m = t % 60;
      out.push(`${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`);
    }

    return out;
  }, []);

  const loadSlotsForDate = React.useCallback(
    async (docId: string, date: string) => {
      if (!docId || !date) return;
      setLoadingSlots(true);
      setAvailableSlots([]);
      setBookedSlots([]);
      setRescheduleTime('');

      try {
        const slotsResp = await getProfileSlots(docId, { consultation_type: appointmentType });
        const slotsPayload = slotsResp?.data?.data ?? slotsResp?.data ?? slotsResp;
        const availability = slotsPayload?.availability ?? [];
        const mins = Number(slotsPayload?.slot_duration_minutes ?? 15);
        setSlotDuration(mins);

        const dayName = new Date(`${date}T00:00:00`).toLocaleDateString('en-US', { weekday: 'long' });
        const dayConfig = availability.find((d: any) => d.day === dayName);

        let slots: string[] = [];
        if (dayConfig && !(dayConfig.morning?.is_off && dayConfig.evening?.is_off)) {
          if (!dayConfig.morning?.is_off) {
            slots = slots.concat(generateSlots(dayConfig.morning.start, dayConfig.morning.end, mins));
          }
          if (!dayConfig.evening?.is_off) {
            slots = slots.concat(generateSlots(dayConfig.evening.start, dayConfig.evening.end, mins));
          }
        }
        setAvailableSlots(slots);

        const bookedResp = await getBookedSlotsAPI(docId, date);
        const bookedPayload = bookedResp?.data?.data ?? bookedResp?.data ?? [];
        const booked = (bookedPayload || []).map((a: any) => String(a.appointment_time || a.time || a).slice(0, 5));
        // Keep current slot selectable when date is unchanged and doctor is unchanged.
        const normalizedBooked = booked.filter((t: string) => !(date === currentDate && t === currentTime));
        setBookedSlots(normalizedBooked);
      } catch (err) {
        console.warn('Failed to load doctor slots for reschedule:', err);
        setAvailableSlots([]);
        setBookedSlots([]);
      } finally {
        setLoadingSlots(false);
      }
    },
    [appointmentType, currentDate, currentTime, generateSlots]
  );

  const handleAction = async (action: string) => {
    setOpen(false);

    if (action !== 'Delete') {
      console.log(`${action} clicked. This functionality is not yet implemented.`);
      return;
    }
    setIsCancelConfirmOpen(true);
  };

  const confirmCancelAppointment = async () => {
    try {
      setIsCancelling(true);
      await updateAppointment(appointmentId, { status: 'cancelled' });
      toast.success('Appointment cancelled.');
      setIsCancelConfirmOpen(false);
      onRescheduled?.();
    } catch (error: any) {
      const message = error?.response?.data?.message || 'Failed to cancel appointment.';
      toast.error(message);
    } finally {
      setIsCancelling(false);
    }
  };

  React.useEffect(() => {
    if (!isCancelConfirmOpen) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && !isCancelling) setIsCancelConfirmOpen(false);
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [isCancelConfirmOpen, isCancelling]);

  const openViewModal = async () => {
    setOpen(false);
    setIsViewOpen(true);
    setLoadingView(true);
    try {
      const response = await getAppointmentById(appointmentId);
      const payload = response?.data?.data ?? response?.data ?? null;
      setAppointmentDetails(payload);
    } catch (error) {
      console.error('Failed to load appointment details:', error);
      toast.error('Failed to load appointment details.');
      setIsViewOpen(false);
    } finally {
      setLoadingView(false);
    }
  };

  const toggle = () => {
    if (!btnRef.current) return;
    if (!open) {
      const rect = btnRef.current.getBoundingClientRect();
      const menuWidth = 224; // w-56 =~ 224px
      const padding = 8;
      let left = rect.right - menuWidth;
      if (left < padding) left = rect.left;
      if (left + menuWidth > window.innerWidth - padding) left = window.innerWidth - menuWidth - padding;
      const top = rect.bottom + 6;
      setCoords({ top, left });
      setOpen(true);
    } else {
      setOpen(false);
    }
  };

  const updateMenuPosition = React.useCallback(() => {
    if (!btnRef.current) return;
    const rect = btnRef.current.getBoundingClientRect();
    const menuWidth = 224;
    const padding = 8;
    let left = rect.right - menuWidth;
    if (left < padding) left = rect.left;
    if (left + menuWidth > window.innerWidth - padding) left = window.innerWidth - menuWidth - padding;
    const top = rect.bottom + 6;
    setCoords({ top, left });
  }, []);

  // Close on outside click or Escape
  React.useEffect(() => {
    if (!open) return;
    const onMousedown = (e: MouseEvent) => {
      const target = e.target as Node;
      if (menuRef.current && menuRef.current.contains(target)) return;
      if (btnRef.current && btnRef.current.contains(target)) return;
      setOpen(false);
    };
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') setOpen(false); };
    const onScrollOrResize = () => updateMenuPosition();
    window.addEventListener('mousedown', onMousedown);
    window.addEventListener('keydown', onKey);
    window.addEventListener('scroll', onScrollOrResize, true);
    window.addEventListener('resize', onScrollOrResize);
    return () => {
      window.removeEventListener('mousedown', onMousedown);
      window.removeEventListener('keydown', onKey);
      window.removeEventListener('scroll', onScrollOrResize, true);
      window.removeEventListener('resize', onScrollOrResize);
    };
  }, [open, updateMenuPosition]);

  React.useEffect(() => {
    if (!isRescheduleOpen) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && !isSubmitting) setIsRescheduleOpen(false);
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [isRescheduleOpen, isSubmitting]);

  const openRescheduleModal = async () => {
    const initialDate = currentDate || new Date().toISOString().slice(0, 10);
    setOpen(false);
    setRescheduleDate(initialDate);
    setRescheduleTime(currentTime || '');
    setLoadingDoctorInfo(true);
    setIsRescheduleOpen(true);

    try {
      const apptResp = await getAppointmentById(appointmentId);
      const apptPayload = apptResp?.data?.data ?? apptResp?.data ?? null;
      setAppointmentDetails(apptPayload);
      const fetchedDoctorId = apptPayload?.doctor_id ? String(apptPayload.doctor_id) : null;

      if (!fetchedDoctorId) {
        toast.error('Doctor not found for this appointment.');
        return;
      }

      setDoctorId(fetchedDoctorId);

      try {
        const doctorResp = await getProfileById(fetchedDoctorId);
        const doctorPayload = doctorResp?.data?.data ?? doctorResp?.data ?? {};
        setDoctorName(String(doctorPayload?.full_name || apptPayload?.doctor_name || 'Unknown Doctor'));
      } catch {
        setDoctorName(String(apptPayload?.doctor_name || 'Unknown Doctor'));
      }

      await loadSlotsForDate(fetchedDoctorId, initialDate);
    } catch (err) {
      console.error('Failed loading appointment/doctor details:', err);
      toast.error('Unable to load doctor information.');
    } finally {
      setLoadingDoctorInfo(false);
    }
  };

  const handleReschedule = async () => {
    if (!doctorId) {
      toast.error('Doctor details are not loaded yet.');
      return;
    }
    if (!rescheduleDate || !rescheduleTime) {
      toast.error('Please select date and slot time.');
      return;
    }

    try {
      setIsSubmitting(true);
      // Re-fetch latest record before update to avoid sending stale/empty conditions.
      let latestAppointment: any = null;
      try {
        const latestResp = await getAppointmentById(appointmentId);
        latestAppointment = latestResp?.data?.data ?? latestResp?.data ?? null;
      } catch {
        // Non-fatal: fallback to local values below
      }

      const payload: any = {
        appointment_date: rescheduleDate,
        appointment_time: rescheduleTime,
      };

      // Preserve existing values so reschedule does not drop them.
      const medicalFromLatest = Array.isArray(latestAppointment?.medical_conditions)
        ? latestAppointment.medical_conditions
        : null;
      const medicalFromDetails = Array.isArray(appointmentDetails?.medical_conditions)
        ? appointmentDetails.medical_conditions
        : null;
      const medicalToSend = (medicalFromLatest && medicalFromLatest.length > 0)
        ? medicalFromLatest
        : (medicalFromDetails && medicalFromDetails.length > 0)
        ? medicalFromDetails
        : currentMedicalConditions;
      if (Array.isArray(medicalToSend)) {
        payload.medical_conditions = medicalToSend;
      }
      if (latestAppointment?.patient_note !== undefined && latestAppointment?.patient_note !== null) {
        payload.patient_note = latestAppointment.patient_note;
      } else if (appointmentDetails?.patient_note !== undefined && appointmentDetails?.patient_note !== null) {
        payload.patient_note = appointmentDetails.patient_note;
      } else if (currentPatientNote !== undefined) {
        payload.patient_note = currentPatientNote;
      }

      await updateAppointment(appointmentId, payload);
      toast.success('Appointment rescheduled.');
      setIsRescheduleOpen(false);
      onRescheduled?.();
    } catch (error: any) {
      const message = error?.response?.data?.message || 'Failed to reschedule appointment.';
      toast.error(message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const selectedDateObj = rescheduleDate ? new Date(`${rescheduleDate}T00:00:00`) : null;

  const handleDateSelect = async (date: Date) => {
    const nextDate = date.toISOString().split('T')[0];
    setRescheduleDate(nextDate);
    if (doctorId) {
      await loadSlotsForDate(doctorId, nextDate);
    }
  };

  return (
    <>
      <div className="relative inline-block text-left">
        <button
          ref={btnRef}
          onClick={toggle}
          aria-haspopup="true"
          aria-expanded={open}
          className="p-2 text-slate-500 rounded-full hover:bg-slate-100 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-sky-500 transition-colors"
        >
          <IconDotsVertical size={20} />
        </button>

        {open && coords && (
          <div
            ref={menuRef}
            role="menu"
            aria-label="Appointment actions"
            style={{ position: 'fixed', top: coords.top, left: coords.left, width: 224 }}
            className="bg-white rounded-xl shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none z-[9999]"
          >
            <div className="p-2">
              <button
                onClick={openViewModal}
                className="group flex rounded-lg items-center w-full px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-100"
              >
                <IconEye size={18} className="mr-3 text-slate-500 shrink-0" />
                View Appointment
              </button>
              <button
                onClick={openRescheduleModal}
                className="group flex rounded-lg items-center w-full px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-100"
              >
                <IconCalendarTime size={22} className="mr-3 text-slate-500 shrink-0" />
                Reschedule Appointment
              </button>
              <button
                onClick={() => handleAction('WhatsApp')}
                className="group flex rounded-lg items-center w-full px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-100"
              >
                <IconBrandWhatsapp className="w-5 h-5 mr-3 text-green-500" />
                Send Reminder
              </button>
            </div>
            <div className="border-t border-slate-100 p-2">
              <button
                onClick={() => handleAction('Delete')}
                className="group flex rounded-lg items-center w-full px-3 py-2 text-sm font-medium text-rose-600 hover:bg-rose-50"
              >
                <IconTrash className="w-5 h-5 mr-3" />
                Cancel Appointment
              </button>
            </div>
          </div>
        )}
      </div>

      {isCancelConfirmOpen && (
        <div
          className="fixed inset-0 z-[10000] flex items-center justify-center bg-black/40 p-4"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget && !isCancelling) {
              setIsCancelConfirmOpen(false);
            }
          }}
        >
          <div className="w-full max-w-md rounded-2xl bg-white shadow-2xl border border-slate-200">
            <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100">
              <h3 className="text-base font-semibold text-slate-900">Cancel Appointment</h3>
              <button
                type="button"
                onClick={() => setIsCancelConfirmOpen(false)}
                disabled={isCancelling}
                className="text-slate-400 hover:text-slate-600 disabled:opacity-50"
              >
                <IconX size={18} />
              </button>
            </div>
            <div className="px-5 py-4">
              <p className="text-sm text-slate-600">
                Are you sure you want to cancel this appointment?
              </p>
            </div>
            <div className="px-5 py-4 border-t border-slate-100 flex items-center justify-end gap-2">
              <button
                type="button"
                onClick={() => setIsCancelConfirmOpen(false)}
                disabled={isCancelling}
                className="rounded-lg border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50 disabled:opacity-50"
              >
                Keep Appointment
              </button>
              <button
                type="button"
                onClick={confirmCancelAppointment}
                disabled={isCancelling}
                className="rounded-lg bg-rose-600 px-4 py-2 text-sm font-semibold text-white hover:bg-rose-700 disabled:opacity-60"
              >
                {isCancelling ? 'Cancelling...' : 'Cancel Appointment'}
              </button>
            </div>
          </div>
        </div>
      )}

      {isRescheduleOpen && (
        <div
          className="fixed inset-0 z-[10000] flex items-center justify-center bg-black/40 p-4"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget && !isSubmitting) {
              setIsRescheduleOpen(false);
            }
          }}
        >
          <div className="w-full max-w-md rounded-2xl bg-white shadow-2xl border border-slate-200">
            <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100">
              <h3 className="text-base font-semibold text-slate-900">Reschedule Appointment</h3>
              <button
                type="button"
                onClick={() => setIsRescheduleOpen(false)}
                disabled={isSubmitting}
                className="text-slate-400 hover:text-slate-600 disabled:opacity-50"
              >
                <IconX size={18} />
              </button>
            </div>

            <div className="p-5 space-y-4">
              {loadingDoctorInfo ? (
                <p className="text-sm text-slate-500">Loading doctor information...</p>
              ) : (
                <div className="rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-700">
                  <div><span className="font-medium">Doctor:</span> {doctorName || 'Unknown'}</div>
                  <div><span className="font-medium">Slot Duration:</span> {slotDuration} min</div>
                </div>
              )}

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Date</label>
                <DateSelector selectedDate={selectedDateObj} onDateChange={handleDateSelect} />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">Available Slots</label>
                {loadingSlots ? (
                  <p className="text-sm text-slate-500">Loading slots...</p>
                ) : availableSlots.length === 0 ? (
                  <p className="text-sm text-amber-600">No slots available for selected date.</p>
                ) : (
                  <div className="grid grid-cols-3 gap-2">
                    {availableSlots.map((slot) => {
                      const booked = bookedSlots.includes(slot);
                      const selected = rescheduleTime === slot;
                      return (
                        <button
                          key={slot}
                          type="button"
                          disabled={booked || isSubmitting}
                          onClick={() => setRescheduleTime(slot)}
                          className={`rounded-md border px-2 py-1.5 text-sm transition ${
                            booked
                              ? 'bg-slate-100 text-slate-400 border-slate-200 cursor-not-allowed line-through'
                              : selected
                              ? 'bg-sky-600 text-white border-sky-600'
                              : 'bg-white text-slate-700 border-slate-300 hover:border-sky-400'
                          }`}
                        >
                          {slot}
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>

            <div className="px-5 py-4 border-t border-slate-100 flex items-center justify-end gap-2">
              <button
                type="button"
                onClick={() => setIsRescheduleOpen(false)}
                disabled={isSubmitting}
                className="rounded-lg border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50 disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleReschedule}
                disabled={isSubmitting}
                className="rounded-lg bg-sky-600 px-4 py-2 text-sm font-semibold text-white hover:bg-sky-700 disabled:opacity-60"
              >
                {isSubmitting ? 'Updating...' : 'Update Appointment'}
              </button>
            </div>
          </div>
        </div>
      )}

      {isViewOpen && (
        <div
          className="fixed inset-0 z-[10000] flex items-center justify-center bg-black/40 p-4"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget) {
              setIsViewOpen(false);
            }
          }}
        >
          <div className="w-full max-w-2xl rounded-2xl bg-white shadow-2xl border border-slate-200">
            <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100">
              <h3 className="text-base font-semibold text-slate-900">Appointment Details</h3>
              <button
                type="button"
                onClick={() => setIsViewOpen(false)}
                className="text-slate-400 hover:text-slate-600"
              >
                <IconX size={18} />
              </button>
            </div>

            <div className="p-5 max-h-[70vh] overflow-y-auto">
              {loadingView ? (
                <p className="text-sm text-slate-500">Loading appointment details...</p>
              ) : (
                <div className="space-y-4">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="inline-flex items-center rounded-full bg-slate-100 px-3 py-1 text-xs font-medium text-slate-700">
                      {appointmentDetails?.appointment_type || '-'}
                    </span>
                    <span className="inline-flex items-center rounded-full bg-sky-100 px-3 py-1 text-xs font-medium text-sky-800">
                      {appointmentDetails?.status || '-'}
                    </span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm">
                    <div className="rounded-lg border border-slate-200 p-3">
                      <p className="text-xs text-slate-500">Patient</p>
                      <p className="font-medium text-slate-900">{appointmentDetails?.full_name || '-'}</p>
                    </div>
                    <div className="rounded-lg border border-slate-200 p-3">
                      <p className="text-xs text-slate-500">Contact</p>
                      <p className="font-medium text-slate-900">{appointmentDetails?.contact_number || '-'}</p>
                    </div>
                    <div className="rounded-lg border border-slate-200 p-3">
                      <p className="text-xs text-slate-500">Doctor</p>
                      <p className="font-medium text-slate-900">{appointmentDetails?.doctor_name || appointmentDetails?.doctor_id || '-'}</p>
                    </div>
                    <div className="rounded-lg border border-slate-200 p-3">
                      <p className="text-xs text-slate-500">Clinic ID</p>
                      <p className="font-medium text-slate-900">{appointmentDetails?.clinic_id || '-'}</p>
                    </div>
                    <div className="rounded-lg border border-slate-200 p-3">
                      <p className="text-xs text-slate-500">Date</p>
                      <p className="font-medium text-slate-900">{appointmentDetails?.appointment_date || '-'}</p>
                    </div>
                    <div className="rounded-lg border border-slate-200 p-3">
                      <p className="text-xs text-slate-500">Time</p>
                      <p className="font-medium text-slate-900">{appointmentDetails?.appointment_time || '-'}</p>
                    </div>
                    <div className="rounded-lg border border-slate-200 p-3">
                      <p className="text-xs text-slate-500">UID</p>
                      <p className="font-medium text-slate-900 break-all">{appointmentDetails?.appointment_uid || '-'}</p>
                    </div>
                    <div className="rounded-lg border border-slate-200 p-3">
                      <p className="text-xs text-slate-500">File Number</p>
                      <p className="font-medium text-slate-900">{appointmentDetails?.file_number || '-'}</p>
                    </div>
                  </div>

                  <div className="rounded-lg border border-slate-200 p-3 text-sm">
                    <p className="text-xs text-slate-500 mb-1">Notes</p>
                    <p className="text-slate-800">{appointmentDetails?.notes || '-'}</p>
                  </div>

                  <div className="rounded-lg border border-slate-200 p-3 text-sm">
                    <p className="text-xs text-slate-500 mb-1">Patient Note</p>
                    <p className="text-slate-800">{appointmentDetails?.patient_note || '-'}</p>
                  </div>

                  <div className="rounded-lg border border-slate-200 p-3 text-sm">
                    <p className="text-xs text-slate-500 mb-2">Medical Conditions</p>
                    {Array.isArray(appointmentDetails?.medical_conditions) && appointmentDetails.medical_conditions.length > 0 ? (
                      <div className="flex flex-wrap gap-2">
                        {appointmentDetails.medical_conditions.map((condition: string) => (
                          <span key={condition} className="inline-flex items-center rounded-md bg-slate-100 px-2 py-1 text-xs text-slate-700">
                            {condition}
                          </span>
                        ))}
                      </div>
                    ) : (
                      <p className="text-slate-800">-</p>
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
}
