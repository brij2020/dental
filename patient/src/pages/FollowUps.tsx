import { useState, useMemo } from 'react';
import { useFetchClinicsAndDoctors } from '@/hooks/useFetchClinicsAndDoctors';
import type { Clinic, Doctor } from '@/hooks/useFetchClinicsAndDoctors';

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
    const { clinics, doctors, loading, error, fetchDoctorsByClinic,fetchPatientHistory } = useFetchClinicsAndDoctors();

    // --- STATE MANAGEMENT ---
    const [selectedClinicId, setSelectedClinicId] = useState<string>('');
    const [selectedDoctorId, setSelectedDoctorId] = useState<string | null>(null);
    const [selectedTimeSlot, setSelectedTimeSlot] = useState<string | null>(null);
    const [notes, setNotes] = useState('');
    const [uploadedFiles, setUploadedFiles] = useState<File[]>([]);
    const [isPreparationRequired, setIsPreparationRequired] = useState(false);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [confirmedAppointmentData, setConfirmedAppointmentData] = useState<AppointmentData | null>(null);

    // --- COMPUTED VALUES ---
    const selectedClinic = useMemo(() =>
        selectedClinicId ? clinics.find(c => c.id === selectedClinicId || c._id === selectedClinicId) || null : null,
        [selectedClinicId, clinics]
    );

    const selectedDoctor = useMemo(() => {
        if (!selectedDoctorId) {
            return null;
        }
        const found = doctors.find(d => d.id === selectedDoctorId || d._id === selectedDoctorId) || null;

        return found;
    }, [selectedDoctorId, doctors]);

    // Loading state
    if (loading && clinics.length === 0) {
        return <Loading size={"500px"} />;
    }

    // Error state
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

    // --- EVENT HANDLERS ---
    const handleClinicSelect = async (clinicId: string) => {
        setSelectedClinicId(clinicId);
        setSelectedDoctorId(null);
        setSelectedTimeSlot(null);
        
        // Fetch doctors for selected clinic
        await fetchDoctorsByClinic(clinicId);
    };

    const handleDoctorSelect = (doctorId: string) => {
       
        const doctor = doctors.find(d => d.id === doctorId || d._id === doctorId);
     
        setSelectedDoctorId(doctorId);
        setSelectedTimeSlot(null);
        fetchPatientHistory(doctorId);
    };

    const handleConfirm = () => {
        if (!selectedDoctor || !selectedClinic || !selectedTimeSlot) {
            alert('Please complete all required selections to proceed.');
            return;
        }

        const appointmentData = {
            doctor: selectedDoctor.full_name || selectedDoctor.name || 'Doctor',
            clinic: selectedClinic.name,
            time: selectedTimeSlot,
            notes: isPreparationRequired ? notes.trim() : '',
            files: isPreparationRequired ? uploadedFiles.map(f => f.name) : [],
        };

        setConfirmedAppointmentData(appointmentData);
        setIsModalOpen(true);
    };

    const handleCloseModal = () => {
        setIsModalOpen(false);
        // Reset form state after modal is closed for a fresh start
        setSelectedClinicId('');
        setSelectedDoctorId(null);
        setSelectedTimeSlot(null);
        setNotes('');
        setUploadedFiles([]);
        setIsPreparationRequired(false);
        setConfirmedAppointmentData(null);
    };

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
                            clinics={clinics}
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
                            disabled={!selectedDoctor || !selectedClinic || !selectedTimeSlot}
                            className={`py-2 px-8 font-medium text-sm rounded-sm ${selectedDoctor && selectedClinic && selectedTimeSlot
                                    ? 'bg-cyan-800 text-white hover:bg-cyan-700'
                                    : 'bg-slate-300 text-slate-500 cursor-not-allowed'
                                }`}
                        >
                            {selectedDoctor && selectedClinic && selectedTimeSlot
                                ? 'Confirm Follow-Up'
                                : 'Complete Selection to Continue'
                            }
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