import React, { useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Popover, PopoverContent, PopoverTrigger } from '../ui/popover'
import CustomModal from '../CustomModal'
import RescheduleModal from './RescheduleModal'
import CancelModal from './CancelModal'
import type { Appointment } from './types'
import formatTime from '@/services/formatTime'


type AppointmentCardProps = {
    appointment: Appointment
    appointmentType: string
    className?: string
    onRefetch?: () => void
}



const AppointmentCard: React.FC<AppointmentCardProps> = ({ appointment, appointmentType, className, onRefetch }) => {
    const [openModal, setOpenModal] = useState(false)
    const [currentModal, setCurrentModal] = useState<"reschedule" | "cancel" | null>(null)
    const navigate = useNavigate()

    const formattedDate = useMemo(() => {
        if (!appointment?.appointment_date) return { day: "", month: "", year: "" }

        const date = new Date(appointment.appointment_date)

        return {
            day: date.toLocaleString("en-US", { day: "2-digit" }),
            month: date.toLocaleString("en-US", { month: "short" }),
            year: date.getFullYear()
        }
    }, [appointment?.appointment_date])

    const formattedTime = useMemo(() => formatTime(appointment?.appointment_time), [appointment?.appointment_time]);

    const formattedClinicAddress = useMemo(() => {
        const address = appointment?.clinics?.address || appointment?.clinics?.address;
        
        if (!address) return 'N/A';
        
        if (typeof address === 'object' && address !== null) {
            const street = (address as any).street || '';
            const city = (address as any).city || '';
            const state = (address as any).state || '';
            const postalCode = (address as any).postal_code || '';
            
            return [street, city, state, postalCode].filter(Boolean).join(', ');
        }
        
        return String(address);
    }, [appointment?.clinics?.address]);

    return (
        <div className={`flex items-center border border-gray-300 bg-white ${appointmentType === "missed" ? "opacity-65" : ""} rounded-sm py-4 px-4 relative ${className}`}>
            <div className='flex md:items-center flex-col md:flex-row justify-between flex-1'>

                <div className='flex md:items-center flex-col md:flex-row w-full '>
                    <div className='border-b w-full md:border-none md:pb-0 md:w-fit pb-5 flex items-start md:items-center'>

                        <div className='flex flex-col items-center md:border-r md:pr-5 self-start'>
                            <div className='text-sm text-zinc-500'>{formattedDate?.month}</div>
                            <div className='text-3xl font-[600] text-cyan-800'>{formattedDate?.day}</div>
                            <div className='text-sm text-zinc-500'>{formattedDate?.year}</div>
                        </div>
                    </div>
                    <div className='md:px-5 py-5 w-full md:py-0'>

                        <div className='grid grid-cols-1 md:grid-cols-2 md:auto-rows-fr gap-x-5 lg:gap-x-6 gap-y-4 w-full '>
                            <div className='flex items-center gap-2'>
                                <span className="material-symbols-sharp text-[16px] text-zinc-400">schedule</span>
                                <p className='text-[13px] text-zinc-600 text-ellipsis whitespace-nowrap overflow-x-hidden'>{formattedTime}</p>
                            </div>
                            <div className='flex items-center gap-2'>
                                <span className="material-symbols-sharp text-[18px] text-zinc-400">home_health</span>
                                <p className='text-[13px] text-zinc-600 text-ellipsis whitespace-nowrap overflow-x-hidden'>{appointment?.clinics?.name}</p>
                            </div>
                            <div className='flex items-center gap-2'>
                                <span className="material-symbols-sharp text-[17px] text-zinc-400">location_on</span>
                                <p className='text-[13px] text-zinc-600 line-clamp-2 text-ellipsis'>
                                    {formattedClinicAddress}
                                </p>
                            </div>
                            <div className='flex items-center gap-2'>
                                <span className="material-symbols-sharp text-[16px] text-zinc-400">stethoscope</span>
                                <p className='text-[13px] text-zinc-600 text-ellipsis whitespace-nowrap overflow-x-hidden'>{appointment?.clinics?.admin_staff_name}</p>
                            </div>
                        </div>
                    </div>
                    {/* {appointmentType === "upcoming" && (
                        <div className="hidden md:flex items-center ml-3">
                            <button onClick={() => { setCurrentModal("cancel"); setOpenModal(true) }} className="text-sm text-red-600 hover:text-red-800 px-3 py-1 border border-red-100 rounded-md">Cancel</button>
                        </div>
                    )} */}

                    <Popover>

                        <PopoverTrigger className={`absolute right-4 md:relative md:right-0  hover:bg-zinc-600/10 cursor-pointer flex items-center justify-center h-12 w-10 rounded-sm`}>
                            <span className="material-symbols-sharp">more_vert</span>
                        </PopoverTrigger>
                        <PopoverContent className='w-fit min-w-[220px] p-1.5 mr-4'>
                            <div className='flex flex-col'>

                                <div className='flex items-center gap-3 rounded-sm p-1.5 cursor-pointer text-zinc-500 hover:bg-zinc-100 hover:text-zinc-900'>
                                    <span className="material-symbols-sharp text-[16px]">info</span>
                                    <p className='text-[13px]'>View Details</p>
                                </div>
                                {
                                    appointmentType === "missed" && (
                                        <div
                                            onClick={() => {
                                                const appt: any = appointment as any
                                                const clinicId = appt?.clinic_id || appt?.clinics?.clinic_id || appt?.clinics?._id || appt?.clinics?.id || ''
                                                if (clinicId) navigate(`/book-appointment/${clinicId}`, { state: { fromAppointment: appt } })
                                            }}
                                            className='flex items-center gap-3 rounded-sm p-1.5 cursor-pointer text-zinc-500 hover:bg-zinc-100 hover:text-zinc-900'
                                        >
                                            <span className="material-symbols-sharp text-[16px]">calendar_add_on</span>
                                            <p className='text-[13px]'>Book Again</p>
                                        </div>
                                    )
                                }
                                {
                                    appointmentType === "upcoming" && (
                                        <>
                                            <div onClick={() => { setCurrentModal("reschedule"); setOpenModal(true) }} className='flex items-center gap-3 rounded-sm p-1.5 cursor-pointer text-zinc-500 hover:bg-zinc-100 hover:text-zinc-900'>
                                                <span className="material-symbols-sharp text-[16px]">edit_calendar</span>
                                                <p className='text-[13px]'>Reschedule Appointment</p>
                                            </div>
                                            <div onClick={() => { setCurrentModal("cancel"); setOpenModal(true) }} className='flex items-center gap-3 rounded-sm p-1.5 cursor-pointer text-red-500 hover:bg-red-50 hover:text-red-700'>
                                                <span className="material-symbols-sharp text-[16px] ">cancel</span>
                                                <p className='text-[13px] '>Cancel Appointment</p>
                                            </div>
                                        </>
                                    )
                                }

                            </div>
                        </PopoverContent>
                    </Popover>
                </div>

            </div>

                <CustomModal openModal={openModal} setOpenModal={setOpenModal}>
                {currentModal === "reschedule" && <RescheduleModal setOpenModal={setOpenModal} appointment={appointment} onSuccess={onRefetch} />}
                {currentModal === "cancel" && <CancelModal setOpenModal={setOpenModal} appointment={appointment} onSuccess={onRefetch} />}
            </CustomModal>
        </div>
    )
}

export default AppointmentCard