// Shared types for the Patients feature

export type ClinicPatientRow = {
  id: string;
  patient_id: string;
  uhid: string | null;
  file_number: string | null;
  full_name: string;
  date_of_birth: string | null;
  contact_number: string | null;
};

export type PatientGlobal = {
  id: string;
  uhid: string;
  full_name: string;
  date_of_birth: string | null;
  address: string | null;
  email: string | null;
  contact_number: string | null;
  gender: string | null;
  state: string | null;
  city: string | null;
};

export type ClinicInsertPayload = {
  clinic_id: string;
  patient_id: string; // References public.patients(id)
  file_number?: string | null; 
    panel?: string | null;   // ⭐ ADD THIS LINE

};

export type AppointmentInsertPayload = {
  clinic_id: string;
  patient_id: string | null;
  uhid: string | null;
  full_name: string;
  contact_number: string | null;
  appointment_date: string;   // YYYY-MM-DD
  appointment_time: string;   // HH:mm
  doctor_id: string;
  medical_conditions?: string[]; // <-- array of names
};

export type AppointmentConfirmation = {
  appointment_uid: string;
  id?: string;
};


export type DoctorProfile = {
  id: string;
  full_name: string | null;
  availability?: any[] | null;
  slot_duration_minutes?: number | null;
  leave?: Array<{
    date?: string; // Single day leave (YYYY-MM-DD)
    leave_start_date?: string; // Date range leave start
    leave_end_date?: string; // Date range leave end
    day?: string; // Day name (e.g., "Tuesday")
    reason?: string;
    is_active?: boolean;
    _id?: string;
  }> | null;
};

export type MedicalCondition = {
  id: string;
  name: string;
  has_value: boolean;
};