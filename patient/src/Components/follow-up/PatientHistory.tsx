// components/follow-up/PatientHistory.tsx
import React from 'react';
import { format } from 'date-fns';
import type { Doctor } from './types';

// --- COMPONENT PROPS ---
// ... (Interface for PatientHistoryProps remains the same)
interface PatientHistoryProps {
    doctor: Doctor | null;
}

// --- MAIN COMPONENT (Updated UI) ---
const PatientHistory: React.FC<PatientHistoryProps> = ({ doctor }) => {
    return (
        <div className="bg-white p-4 flex rounded-sm border border-gray-300 h-full">
            {doctor ? (
                <div className='flex-1 flex flex-col justify-between relative'>
                    <h2 className="text-[18px] font-semibold text-cyan-800 mb-5">
                        Your History with Dr. {doctor.name.split(' ').slice(1).join(' ')}
                    </h2>
                    <div className="space-y-6 absolute top-1/2 -translate-y-1/2 w-full">
                        {/* Date of Last Visit */}
                        <div>
                            <p className="text-xs text-slate-400 uppercase tracking-wider">Date of Last Visit</p>
                            <div className="flex items-center gap-2 mt-2 text-slate-600">
                                <span className="material-symbols-sharp text-base text-cyan-800">calendar_today</span>
                                <p className="text-[15px]">{format(doctor.lastVisit.date, 'EEEE, dd MMMM yyyy')}</p>
                            </div>
                        </div>
                        
                        {/* Treatment Performed */}
                        <div>
                            <p className="text-xs text-slate-400 uppercase tracking-wider">Treatment Performed</p>
                            <div className="flex items-start gap-2 mt-2 text-slate-600">
                                <span className="material-symbols-sharp text-base text-cyan-800">stethoscope</span>
                                <p className="text-[15px]">{doctor.lastVisit.treatment}</p>
                            </div>
                        </div>
                        
                        {/* Patient-Friendly Summary */}
                        <div>
                             <p className="text-xs text-slate-400 uppercase tracking-wider">Patient-Friendly Summary</p>
                            <div className="pl-4 border-l-4 border-cyan-800 mt-2">
                                <p className="text-sm text-slate-600 italic">"{doctor.lastVisit.summary}"</p>
                            </div>
                        </div>
                        
                        {/* Link to Full Details */}
                        
                    </div>
                    <div>
                            <a href={doctor.lastVisit.fullDetailsLink} className="inline-flex items-center text-xs font-medium text-cyan-700 hover:underline">
                                View full visit details
                            </a>
                        </div>
                </div>
            ) : (
                // Placeholder when no doctor is selected
                <div className="h-full w-full flex flex-col items-center justify-center bg-gray-50 rounded-sm">
                    <span className="material-symbols-outlined text-[60px] text-gray-300 mb-4">overview</span>
                    <h3 className="font-semibold text-slate-600">Patient History</h3>
                    <p className="text-slate-400 text-xs text-center">Select a doctor to view your past visit details</p>
                </div>
            )}
        </div>
    );
};

export default PatientHistory;