// components/follow-up/PatientHistory.tsx
import React, { useEffect } from 'react';
import { format } from 'date-fns';
import { useFetchDoctorHistory } from '@/hooks/useFetchDoctorHistory';

// --- COMPONENT PROPS ---
interface PatientHistoryProps {
    doctor: any; // Accept any doctor type
}

// --- MAIN COMPONENT (Updated UI) ---
const PatientHistory: React.FC<PatientHistoryProps> = ({ doctor }) => {
    const displayName = doctor?.full_name || doctor?.name || 'Doctor';
    const doctorId = doctor?._id || doctor?.id;
    const { history, loading, error, fetchDoctorHistory } = useFetchDoctorHistory();

    // Fetch history when doctor changes
    useEffect(() => {
        console.log('🏥 PatientHistory: Doctor selected:', { doctorId, doctor });
        if (doctorId) {
            console.log('📞 Calling fetchDoctorHistory with doctorId:', doctorId);
            fetchDoctorHistory(doctorId);
        } else {
            console.log('⚠️ No doctorId available');
        }
    }, [doctorId]);

    // Get the most recent appointment
    const lastVisit = history && history.length > 0 ? history[0] : null;
    
    return (
        <div className="bg-white p-4 flex rounded-sm border border-gray-300 h-full">
            {doctor ? (
                <div className='flex-1 flex flex-col justify-between relative'>
                    <h2 className="text-[18px] font-semibold text-cyan-800 mb-5">
                        Your History with Dr. {displayName.split(' ').slice(1).join(' ')}
                    </h2>

                    {loading && (
                        <div className="flex items-center justify-center h-48">
                            <span className="material-symbols-outlined animate-spin text-cyan-700">progress_activity</span>
                        </div>
                    )}

                    {error && (
                        <div className="text-center text-red-600 text-sm">
                            {error.message}
                        </div>
                    )}

                    {!loading && !error && (!history || history.length === 0) && (
                        <div className="space-y-6 absolute top-1/2 -translate-y-1/2 w-full">
                            {/* No Past Visits Placeholder */}
                            <div className="text-center">
                                <span className="material-symbols-sharp text-[48px] text-gray-300">calendar_month</span>
                                <p className="text-sm text-gray-400 mt-2">No previous visits recorded</p>
                            </div>
                        </div>
                    )}

                    {!loading && !error && lastVisit && (
                        <div className="space-y-4 flex-1">
                            {/* Appointment Date & Time */}
                            <div>
                                <p className="text-xs text-slate-400 uppercase tracking-wider">Last Visit</p>
                                <p className="text-sm font-medium text-slate-700 mt-1">
                                    {format(new Date(lastVisit.appointment_date), 'MMMM d, yyyy')} at {lastVisit.appointment_time}
                                </p>
                            </div>

                            {/* Status */}
                            <div>
                                <p className="text-xs text-slate-400 uppercase tracking-wider">Status</p>
                                <span className={`inline-block mt-1 px-2 py-1 text-xs font-medium rounded ${
                                    lastVisit.status === 'completed' ? 'bg-green-100 text-green-800' :
                                    lastVisit.status === 'cancelled' ? 'bg-red-100 text-red-800' :
                                    'bg-blue-100 text-blue-800'
                                }`}>
                                    {lastVisit.status}
                                </span>
                            </div>

                            {/* Notes if available */}
                            {lastVisit.notes && (
                                <div>
                                    <p className="text-xs text-slate-400 uppercase tracking-wider">Notes</p>
                                    <p className="text-sm text-slate-600 mt-2 bg-gray-50 p-2 rounded border-l-4 border-cyan-800">
                                        {lastVisit.notes}
                                    </p>
                                </div>
                            )}

                            {/* Total Visits Count */}
                            <div className="pt-2 border-t border-gray-200">
                                <p className="text-xs text-slate-400">Total visits: <span className="font-semibold text-slate-700">{history.length}</span></p>
                            </div>
                        </div>
                    )}
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