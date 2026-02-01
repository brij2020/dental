import { get, put } from './apiClient';
import type { AppointmentDetails, AppointmentStatusUpdate } from '../pages/appointments/types';

// API Endpoints
const APPOINTMENTS_API = {
  getByClinic: (clinicId: string) => `/api/appointments/clinic/${clinicId}`,
  getById: (appointmentId: string) => `/api/appointments/${appointmentId}`,
  update: (appointmentId: string) => `/api/appointments/${appointmentId}`,
  delete: (appointmentId: string) => `/api/appointments/${appointmentId}`,
};

/**
 * Fetch all appointments for a clinic with optional filters
 */
export async function getAppointments(
  clinicId: string,
  date: string, // YYYY-MM-DD format
  searchTerm: string
): Promise<AppointmentDetails[]> {
  try {
    const params = new URLSearchParams();
    params.append('clinic_id', clinicId);

    if (searchTerm.trim()) {
      params.append('search', searchTerm.trim());
    } else {
      params.append('date', date);
    }

    const response = await get(
      `${APPOINTMENTS_API.getByClinic(clinicId)}?${params.toString()}`
    );
    const data = response.data?.data || [];
    console.log('Fetched appointments data:', data);
    return data.map((appointment: any) => mapAppointmentData(appointment)) as AppointmentDetails[];
  } catch (error) {
    console.error('Error fetching appointments:', error);
    throw error;
  }
}

/**
 * Update appointment status and other details
 */
export async function updateAppointmentStatus(
  appointmentId: string,
  updates: AppointmentStatusUpdate
): Promise<AppointmentDetails> {
  try {
    const response = await put(APPOINTMENTS_API.update(appointmentId), updates);
    const appointment = response.data?.data;

    return mapAppointmentData(appointment) as AppointmentDetails;
  } catch (error: any) {
    console.error('Error updating appointment:', error);
    throw error.response?.data || error;
  }
}

/**
 * Update appointment medical conditions
 */
export async function updateAppointmentMedicalConditions(
  appointmentId: string,
  names: string[]
) {
  try {
    await put(APPOINTMENTS_API.update(appointmentId), {
      medical_conditions: names,
    });
  } catch (error) {
    console.error('Error updating medical conditions:', error);
    throw error;
  }
}

/**
 * Map raw appointment data to AppointmentDetails format
 */
function mapAppointmentData(appointment: any): AppointmentDetails {
  return {
    id: appointment._id || appointment.id,
    appointment_uid: appointment.appointment_uid,
    file_number: appointment.file_number || undefined,
    full_name: appointment.full_name,
    appointment_date: appointment.appointment_date,
    appointment_time: appointment.appointment_time,
    status: appointment.status || 'scheduled',
    medical_conditions: appointment.medical_conditions || [],
    doctor: appointment.doctor_id
      ? typeof appointment.doctor_id === 'object'
        ? { full_name: appointment.doctor_id.full_name }
        : { full_name: null }
      : null,
    notes: appointment.notes || null,
    patient_note: appointment.patient_note || null,
    doctor_name: appointment.doctor_name
  };
}
