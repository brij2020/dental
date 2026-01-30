import React, { useEffect, useState } from "react";
import { getDoctorProfile } from "@/lib/apiClient";
import type { Clinic, Slots } from "@/Components/bookAppointments/types";
import DateSelector from "../DateSelector";
import CustomModal from "../CustomModal";
import AppointmentConfirmation from "./AppointmentConfirmation";
import Loading from "../Loading";

interface ConfirmAppointmentProps {
    clinic: Clinic;
    setOpenAppointmentDateTime: React.Dispatch<React.SetStateAction<boolean>>;
}

interface SlotGridProps {
    selectedTime: string;
    setSelectedTime: React.Dispatch<React.SetStateAction<string>>;
    slots: string[];
    label: string;
    icon: string;
    errorMessage: string;
    isDisabled?: boolean;
    leaveReason?: string;
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

// Local helper to check doctor's leave status for a date (YYYY-MM-DD)
function checkDoctorLeaveStatusLocal(doctor: DoctorProfile | null, dateStr: string): { isOnLeave: boolean; leaveReason?: string } {
    if (!doctor) return { isOnLeave: false };
    const leaveArr = (doctor as any).leave;
    if (!leaveArr || !Array.isArray(leaveArr)) return { isOnLeave: false };

    for (let i = 0; i < leaveArr.length; i++) {
        const leaveRecord = leaveArr[i];
        if (leaveRecord.is_active === false) continue;

        // Single day leave
        if (leaveRecord.date && leaveRecord.date === dateStr) {
            return { isOnLeave: true, leaveReason: leaveRecord.reason || `On leave on ${leaveRecord.day || dateStr}` };
        }

        // Range leave
        if (leaveRecord.leave_start_date && leaveRecord.leave_end_date) {
            if (dateStr >= leaveRecord.leave_start_date && dateStr <= leaveRecord.leave_end_date) {
                return { isOnLeave: true, leaveReason: leaveRecord.reason || `On leave from ${leaveRecord.leave_start_date} to ${leaveRecord.leave_end_date}` };
            }
        }
    }

    return { isOnLeave: false };
}

const SlotGrid: React.FC<SlotGridProps> = ({ selectedTime, setSelectedTime, slots, label, icon, errorMessage, isDisabled, leaveReason }) => {
    return (
        <div className="flex flex-col gap-1.5">
            <h4 className="text-sm text-zinc-500">{label}:</h4>
            {
                isDisabled ? (
                    <p className="flex items-center gap-1.5 text-[12px] bg-red-50 border border-red-100 rounded-sm py-3 text-red-600 justify-center">
                        <span className="material-symbols-sharp text-base">{icon}</span>
                        Doctor is on leave{leaveReason ? ` – ${leaveReason}` : ""}
                    </p>
                ) : (
                    slots?.length === 0 ? (
                        <p className="flex items-center text-[11px] bg-zinc-50 rounded-sm py-4 text-zinc-400 gap-1 justify-center"><span className="material-symbols-sharp text-base">{icon}</span>{errorMessage}</p>
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
                )
            }
        </div>
    );
}

const AppointmentDateTime: React.FC<ConfirmAppointmentProps> = ({ clinic, setOpenAppointmentDateTime }) => {
    const [selectedDate, setSelectedDate] = useState<Date | null>(new Date());
    const [availableSlots, setAvailableSlots] = useState<Slots | null>(null);
    const [selectedTime, setSelectedTime] = useState<string | null>(null);
    const [patientNote, setPatientNote] = useState<string | null>("");
    const [openAppointmentConfirmation, setOpenAppointmentConfirmation] = useState<boolean>(false);
    const [doctor, setDoctor] = useState<DoctorProfile | null>(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [isDoctorOnLeave, setIsDoctorOnLeave] = useState<boolean>(false);
    const [leaveReason, setLeaveReason] = useState<string | undefined>(undefined);

    // Fetch doctor profile using admin_staff ID from clinic
    useEffect(() => {
        const fetchDoctorProfile = async () => {
            if (!clinic?.admin_staff) {
                setError("No doctor available for this clinic");
                return;
            }

            try {
                setLoading(true);
                setError(null);

                // Fetch doctor profile using centralized API function
                const response = await getDoctorProfile(clinic.admin_staff);

                if (response.success && 'data' in response) {
                    setDoctor(response.data as DoctorProfile);
                } else if (!response.success && 'error' in response) {
                    setError(response.error || "Failed to load doctor profile");
                } else {
                    setError("Failed to load doctor profile");
                }
            } catch (err) {
                const errorMsg = err instanceof Error ? err.message : "Failed to load doctor profile";
                setError(errorMsg);
                console.error("Error fetching doctor profile:", err);
            } finally {
                setLoading(false);
            }
        };

        if (clinic) {
            fetchDoctorProfile();
        }
    }, [clinic]);

    // Generate slots from doctor availability
    useEffect(() => {
        let isMounted = true;
        async function buildSlots() {
            if (!doctor?.availability || !selectedDate) {
                if (isMounted) setAvailableSlots(null);
                setSelectedTime(null);
                setIsDoctorOnLeave(false);
                setLeaveReason(undefined);
                return;
            }

            const dayName = selectedDate.toLocaleDateString("en-US", { weekday: "long" });
            const daySchedule = Array.isArray(doctor.availability)
                ? doctor.availability.find((a: any) => a.day === dayName)
                : doctor.availability[dayName];

            const slots: Slots = { morning: [], evening: [] };

            if (!daySchedule) {
                if (isMounted) {
                    setAvailableSlots(slots);
                    setSelectedTime(null);
                    setIsDoctorOnLeave(false);
                    setLeaveReason(undefined);
                }
                return;
            }

            const step = doctor.slot_duration_minutes || 30;

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

            if (!daySchedule.morning?.is_off && daySchedule.morning?.start && daySchedule.morning?.end) {
                slots.morning.push(
                    ...generateSlotsFromRange(
                        daySchedule.morning.start,
                        daySchedule.morning.end,
                        step
                    )
                );
            }

            if (!daySchedule.evening?.is_off && daySchedule.evening?.start && daySchedule.evening?.end) {
                slots.evening.push(
                    ...generateSlotsFromRange(
                        daySchedule.evening.start,
                        daySchedule.evening.end,
                        step
                    )
                );
            }

            // Filter out past slots for today
            const today = new Date();
            const isToday = selectedDate.toDateString() === today.toDateString();
            const currentMinutes = today.getHours() * 60 + today.getMinutes();

            if (isToday) {
                slots.morning = slots.morning.filter(slot => timeToMinutes(slot) > currentMinutes);
                slots.evening = slots.evening.filter(slot => timeToMinutes(slot) > currentMinutes);
            }

            // ---- FIXED LEAVE STATUS HANDLING ----
            type LeaveStatus = { isOnLeave: boolean; leaveReason?: string };

            let leaveResult: LeaveStatus = { isOnLeave: false };

            try {
                const dateStr = selectedDate.toISOString().slice(0, 10); // YYYY-MM-DD
                leaveResult = checkDoctorLeaveStatusLocal(doctor, dateStr);
            } catch (err) {
                console.error("Error checking doctor leave status:", err);
            }

            if (isMounted) {
                setAvailableSlots(slots);
                setIsDoctorOnLeave(leaveResult.isOnLeave);
                setLeaveReason(leaveResult.leaveReason);
                setSelectedTime(null);
            }
        }

        buildSlots();
        return () => {
            isMounted = false;
        };
    }, [selectedDate, doctor]);


    return (
        <div className="p-3 pb-5 flex flex-col gap-4 w-[800px] max-w-full">

            {/* Loading State */}
            {loading && <Loading size={"200px"} />}

            {/* Error State */}
            {error && (
                <div className="p-3 bg-red-50 border border-red-200 rounded-sm text-red-700 text-sm">
                    {error}
                </div>
            )}

            {/* Doctor Profile Card */}
            {doctor && (
                <div className="flex items-center gap-2.5 p-3 bg-blue-50 rounded-sm border border-blue-200">
                    <div className="flex items-center justify-center">
                        <span className="material-symbols-outlined text-[35px] text-sky-700">person_heart</span>
                    </div>
                    <div className="flex flex-col">
                        <h2 className="font-semibold text-lg">{doctor.full_name || doctor.name}</h2>
                        <p className="text-zinc-500 text-[13px] -mt-1">{clinic?.name}</p>
                        {doctor.specialization && (
                            <p className="text-zinc-400 text-[12px]">
                                {Array.isArray(doctor.specialization) ? doctor.specialization.join(", ") : doctor.specialization}
                            </p>
                        )}
                    </div>
                </div>
            )}

            {/* Date selector */}
            <div>
                <DateSelector selectedDate={selectedDate} onDateChange={setSelectedDate} />
            </div>

            {/* Available time-slots */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 mt-2 ">
                {
                    availableSlots?.morning?.length === 0 && availableSlots?.evening?.length === 0 ? (
                        <div className="col-span-full">
                            <p className="flex items-center text-[11px] rounded-sm py-4 text-zinc-400 gap-1 justify-center"><span className="material-symbols-outlined text-base">info</span>No available time slots for this day. Please choose another date.</p>
                        </div>
                    ) : (
                        <>
                            <SlotGrid selectedTime={selectedTime} setSelectedTime={setSelectedTime} slots={availableSlots?.morning} label="Morning" icon="light_mode" errorMessage="No morning slots available." isDisabled={isDoctorOnLeave} leaveReason={leaveReason} />
                            <SlotGrid selectedTime={selectedTime} setSelectedTime={setSelectedTime} slots={availableSlots?.evening} label="Evening" icon="dark_mode" errorMessage="No evening slots available." isDisabled={isDoctorOnLeave} leaveReason={leaveReason} />
                        </>
                    )
                }



            </div>

            {/* Patient Note */}
            <div className="flex flex-col gap-1 mt-4">
                <label htmlFor="patient_note" className="text-[15px] font-semibold text-zinc-700">Notes (Optional)</label>

                <p id="notesHelp" className="help-text text-[11px] text-gray-500 -mt-1">
                    Please share any symptoms, concerns, or information that would help the doctor prepare for your appointment.
                </p>

                <textarea
                    value={patientNote}
                    onChange={(e) => setPatientNote(e.target.value)}
                    id="patient_note"
                    aria-describedby="notesHelp"
                    className="mt-1.5 text-[12px] border border-gray-400 bg-gray-50 hover:bg-sky-50 rounded-sm py-2 px-2.5 outline-none focus:ring-2 focus:ring-sky-300/40 focus:border-sky-400 transition resize-none"
                    rows={4}
                    maxLength={300}
                />

                <p className="self-end text-xs text-zinc-500">{patientNote.length}/300</p>
            </div>

            {/* Continue button */}
            <div className="flex flex-col items-center mt-1  pt-5 border-t border-zinc-200">
                <button onClick={() => setOpenAppointmentConfirmation(true)} className={`w-[200px] py-2 rounded-sm text-sm ${selectedDate && selectedTime && !isDoctorOnLeave ? "bg-black text-white cursor-pointer hover:bg-zinc-700 " : "bg-zinc-200 text-zinc-400 cursor-not-allowed"}`} disabled={!selectedDate || !selectedTime || isDoctorOnLeave}>Continue</button>
                {isDoctorOnLeave ? (
                    <p className="text-[11px] text-red-600 mt-1">Doctor is on leave{leaveReason ? `: ${leaveReason}` : ''}. Please choose another date or doctor.</p>
                ) : (!selectedDate || !selectedTime) && (
                    <p className="text-[11px] text-zinc-400 mt-1">
                        {!selectedDate ? 'Select a date' :
                            !selectedTime ? 'Select a time-slot' :
                                'Select a date and time to continue'}
                    </p>
                )}
            </div>


            {/* Summary Modal */}
            {
                openAppointmentConfirmation && (
                    <CustomModal openModal={openAppointmentConfirmation} setOpenModal={setOpenAppointmentConfirmation}>
                        <AppointmentConfirmation selectedClinic={clinic} selectedDate={selectedDate} selectedTime={selectedTime} patientNote={patientNote} setOpenAppointmentDateTime={setOpenAppointmentDateTime} setOpenAppointmentConfirmation={setOpenAppointmentConfirmation} />
                    </CustomModal>
                )
            }

        </div >

    );
};

export default AppointmentDateTime;
