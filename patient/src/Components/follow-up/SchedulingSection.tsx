import React, { useState } from 'react';
import { format } from 'date-fns';
import CalenderProvider from '@/contexts/Calender';
import Datepicker from '@/Components/DatePicker';
import { useCalender } from '@/hooks/useCalender';

// --- TYPE DEFINITIONS ---
interface Doctor {
  id: number;
  name: string;
  specialty: string;
  clinicId: string;
}

interface Clinic {
  id: string;
  name: string;
}

// --- ENHANCED SLOT LIST (RESPONSIVE) ---
const EnhancedSlotList: React.FC<{ onTimeSelect: (time: string | null) => void }> = ({ onTimeSelect }) => {
    const { pickedDate } = useCalender();
    const [selectedTimeSlot, setSelectedTimeSlot] = useState<string | null>(null);

    const timeSlots = ['10:00 AM', '10:30 AM', '11:00 AM', '11:30 AM', '03:00 PM', '03:30 PM', '04:00 PM', '04:30 PM'];

    const handleTimeSelect = (slot: string) => {
        const newTime = slot === selectedTimeSlot ? null : slot;
        setSelectedTimeSlot(newTime);
        onTimeSelect(newTime);
    };

    if (!pickedDate) {
        return (
            <div className="flex flex-col items-center justify-center gap-1  w-full">
                <span className="material-symbols-outlined text-[50px] text-gray-300">schedule</span>
                <p className="text-sm text-gray-300">Please select a date to see available time slots</p>
            </div>
        );
    }

    return (
        <div className='w-full'>
            <div className="mb-4 p-3 bg-blue-50 rounded-sm border-l-4 border-cyan-700">
                <p className="text-sm font-[500] text-slate-700">Available slots for {format(pickedDate, 'EEEE, MMM d')}</p>
            </div>
            {/* Responsive grid for time slots */}
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2 max-h-64 overflow-y-auto">
                {timeSlots.map((slot) => (
                    <button
                        key={slot}
                        onClick={() => handleTimeSelect(slot)}
                        className={`p-2 text-xs sm:text-sm rounded-sm border flex items-center justify-center ${
                            selectedTimeSlot === slot
                            ? 'bg-cyan-600 text-white border-sky-600'
                            : 'bg-white text-slate-700 border-slate-200 hover:border-cyan-600 hover:bg-sky-50'
                        }`}
                    >
                        {selectedTimeSlot === slot}
                        {slot}
                    </button>
                ))}
            </div>
            {/* {selectedTimeSlot && (
                <div className="mt-4 p-3 bg-green-50 rounded-lg border border-green-200">
                    <p className="text-sm text-green-800 font-medium">✓ Selected: {format(pickedDate, 'MMM d')} at {selectedTimeSlot}</p>
                </div>
            )} */}
        </div>
    );
};

// --- APPOINTMENT SUMMARY (RESPONSIVE) ---
const AppointmentSummary: React.FC<{ 
    selectedDoctor: Doctor | null;
    selectedClinic: Clinic | null;
    selectedTimeSlot: string | null;
}> = ({ selectedDoctor, selectedClinic, selectedTimeSlot }) => {
    const { pickedDate } = useCalender();

    if (!pickedDate || !selectedTimeSlot || !selectedDoctor || !selectedClinic) {
        return null;
    }

    return (
        <div className="mt-6 p-3 rounded-sm border bg-blue-50 border-cyan-800">
            <h3 className="font-bold text-slate-800 mb-4 flex items-center">
                Appointment Summary
            </h3>
            {/* Responsive grid for summary details */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-3 text-sm">
                <div className="flex items-center gap-1.5">
                    <span className="material-symbols-outlined text-slate-900 text-[20px]">person</span>
                    <span className="font-medium text-slate-900">{selectedDoctor.name}</span>
                </div>
                <div className="flex items-center gap-1.5">
                    <span className="material-symbols-outlined text-gray-500 text-[20px]">Stethoscope</span>
                    <span className="text-slate-700">{selectedDoctor.specialty}</span>
                </div>
                <div className="flex items-center gap-1.5">
                    <span className="material-symbols-outlined text-gray-500 text-[20px]">home_health</span>
                    <span className="truncate text-slate-700">{selectedClinic.name}</span>
                </div>
                <div className="flex items-center gap-1.5">
                    <span className="material-symbols-outlined text-gray-500 text-[20px]">date_range</span>
                    <span className="text-slate-700">{format(pickedDate, 'EEEE, MMM d, yyyy')}</span>
                </div>
                <div className="flex items-center gap-2 sm:col-span-2 mt-2 pt-2 border-t border-gray-300">
                    <span className="material-symbols-sharp text-cyan-800 text-[23px]">schedule</span>
                    <span className="font-semibold text-lg text-cyan-800">{selectedTimeSlot}</span>
                </div>
            </div>
        </div>
    );
};


// --- MAIN COMPONENT PROPS ---
interface SchedulingSectionProps {
    selectedDoctor: Doctor;
    selectedClinic: Clinic;
    selectedTimeSlot: string | null;
    onTimeSelect: (time: string | null) => void;
}

// --- MAIN SCHEDULING COMPONENT (RESPONSIVE) ---
const SchedulingSection: React.FC<SchedulingSectionProps> = ({ 
    selectedDoctor, 
    selectedClinic,
    selectedTimeSlot,
    onTimeSelect 
}) => {
    return (
        <CalenderProvider dentistId={selectedDoctor.id.toString()} clinicId={selectedDoctor.clinicId}>
            <div className="bg-white p-4 rounded-sm border border-gray-300">
                <h2 className="text-[18px] font-semibold flex items-center gap-2 mb-4 text-cyan-800">
                    <span className="material-symbols-sharp">calendar_month</span>
                    Schedule Your Appointment
                </h2>
                {/* Main responsive grid: 1 col on mobile, 2 cols on large screens */}
                <div className="grid grid-cols-1 lg:grid-cols-1 gap-4">
                    <div>
                        <h3 className="font-semibold text-sm text-slate-700 mb-1">Select a Date</h3>
                        <div className="p-2 text-sm border border-slate-200 rounded-sm bg-slate-50">
                            <Datepicker />
                        </div>
                    </div>
                    <div>
                        <h3 className="font-semibold text-sm text-slate-700 mb-1">Select a Time</h3>
                        <div className="p-2 border border-slate-200 rounded-sm bg-slate-50 min-h-[150px] flex">
                            <EnhancedSlotList onTimeSelect={onTimeSelect} />
                        </div>
                    </div>
                </div>
                <AppointmentSummary 
                    selectedDoctor={selectedDoctor}
                    selectedClinic={selectedClinic}
                    selectedTimeSlot={selectedTimeSlot}
                />
            </div>
        </CalenderProvider>
    );
};

export default SchedulingSection;