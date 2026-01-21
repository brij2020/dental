// features/appointments/types.ts
export type AppointmentDetails = {
  id: string; // Appointment UUID
  appointment_uid: string; // User-friendly ID
  file_number?: string; // Patient file number (optional)
  full_name: string; // Patient's full name
  appointment_date: string;
  appointment_time: string;
  status: 'scheduled' | 'in-progress' | 'completed' | 'cancelled';
  doctor: {
    full_name: string | null;
  } | null;
  medical_conditions?: string[];
  notes: string | null;
  patient_note?: string | null;
  follow_up_for_consultation_id?: string | null;
};

// Type for updating the status
export type AppointmentStatusUpdate = {
  status: 'scheduled' | 'in-progress' | 'completed' | 'cancelled';
};
export type MedicalCondition = { id: string; name: string, has_value: boolean; };
