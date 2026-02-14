import React from 'react';
import type { Doctor, Clinic } from '@/hooks/useFetchClinicsAndDoctors';

// --- DOCTOR PROFILE SUB-COMPONENT ---
const DoctorProfile: React.FC<{ doctor: Doctor | null; clinic: Clinic | null }> = ({ doctor, clinic }) => {
  if (!doctor || !clinic) {
    return null;
  }
  const displayName = doctor.full_name || doctor.name || 'Unknown';
  const displaySpecialty = doctor.specialization || doctor.email || 'Dental Professional';

  return (
    <div className="bg-white p-3 rounded-sm border border-slate-200 border-t-4 border-t-cyan-800">
      <div className="flex items-center space-x-3">
        <div className="flex-shrink-0">
          <div className="w-12 h-12 rounded-full overflow-hidden border-2 border-cyan-800 bg-gray-200 flex items-center justify-center">
            {doctor.profile_pic ? (
              <img src={doctor.profile_pic} alt={displayName} className="w-full h-full object-cover" />
            ) : (
              <span className="text-lg font-bold text-cyan-800">{displayName.charAt(0)}</span>
            )}
          </div>
        </div>
        <div className="flex-grow flex flex-col">
          <h3 className="font-semibold text-[16px] text-cyan-800">{displayName}|||||</h3>
          <p className="text-[13px] text-gray-500 -mt-0.5">{displaySpecialty}||</p>
        </div>
      </div>
    </div>
  );
};

// --- MAIN COMPONENT PROPS ---
interface CareTeamSelectionProps {
  clinics: Clinic[];
  availableDoctors: Doctor[];
  selectedClinicId: string;
  selectedDoctorId: string | null;
  selectedDoctor: Doctor | null;
  selectedClinic: Clinic | null;
  onClinicSelect: (clinicId: string) => void;
  onDoctorSelect: (doctorId: string) => void;
  loading?: boolean;
}

// --- MAIN CARE TEAM SELECTION COMPONENT ---
const CareTeamSelection: React.FC<CareTeamSelectionProps> = ({
  clinics,
  availableDoctors,
  selectedClinicId,
  selectedDoctorId,
  selectedDoctor,
  selectedClinic,
  onClinicSelect,
  onDoctorSelect,
  loading = false
}) => {
  const safeClinics = Array.isArray(clinics) ? clinics : [];

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
              onChange={(e) =>{ 
  
                onClinicSelect(e.target.value)

              }}
              disabled={loading}
              className="w-full p-2 border border-gray-300 rounded-sm bg-gray-50 text-sm outline-none appearance-none disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <option value="" disabled>{loading ? 'Loading clinics...' : 'Select a clinic...'}</option>
              {safeClinics.map(clinic => (
                <option key={clinic.id} value={clinic.clinic_id}>{clinic.name}</option>
              ))}
            </select>
            <span className="material-symbols-sharp text-[20px] text-zinc-500 absolute right-1 top-1/2 -translate-y-1/2">keyboard_arrow_down</span>
          </div>
        </div>

        {/* Step 2: Select Doctor */}
        <div>
          <label className="block text-sm text-zinc-500 mb-2">Select a Doctor</label>
          <div className="relative">
            <select
              value={selectedDoctorId || ''}
              onChange={(e) => onDoctorSelect(e.target.value)}
              disabled={!selectedClinicId || loading}
              className="w-full p-2 border border-gray-300 rounded-sm bg-gray-50 text-sm outline-none appearance-none disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <option value="" disabled>
                {!selectedClinicId ? 'Select a clinic first...' : loading ? 'Loading doctors...' : 'Select a doctor...'}
              </option>
              {availableDoctors.map(doctor => {
                const displayName = doctor.full_name || doctor.name || 'Unknown';
                const displaySpecialty = doctor.specialization?.[0] || 'Dental Professional';
                return (
                  <option key={doctor._id} value={doctor._id}>
                    {displayName} - {displaySpecialty}
                  </option>
                );
              })}
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
