import React from 'react';
import type { Doctor } from './types';
interface Clinic {
  id: string;
  name: string;
  location: string;
}

// --- DOCTOR PROFILE SUB-COMPONENT (Updated UI) ---
const DoctorProfile: React.FC<{ doctor: Doctor | null; clinic: Clinic | null }> = ({ doctor, clinic }) => {
  if (!doctor || !clinic) {
    // This placeholder won't be visible if a doctor is selected.
    return null;
  }

  return (
    <div className="bg-white p-3 rounded-sm border border-slate-200 border-t-4 border-t-cyan-800">
      <div className="flex items-center space-x-3">
        <div className="flex-shrink-0">
          <div className="w-12 h-12 rounded-full overflow-hidden border-2 border-cyan-800">
            <img src={doctor.photoUrl} alt={doctor.name} className="w-full h-full object-cover" />
          </div>
        </div>
        <div className="flex-grow flex flex-col">
          <h3 className="font-semibold text-[16px] text-cyan-800">{doctor.name}</h3>
          <p className="text-[13px] text-gray-500 -mt-0.5">
            {doctor.specialty}
          </p>

        </div>
      </div>
    </div>
  );
};

// --- MAIN COMPONENT PROPS ---
// ... (Interface for CareTeamSelectionProps remains the same)
interface CareTeamSelectionProps {
  clinics: Clinic[];
  availableDoctors: Doctor[];
  selectedClinicId: string;
  selectedDoctorId: number | null;
  selectedDoctor: Doctor | null;
  selectedClinic: Clinic | null;
  onClinicSelect: (clinicId: string) => void;
  onDoctorSelect: (doctorId: number) => void;
}

// --- MAIN CARE TEAM SELECTION COMPONENT (Updated UI) ---
const CareTeamSelection: React.FC<CareTeamSelectionProps> = ({
  clinics,
  availableDoctors,
  selectedClinicId,
  selectedDoctorId,
  selectedDoctor,
  selectedClinic,
  onClinicSelect,
  onDoctorSelect
}) => {
  return (
    <div className="bg-white p-4 flex justify-start items-center rounded-sm border border-gray-300">
      <div className='flex-1'>


        <h2 className="text-[18px] font-semibold text-cyan-800 mb-5">
          Your Care Team
        </h2>

        {/* Step 1: Select Clinic */}
        <div className="mb-5">
          <label className="block text-sm text-zinc-500 mb-2">Select a Clinic</label>
          <div className="relative">
            <select
              value={selectedClinicId}
              onChange={(e) => onClinicSelect(e.target.value)}
              className="w-full p-2 border border-gray-300 rounded-sm bg-gray-50 text-sm outline-none appearance-none"
            >
              <option value="" disabled>Select a clinic...</option>
              {clinics.map(clinic => (
                <option key={clinic.id} value={clinic.id}>{clinic.name}</option>
              ))}
            </select>
            <span className="material-symbols-sharp text-[20px] text-zinc-500 absolute right-1 top-1/2 -translate-y-1/2">keyboard_arrow_down</span>
          </div>
        </div>

        {/* Step 2: Select Doctor */}
        <div>
          <label className="block text-sm  text-zinc-500  mb-2">Select a Doctor</label>
          <div className="relative">
            <select
              value={selectedDoctorId || ''}
              onChange={(e) => onDoctorSelect(Number(e.target.value))}
              disabled={!selectedClinicId}
              className={`w-full p-2 border border-gray-300 rounded-sm bg-gray-50 text-sm outline-none appearance-none`}
            >
              <option value="" disabled>Select a doctor...</option>
              {availableDoctors.map(doctor => (
                <option key={doctor.id} value={doctor.id}>{doctor.name} - {doctor.specialty}</option>
              ))}
            </select>
            <span className="material-symbols-sharp text-[20px] text-zinc-500 absolute right-1 top-1/2 -translate-y-1/2">keyboard_arrow_down</span>
          </div>
        </div>

        {/* Selected Doctor Profile */}
        {selectedDoctor && (
          <div>
            <h3 className="block text-sm text-zinc-500 mb-2 mt-5">Selected Doctor</h3>
            <DoctorProfile doctor={selectedDoctor} clinic={selectedClinic} />
          </div>
        )}
      </div>
    </div>
  );
};

export default CareTeamSelection;