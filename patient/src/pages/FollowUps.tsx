import { useState, useMemo } from 'react';

// Import the modular components
import CareTeamSelection from '@/Components/follow-up/CareTeamSelection';
import PatientHistory from '@/Components/follow-up/PatientHistory';
import SchedulingSection from '@/Components/follow-up/SchedulingSection';
import VisitPreparation from '@/Components/follow-up/VisitPreparation';
import ConfirmationModal from '@/Components/follow-up/ConfirmationModal';
import CustomModal from '@/Components/CustomModal';

// --- TYPE DEFINITIONS ---
interface Visit {
    date: Date;
    treatment: string;
    summary: string;
    fullDetailsLink: string;
}

interface Doctor {
    id: number;
    name: string;
    specialty: string;
    photoUrl: string;
    clinicId: string;
    lastVisit: Visit;
}

interface Clinic {
    id: string;
    name: string;
    location: string;
}

// Data structure for the confirmation modal
interface AppointmentData {
    doctor: string;
    clinic: string;
    time: string;
    notes: string;
    files: string[];
}

// --- MOCK DATA ---
const mockClinics: Clinic[] = [
    { id: "clinic-gurgaon", name: "STOMA AI Clinic - Gurgaon", location: "Gurgaon" },
    { id: "clinic-south-delhi", name: "STOMA AI Clinic - South Delhi", location: "South Delhi" },
    { id: "clinic-noida", name: "STOMA AI Clinic - Noida", location: "Noida" }
];

const mockDoctors: Doctor[] = [
    { id: 1, name: "Dr. Priya Sharma", specialty: "Orthodontist", photoUrl: "https://images.unsplash.com/photo-1576091160550-2173dba9996a?q=80&w=2070&auto=format&fit=crop", clinicId: "clinic-gurgaon", lastVisit: { date: new Date("2025-05-20T14:30:00Z"), treatment: "Braces Adjustment", summary: "Adjustment went well. Ligatures replaced. Monitor for any discomfort. Next follow-up in 8 weeks.", fullDetailsLink: "/log/visit/67890" } },
    { id: 2, name: "Dr. Rohan Gupta", specialty: "Endodontist", photoUrl: "https://images.unsplash.com/photo-1537368910025-7003507965b6?q=80&w=2070&auto=format&fit=crop", clinicId: "clinic-gurgaon", lastVisit: { date: new Date("2025-01-15T10:00:00Z"), treatment: "Root Canal Treatment (RCT)", summary: "Phase one of RCT complete. Book follow-up in 6 months for final crown.", fullDetailsLink: "/log/visit/12345" } },
    { id: 3, name: "Dr. Anjali Mehta", specialty: "General Dentist", photoUrl: "https://images.unsplash.com/photo-1618498082410-b4aa22193b38?q=80&w=2070&auto=format&fit=crop", clinicId: "clinic-south-delhi", lastVisit: { date: new Date("2024-12-10T09:00:00Z"), treatment: "Annual Check-up & Cleaning", summary: "No new issues found. Gums are healthy. See you in one year.", fullDetailsLink: "/log/visit/11223" } },
    { id: 4, name: "Dr. Vikram Singh", specialty: "Oral Surgeon", photoUrl: "https://images.unsplash.com/photo-1582750433449-648ed127bb54?q=80&w=2070&auto=format&fit=crop", clinicId: "clinic-south-delhi", lastVisit: { date: new Date("2025-03-18T11:00:00Z"), treatment: "Wisdom Tooth Extraction", summary: "Extraction completed successfully. Follow post-operative care instructions.", fullDetailsLink: "/log/visit/45678" } },
    { id: 5, name: "Dr. Kavita Reddy", specialty: "Pediatric Dentist", photoUrl: "https://images.unsplash.com/photo-1594824694996-73eecd88a18d?q=80&w=2070&auto=format&fit=crop", clinicId: "clinic-noida", lastVisit: { date: new Date("2025-06-12T16:00:00Z"), treatment: "Routine Cleaning & Fluoride", summary: "Excellent oral hygiene maintained. Next visit scheduled in 6 months.", fullDetailsLink: "/log/visit/78901" } }
];


export default function FollowUpPage() {
    // --- STATE MANAGEMENT ---
    const [selectedClinicId, setSelectedClinicId] = useState<string>('');
    const [selectedDoctorId, setSelectedDoctorId] = useState<number | null>(null);
    const [selectedTimeSlot, setSelectedTimeSlot] = useState<string | null>(null);
    const [notes, setNotes] = useState('');
    const [uploadedFiles, setUploadedFiles] = useState<File[]>([]);
    const [isPreparationRequired, setIsPreparationRequired] = useState(false);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [confirmedAppointmentData, setConfirmedAppointmentData] = useState<AppointmentData | null>(null);

    // --- COMPUTED VALUES ---
    const availableDoctors = useMemo(() => {
        if (!selectedClinicId) return [];
        return mockDoctors.filter(doctor => doctor.clinicId === selectedClinicId);
    }, [selectedClinicId]);

    const selectedDoctor = useMemo(() =>
        selectedDoctorId ? mockDoctors.find(d => d.id === selectedDoctorId) || null : null,
        [selectedDoctorId]
    );

    const selectedClinic = useMemo(() =>
        selectedClinicId ? mockClinics.find(c => c.id === selectedClinicId) || null : null,
        [selectedClinicId]
    );

    // --- EVENT HANDLERS ---
    const handleClinicSelect = (clinicId: string) => {
        setSelectedClinicId(clinicId);
        setSelectedDoctorId(null);
        setSelectedTimeSlot(null);
    };

    const handleDoctorSelect = (doctorId: number) => {
        setSelectedDoctorId(doctorId);
        setSelectedTimeSlot(null);
    };

    const handleConfirm = () => {
        if (!selectedDoctor || !selectedClinic || !selectedTimeSlot) {
            alert('Please complete all required selections to proceed.');
            return;
        }

        const appointmentData = {
            doctor: selectedDoctor.name,
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
                            clinics={mockClinics}
                            availableDoctors={availableDoctors}
                            selectedClinicId={selectedClinicId}
                            selectedDoctorId={selectedDoctorId}
                            selectedDoctor={selectedDoctor}
                            selectedClinic={selectedClinic}
                            onClinicSelect={handleClinicSelect}
                            onDoctorSelect={handleDoctorSelect}
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