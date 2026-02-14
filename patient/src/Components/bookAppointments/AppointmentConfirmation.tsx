import React from 'react'
import type { Clinic } from './types'
import { toast } from 'react-toastify';
import useBookAppointment from '@/hooks/useBookAppointment';
import { useProfile } from '@/hooks/useProfile';
import useGetAppointments from '@/hooks/useGetAppointments';
import formatTime from '@/services/formatTime';
import { getISTDate } from '@/lib/istDateUtils';
import { api } from '@/lib/apiClient';

interface AppointmentSummaryProps {
    selectedClinic: Clinic;
    selectedDate: Date;
    selectedTime: string;
    patientNote: string;
    setOpenAppointmentDateTime: React.Dispatch<React.SetStateAction<boolean>>;
    setOpenAppointmentConfirmation: React.Dispatch<React.SetStateAction<boolean>>;
}

const AppointmentConfirmation: React.FC<AppointmentSummaryProps> = ({ selectedClinic, selectedDate, selectedTime, patientNote, setOpenAppointmentDateTime, setOpenAppointmentConfirmation }) => {
    const { bookAppointment, loading: isBooking } = useBookAppointment();
    const { profile } = useProfile();
    const { appointments } = useGetAppointments();


    // Get IST date for both display and API
    const { display: formattedDate, api: appointmentDateForAPI } = getISTDate(selectedDate);
    const formattedTime = formatTime(selectedTime);

    // Get doctor_id - use doctor_id first, fallback to admin_staff
    const getDoctorId = () => {
        return selectedClinic?.doctor_id || selectedClinic?.admin_staff;
    };

    const [quotaLimit, setQuotaLimit] = React.useState<number>(0);
    const [usedAppointments, setUsedAppointments] = React.useState<number>(0);
    const [quotaLoading, setQuotaLoading] = React.useState<boolean>(false);

    const clinicIdentifier = selectedClinic?.clinic_id || selectedClinic?.id || selectedClinic?._id;

    const fetchQuota = React.useCallback(async () => {
        if (!clinicIdentifier) return;
        setQuotaLoading(true);
        const now = new Date();
        const monthStart = new Date(now.getFullYear(), now.getMonth(), 1).toISOString().split('T')[0];
        const monthEnd = new Date(now.getFullYear(), now.getMonth() + 1, 0).toISOString().split('T')[0];

        try {
            const [subResp, appointmentsResp] = await Promise.all([
                api.get(`/api/clinic-subscriptions/active`, { params: { clinic_id: clinicIdentifier } }),
                api.get(`/api/appointments/clinic/${clinicIdentifier}`, {
                    params: { startDate: monthStart, endDate: monthEnd }
                }),
            ]);

            let limit = 0;
            if (subResp.success && subResp.data) {
                limit = subResp.data?.data?.limits_snapshot?.max_appointments || 0;
            }

            let appointments: any[] = [];
            if (appointmentsResp.success && appointmentsResp.data) {
                appointments = appointmentsResp.data?.data || [];
            }
            const filtered = appointments.filter((apt: any) =>
              ['scheduled', 'confirmed', 'completed'].includes(apt?.status)
            );

            setQuotaLimit(limit);
            setUsedAppointments(filtered.length);
        } catch (err) {
            console.error("Failed to load subscription quota", err);
        } finally {
            setQuotaLoading(false);
        }
    }, [clinicIdentifier]);

    React.useEffect(() => {
        void fetchQuota();
    }, [fetchQuota]);

    const quotaReached = quotaLimit > 0 && usedAppointments >= quotaLimit;

    const handleBookAppointment = async () => {
        if (isBooking) return;
        if (!profile) {
            toast.error("Profile is not loaded properly. Please refresh the page.");
            return;
        }

        if (quotaReached) {
            toast.error("Clinic has reached its appointment quota for this month. Please try later or contact the clinic.");
            return;
        }

        if (!profile?.full_name || !profile?.contact_number) {
            toast.error("Some important profile details are missing. Please update your profile to continue.");
            return;
        }

        // Use consistent IST date for comparison
        const { api: dateForComparison } = getISTDate(selectedDate);

        // Check if patient already has an appointment on this date
        const allAppointments = [
            ...appointments.upcoming,
            ...appointments.previous,
            ...appointments.missed
        ];

        const existingAppointmentOnDate = allAppointments.some(
            apt => apt?.appointment_date === dateForComparison && 
                   apt?.status !== 'cancelled' &&
                   apt?.status !== 'completed'
        );

        if (existingAppointmentOnDate) {
            toast.error("You already have an appointment scheduled for this date. Please cancel it first or choose a different date.");
            return;
        }

        // Validate clinic and doctor data
        // Ensure we have a clinic identifier (accept clinic_id, id or _id)
        if (!clinicIdentifier) {
            toast.error("Clinic ID is missing. Please select a clinic again.");
            console.error('Missing clinic identifier in selectedClinic:', selectedClinic);
            return;
        }

        const doctorId = getDoctorId();
        if (!doctorId) {
            toast.error("Doctor/Staff ID is missing. Please select a clinic with a doctor assigned.");
            console.error('Missing doctor_id and admin_staff in selectedClinic:', selectedClinic);
            return;
        }

        // Get patient_id from localStorage (set during login/signup)
        const patientId = localStorage.getItem('patient_id');
        if (!patientId) {
            toast.error("Patient ID is missing. Please log in again.");
            return;
        }
  

        const appointmentPayload = {
            patient_id: patientId,
            full_name: profile?.full_name,
            uhid: profile?.uhid || null,
            contact_number: profile?.contact_number || null,
            clinic_id: selectedClinic.clinic_id || selectedClinic.id || selectedClinic._id || clinicIdentifier,
            doctor_id: doctorId,
            // Pass doctor name from modal to backend so server doesn't need to lookup profile
            doctor_name: selectedClinic?.contact_name || selectedClinic?.doctor_name || null,
            appointment_date: appointmentDateForAPI,
            appointment_time: selectedTime,
            patient_note: patientNote?.trim().length > 0 ? patientNote?.trim() : null,
            clinics: {
                id: selectedClinic._id || selectedClinic.id || clinicIdentifier,
                name: selectedClinic.name,
                contact_number: selectedClinic.phone,
                address: selectedClinic.address,
                location: selectedClinic.location,
                admin_staff_name: selectedClinic.admin_staff_name
            },
        };
        const response = await bookAppointment(appointmentPayload);

        if (!response.success) {
            toast.error(response.error || "Something went wrong")
            return;
        }

        setOpenAppointmentConfirmation(false);
        setOpenAppointmentDateTime(false);
        toast.success(response.message || "Your appointment has been successfully booked!");


    }

    return (
        <div className='w-[500px] max-w-full p-3 flex flex-col gap-4'>

            <h2 className='font-semibold text-lg'>Appointment Summary</h2>

            <div className='flex flex-col gap-1'>

                <div className='flex items-center gap-2 bg-sky-50 p-2 py-3 border-l-8 border-sky-600'>
                    <div className='grid place-items-center'><span className="material-symbols-outlined text-[19px] text-sky-600">info</span></div>
                    <p className='text-[12px] text-zinc-500'>Please check all your details and request are correct. Once you are happy, click confirm.</p>
                </div>

                <div>
                    {/* Date and Time */}
                    <div className='flex items-center gap-3 border-b-2 border-slate-100 py-3'>
                        <div className='p-2 '>
                            <span className="material-symbols-sharp text-[30px] text-sky-800">calendar_clock</span>
                        </div>
                        <div className='flex flex-col gap-1 text-sm'>
                            <h4 className='font-semibold text-[15px]'>Date & Time</h4>
                            <div className='text-zinc-700'>
                                <p>{formattedDate}</p>
                                <p>{formattedTime}</p>
                            </div>
                        </div>
                    </div>

                    {/* Clinic Information */}
                    <div className='flex items-center gap-3 border-b-2 border-slate-100 py-3'>
                        <div className='p-2 '>
                            <span className="material-symbols-sharp text-[30px] text-sky-800">home_health</span>
                        </div>
                        <div className='flex flex-col text-sm gap-1'>
                            <h4 className='font-semibold text-[15px]'>Clinic Information</h4>
                            <div className='text-zinc-700'>
                                        <p className='font-semibold'>
                                            {selectedClinic?.name}
                                            {" "}
                                            <span className='text-sm text-zinc-500'>
                                                ({selectedClinic?.contact_name || selectedClinic?.doctor_name || 'N/A'})
                                            </span>
                                        </p>
                                {typeof selectedClinic?.address === 'object' && selectedClinic?.address ? (
                                    <>
                                        <p className='text-xs text-zinc-500'>{(selectedClinic.address as any).street}</p>
                                        <p className='text-xs text-zinc-500'>
                                            {[(selectedClinic.address as any).city, (selectedClinic.address as any).state, (selectedClinic.address as any).postal_code]
                                                .filter(Boolean)
                                                .join(", ")}
                                        </p>
                                    </>
                                ) : (
                                    <>
                                        <p className='text-xs text-zinc-500'>{typeof selectedClinic?.address === 'string' ? selectedClinic.address : 'N/A'}</p>
                                        <p className='text-xs text-zinc-500'>
                                            {[selectedClinic?.city, selectedClinic?.State, selectedClinic?.pincode]
                                                .filter(Boolean)
                                                .join(", ")}
                                        </p>
                                    </>
                                )}
                            </div>
                        </div>
                    </div>

                    {/* Doctor Details */}
                    <div className='flex items-center border-b-2 border-slate-100 gap-3 py-3'>
                        <div className='p-2 '>
                            <span className="material-symbols-sharp text-[30px] text-sky-800">stethoscope</span>
                        </div>
                        <div className='flex flex-col text-sm gap-1'>
                            <h4 className='font-semibold text-[15px]'>Consulting Doctor</h4>
                            <div className='text-zinc-700'>
                                <p className='font-semibold'>{selectedClinic?.contact_name}</p>
                                <p className='text-xs text-zinc-500'>General Dentist</p>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Patient Notes */}
                <div className='flex items-center gap-3 py-3'>
                    <div className='p-2 '>
                        <span className="material-symbols-sharp text-[30px] text-sky-800">clinical_notes</span>
                    </div>
                    <div className='flex flex-col gap-1.5 text-sm'>
                        <h4 className='font-semibold text-[15px]'>Notes</h4>
                        <p className='text-xs text-zinc-500'>
                            {
                                patientNote.trim().length > 0 ? (
                                    <span className='italic'>"{patientNote}"</span>
                                ) : (
                                    <p>No additional notes provided for this appointment.</p>
                                )
                            }
                            
                        </p>
                    </div>
                </div>

                <div className='flex flex-col gap-2 mt-4'>
                    <div className='text-xs text-slate-500'>
                        {quotaLoading
                            ? "Checking subscription quota..."
                            : quotaLimit > 0
                                ? `Appointments this month: ${usedAppointments}/${quotaLimit}`
                                : "No monthly quota for this clinic."}
                    </div>
                    <button
                        onClick={handleBookAppointment}
                        disabled={isBooking || quotaReached}
                        className={`${isBooking || quotaReached ? "bg-zinc-400 cursor-not-allowed" : "bg-sky-600 hover:bg-sky-800"} text-white w-full py-2 rounded-sm`}
                    >
                        {isBooking ? "Please wait..." : quotaReached ? "Monthly limit reached" : "Confirm"}
                    </button>
                </div>
            </div>

        </div>
    )
}

export default AppointmentConfirmation
