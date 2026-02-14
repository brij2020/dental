// src/features/consultation/types.ts

// Custom enums from your SQL schema
export type PaymentModeEnum = 'Cash' | 'Card' | 'UPI' | 'Bank Transfer';
export type ConsultationStatusEnum = 'Draft' | 'Completed' | 'Cancelled';

// Type for the main 'consultations' table
export type ConsultationRow = {
  id: string; // uuid
  appointment_id: string; // uuid
  clinic_id: string; // uuid
  patient_id: string; // uuid
  doctor_id: string | null; // uuid
  chief_complaints: string | null;
  on_examination: string | null;
  advice: string | null;
  notes: string | null;
  consultation_fee: number;
  other_amount: number;
  discount: number;
  procedure_amount: number; // Calculated by trigger
  subtotal: number; // Calculated by trigger
  total_amount: number; // Calculated by trigger
  total_paid: number; // Calculated by trigger
  amount_due: number; // Calculated by trigger
  previous_outstanding_balance: number;
  medical_history: string[] | null;
  status: ConsultationStatusEnum;
  created_at: string; // ISO timestamp
  updated_at: string; // ISO timestamp
};

// Type for the 'treatment_procedures' table
export type TreatmentProcedureRow = {
  id: string; // uuid
  consultation_id: string; // uuid
  clinic_id: string; // uuid
  tooth_number: number;
  problems: string[] | null;
  solutions: string[] | null;
  cost: number;
  tooth_damage: string | null;
  created_at: string; // ISO timestamp
};

// Type for the 'prescriptions' table (DB version)
export type PrescriptionRowDb = {
  id: string; // uuid
  consultation_id: string; // uuid
  clinic_id: string; // uuid
  medicine_name: string;
  times: string | null;
  quantity: string | null;
  days: string | null;
  note: string | null;
  created_at: string; // ISO timestamp
};

// Type for the 'payments' table
export type PaymentRow = {
  id: string; // uuid
  consultation_id: string; // uuid
  clinic_id: string; // uuid
  patient_id: string; // uuid
  amount: number;
  payment_mode: PaymentModeEnum;
  reference: string | null;
  payment_date: string; // ISO timestamp
  created_at: string; // ISO timestamp
};

export type RemedyRow = {
  id: string;
  clinic_id: string;
  name: string;
  times: string | null;
  quantity: string | null;
  days: string | null;
  note: string | null;
  created_at: string;
};
