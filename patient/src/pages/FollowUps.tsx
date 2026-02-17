import { useState, useMemo, useEffect, useCallback } from 'react';
import { format } from 'date-fns';
import { toast } from 'react-toastify';
import { api } from '@/lib/apiClient';
import { useProfile } from '@/hooks/useProfile';
import { useFetchClinicsAndDoctors } from '@/hooks/useFetchClinicsAndDoctors';
import type { Clinic, Doctor } from '@/hooks/useFetchClinicsAndDoctors';
import useGetAppointments from '@/hooks/useGetAppointments';

// Import the modular components
import CareTeamSelection from '@/Components/follow-up/CareTeamSelection';
import PatientHistory from '@/Components/follow-up/PatientHistory';
import SchedulingSection from '@/Components/follow-up/SchedulingSection';
import VisitPreparation from '@/Components/follow-up/VisitPreparation';
import ConfirmationModal from '@/Components/follow-up/ConfirmationModal';
import CustomModal from '@/Components/CustomModal';
import Loading from '@/Components/Loading';

// Data structure for the confirmation modal
interface AppointmentData {
    doctor: string;
    clinic: string;
    time: string;
    notes: string;
    files: string[];
}

export default function FollowUpPage() {
    // --- FETCH CLINICS AND DOCTORS ---
    const { clinics, doctors, loading, error, fetchDoctorsByClinic, fetchPatientHistory } = useFetchClinicsAndDoctors();
    const { appointments, refetch: refetchAppointments } = useGetAppointments();
    const { profile } = useProfile();

    // --- STATE MANAGEMENT ---
    const [selectedClinicId, setSelectedClinicId] = useState<string>('');
    const [selectedDoctorId, setSelectedDoctorId] = useState<string | null>(null);
    const [selectedTimeSlot, setSelectedTimeSlot] = useState<string | null>(null);
    const [selectedDate, setSelectedDate] = useState<Date | null>(null);
    const [notes, setNotes] = useState('');
    const [uploadedFiles, setUploadedFiles] = useState<File[]>([]);
    const [isPreparationRequired, setIsPreparationRequired] = useState(false);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [confirmedAppointmentData, setConfirmedAppointmentData] = useState<AppointmentData | null>(null);
    const [isSubmitting, setIsSubmitting] = useState(false);

    // --- COMPUTED VALUES ---
    const selectedClinic = useMemo(() =>
        selectedClinicId ? clinics.find(c => c.id === selectedClinicId || c._id === selectedClinicId || c.clinic_id === selectedClinicId) || null : null,
        [selectedClinicId, clinics]
    );

    const selectedDoctor = useMemo(() => {
        if (!selectedDoctorId) {
            return null;
        }
        const found = doctors.find(d => d.id === selectedDoctorId || d._id === selectedDoctorId) || null;

        return found;
    }, [selectedDoctorId, doctors]);

    // --- EVENT HANDLERS ---
    const handleClinicSelect = useCallback(async (clinicId: string) => {
        setSelectedClinicId(clinicId);
        setSelectedDoctorId(null);
        setSelectedTimeSlot(null);
        
        // Fetch doctors for selected clinic
        await fetchDoctorsByClinic(clinicId);
    }, [fetchDoctorsByClinic]);

    const handleDoctorSelect = (doctorId: string) => {
       
        const doctor = doctors.find(d => d.id === doctorId || d._id === doctorId);
     
        setSelectedDoctorId(doctorId);
        setSelectedTimeSlot(null);
        fetchPatientHistory(doctorId);
    };

    const convertSlotTo24Hour = (slot: string) => {
        const [timePart, period] = slot.split(' ');
        if (!timePart || !period) return null;
        const [hours, minutes] = timePart.split(':').map(Number);
        if (Number.isNaN(hours) || Number.isNaN(minutes)) return null;
        let normalizedHour = hours % 12;
        if (period.toUpperCase() === 'PM') {
            normalizedHour += 12;
        }
        const hh = normalizedHour.toString().padStart(2, '0');
        const mm = minutes.toString().padStart(2, '0');
        return `${hh}:${mm}`;
    };

    const sortedPreviousAppointments = useMemo(() => {
        const previous = appointments?.previous || [];
        const toTimestamp = (appt: typeof previous[number]) => {
            if (!appt?.appointment_date) return 0;
            const time = appt?.appointment_time || '00:00';
            const dateStr = `${appt.appointment_date}T${time}:00`;
            const date = new Date(dateStr);
            return Number.isNaN(date.valueOf()) ? 0 : date.valueOf();
        };
        return [...previous].sort((a, b) => toTimestamp(b) - toTimestamp(a));
    }, [appointments?.previous]);

    const lastAppointment = sortedPreviousAppointments[0] || null;
    const lastVisitedClinicId = lastAppointment?.clinic_id || lastAppointment?.clinics?.clinic_id || lastAppointment?.clinics?.id || lastAppointment?.clinics?._id || '';

    const handleConfirm = async () => {
        if (!selectedDoctor || !selectedClinic || !selectedTimeSlot) {
            alert('Please complete all required selections to proceed.');
            return;
        }
        if (!selectedDate) {
            toast.error('Please select a date for your follow-up');
            return;
        }
        if (!profile?.patient_id) {
            toast.error('Unable to identify patient. Please log out and log back in.');
            return;
        }

        const appointmentDate = format(selectedDate, 'yyyy-MM-dd');
        const appointmentTime = convertSlotTo24Hour(selectedTimeSlot);
        if (!appointmentTime) {
            toast.error('Invalid time slot selected');
            return;
        }

        const clinicId = selectedClinic?.clinic_id || selectedClinic?.id || selectedClinic?._id || '';
        const doctorId = selectedDoctor?.id || selectedDoctor?._id || selectedDoctor?.doctor_id || '';
        if (!clinicId || !doctorId) {
            toast.error('Missing clinic or doctor identifiers');
            return;
        }

        const payload: Record<string, unknown> = {
            clinic_id: clinicId,
            patient_id: profile.patient_id,
            uhid: profile.uhid || null,
            full_name: profile.full_name,
            contact_number: profile.contact_number || selectedClinic?.contact_number || null,
            appointment_date: appointmentDate,
            appointment_time: appointmentTime,
            doctor_id: doctorId,
            doctor_name: selectedDoctor.full_name || selectedDoctor.name || null,
            clinics: {
                id: selectedClinic?.id,
                clinic_id: selectedClinic?.clinic_id,
                name: selectedClinic?.name,
                address: selectedClinic?.address,
                contact_number: selectedClinic?.contact_number,
                admin_staff_name: selectedClinic?.admin_staff_name,
            },
            appointment_type: 'in_person',
            provisional: false,
            medical_conditions: [],
        };
        console.log("lastAppointment",lastAppointment)

        if (lastAppointment?.file_number) {
            payload.file_number = lastAppointment.file_number;
        }
        
        try {
            setIsSubmitting(true);
            const response: any = await api.post('/api/appointments', payload);

            if (!response?.success) {
                throw new Error(response?.error || 'Failed to create follow-up appointment');
            }

            toast.success('Follow-up request submitted!');
            setConfirmedAppointmentData({
                doctor: selectedDoctor.full_name || selectedDoctor.name || 'Doctor',
                clinic: selectedClinic.name || 'Clinic',
                time: selectedTimeSlot,
                notes: isPreparationRequired ? notes.trim() : '',
                files: isPreparationRequired ? uploadedFiles.map((f) => f.name) : [],
            });
            setIsModalOpen(true);
            refetchAppointments?.();
        } catch (error: unknown) {
            const message = error instanceof Error ? error.message : 'Failed to create follow-up appointment';
            toast.error(message);
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleCloseModal = () => {
        setIsModalOpen(false);
        // Reset form state after modal is closed for a fresh start
        setSelectedClinicId('');
        setSelectedDoctorId(null);
        setSelectedTimeSlot(null);
        setSelectedDate(null);
        setNotes('');
        setUploadedFiles([]);
        setIsPreparationRequired(false);
        setConfirmedAppointmentData(null);
    };

    const visibleClinics = useMemo(() => {
        if (!lastVisitedClinicId) return clinics;
        const filtered = clinics.filter(c =>
            c.clinic_id === lastVisitedClinicId ||
            c.id === lastVisitedClinicId ||
            c._id === lastVisitedClinicId
        );
        return filtered.length ? filtered : clinics;
    }, [clinics, lastVisitedClinicId]);

    useEffect(() => {
        if (!lastVisitedClinicId) return;
        if (selectedClinicId === lastVisitedClinicId) return;
        const match = clinics.find(c =>
            c.clinic_id === lastVisitedClinicId ||
            c.id === lastVisitedClinicId ||
            c._id === lastVisitedClinicId
        );
        if (!match) return;
        handleClinicSelect(lastVisitedClinicId);
    }, [lastVisitedClinicId, clinics, selectedClinicId, handleClinicSelect]);

    if (loading && clinics.length === 0) {
        return <Loading size={"500px"} />;
    }

    if (error) {
        return (
            <div className="flex items-center justify-center min-h-screen">
                <div className="text-center">
                    <p className="text-red-600 mb-4">⚠️ Error: {error.message}</p>
                    <button
                        onClick={() => window.location.reload()}
                        className="px-4 py-2 bg-cyan-800 text-white rounded hover:bg-cyan-700"
                    >
                        Retry
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen">
            <div className="container mx-auto p-0 md:p-4 max-w-7xl">

                <header className="text-center mb-8">
                    <h1 className="text-2xl font-semibold ">
                        Patient Follow-Up
                    </h1>
                    <p className="text-sm text-gray-400">
                        Continue your care journey with our trusted dental team
                    </p>
                </header>

                <main className="space-y-4">
                    <section className="grid grid-cols-1 xl:grid-cols-2 gap-4">
                        <CareTeamSelection
                            clinics={visibleClinics}
                            availableDoctors={doctors}
                            selectedClinicId={selectedClinicId}
                            selectedDoctorId={selectedDoctorId}
                            selectedDoctor={selectedDoctor}
                            selectedClinic={selectedClinic}
                            onClinicSelect={handleClinicSelect}
                            onDoctorSelect={handleDoctorSelect}
                            loading={loading}
                        />
                        <PatientHistory doctor={selectedDoctor} />
                    </section>

                    {selectedDoctor && selectedClinic && (
                        <section>
                            <SchedulingSection
                                selectedDoctor={selectedDoctor}
                                selectedClinic={selectedClinic}
                                selectedTimeSlot={selectedTimeSlot}
                                onTimeSelect={setSelectedTimeSlot}
                                onDateChange={setSelectedDate}
                                patientName={profile?.full_name || profile?.name || "Patient"}
                            />
                        </section>
                    )}

                    <section>
                        <VisitPreparation
                            notes={notes}
                            setNotes={setNotes}
                            uploadedFiles={uploadedFiles}
                            setUploadedFiles={setUploadedFiles}
                            isPreparationRequired={isPreparationRequired}
                            setIsPreparationRequired={setIsPreparationRequired}
                        />
                    </section>

                    <footer className="text-center pt-4">
                        <button
                            onClick={handleConfirm}
                            disabled={!selectedDoctor || !selectedClinic || !selectedTimeSlot || isSubmitting}
                            className={`py-2 px-8 font-medium text-sm rounded-sm ${selectedDoctor && selectedClinic && selectedTimeSlot && !isSubmitting
                                    ? 'bg-cyan-800 text-white hover:bg-cyan-700'
                                    : 'bg-slate-300 text-slate-500 cursor-not-allowed'
                                }`}
                        >
                            {isSubmitting
                                ? 'Submitting...'
                                : (selectedDoctor && selectedClinic && selectedTimeSlot
                                    ? 'Confirm Follow-Up'
                                    : 'Complete Selection to Continue')}
                        </button>
                        {(!selectedDoctor || !selectedClinic || !selectedTimeSlot) && (
                            <p className="text-xs text-slate-400 mt-1">
                                {!selectedClinic ? 'Select a clinic' :
                                    !selectedDoctor ? 'Select a doctor' :
                                        'Select a date and time to continue'}
                            </p>
                        )}
                    </footer>
                </main>
            </div>

            <CustomModal openModal={isModalOpen} setOpenModal={setIsModalOpen}>

                <ConfirmationModal
                    isOpen={isModalOpen}
                    onClose={handleCloseModal}
                    appointmentData={confirmedAppointmentData}
                />
            </CustomModal>
        </div>
    );
}
