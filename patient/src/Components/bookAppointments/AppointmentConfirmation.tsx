import React from 'react'
import type { Clinic } from './types'
import { toast } from 'react-toastify';
import useBookAppointment from '@/hooks/useBookAppointment';
import { useProfile } from '@/hooks/useProfile';
import formatTime from '@/services/formatTime';

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

    const formattedDate = selectedDate.toLocaleDateString("en-US", {
        weekday: "short",
        month: "short",
        day: "2-digit",
        year: "numeric",
    });

    const formattedTime = formatTime(selectedTime)

    const handleBookAppointment = async () => {
        if (isBooking) return;
        if (!profile) {
            toast.error("Profile is not loaded properly. Please refresh the page.");
            return;
        }

        if (!profile?.full_name || !profile?.contact_number) {
            toast.error("Some important profile details are missing. Please update your profile to continue.");
            return;
        }

        const response = await bookAppointment({
            patient_id: profile?.id,
            full_name: profile?.full_name,
            uhid: profile?.uhid,
            contact_number: profile?.contact_number,
            clinic_id: selectedClinic?.id,
            doctor_id: selectedClinic?.doctor_id,
            appointment_date: selectedDate,
            appointment_time: selectedTime,
            patient_note: patientNote?.trim().length > 0 ? patientNote?.trim() : null,
        })

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
                                <p className='font-semibold'>{selectedClinic?.name}</p>
                                <p className='text-xs text-zinc-500'>{selectedClinic?.address}</p>
                                <p className='text-xs text-zinc-500'>
                                    {
                                        [selectedClinic?.city, selectedClinic?.State, selectedClinic?.pincode]
                                            .filter(Boolean)
                                            .join(", ")
                                    }
                                </p>
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

                {/* Confirm Button */}
                <div className='flex justify-center mt-4'>
                    <button onClick={handleBookAppointment} className={`${isBooking ? "bg-zinc-400 cursor-not-allowed" : "bg-sky-600 hover:bg-sky-800 cursor-pointer"} text-white w-full py-2 rounded-sm`}>{isBooking ? "Please wait..." : "Confirm"}</button>
                </div>
            </div>

        </div>
    )
}

export default AppointmentConfirmation