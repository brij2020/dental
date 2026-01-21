import { supabase } from '../../lib/supabaseClient';
import { get, post, put, del, searchClinicPatients as searchClinicPatientsAPI, getClinicPatients as getClinicPatientsAPI, getClinicPanels as getClinicPanelsAPI } from '../../lib/apiClient';
import type { ClinicInsertPayload, ClinicPatientRow, PatientGlobal, DoctorProfile, AppointmentInsertPayload, AppointmentConfirmation } from './types'; 

// Search clinic patients by term via API
export async function searchClinicPatients(clinicId: string, term: string) {
  try {
    const response = await searchClinicPatientsAPI(clinicId, term);
    const patients = response.data?.data || [];
    // Map API response to ClinicPatientRow format
    return patients.map((p: any) => ({
      id: p._id || p.id,
      patient_id: p._id || p.id,
      uhid: p.uhid,
      file_number: p.file_number || null,
      full_name: p.full_name,
      date_of_birth: p.date_of_birth,
      contact_number: p.contact_number
    })) as ClinicPatientRow[];
  } catch (error) {
    console.error('Error searching clinic patients:', error);
    throw error;
  }
}

// Get all patients for clinic from API
export async function getClinicPatients(clinicId: string) {
  try {
    const response = await getClinicPatientsAPI(clinicId);
    return response.data?.data || [];
  } catch (error) {
    console.error('Error fetching clinic patients:', error);
    throw error;
  }
}

// Exact UHID lookup from global patients
export async function searchPatientByUhid(uhid: string) {
  const { data, error } = await supabase
    .from('patients')
    .select('id, uhid, full_name, date_of_birth, address, email, contact_number, gender, state, city')
    .eq('uhid', uhid)
    .limit(10);
  if (error) throw error;
  return (data as PatientGlobal[]) ?? [];
}

// Insert patient into clinic registry
export async function insertClinicPatient(payload: ClinicInsertPayload) {
  // We now only send clinic_id, patient_id, panel, and file_number
  const res = await supabase
    .from('patients_clinic')
    .insert([payload])
    .select('id, file_number') // DB generates the ID now
    .single();
    
  if (res.error) throw res.error;
  return res.data as { id: string; file_number: string | null };
}

// Create a new patient via API
export async function createNewPatientViaApi(patientData: any) {
  try {
    const response = await post('/api/patient', patientData);
    return response.data?.data || response.data;
  } catch (error) {
    console.error('Error creating patient:', error);
    throw error;
  }
}

// Update patient via API
export async function updatePatientViaApi(patientId: string, patientData: any) {
  try {
    const response = await put(`/api/patient/${patientId}`, patientData);
    return response.data?.data || response.data;
  } catch (error) {
    console.error('Error updating patient:', error);
    throw error;
  }
}

// Delete patient via API
export async function deletePatientViaApi(patientId: string) {
  try {
    await del(`/api/patient/${patientId}`);
    return true;
  } catch (error) {
    console.error('Error deleting patient:', error);
    throw error;
  }
}

export async function bookAppointment(payload: AppointmentInsertPayload): Promise<AppointmentConfirmation> {
  const { bookAppointmentAPI } = await import('../../lib/apiClient');
  try {
    const response = await bookAppointmentAPI(payload);
    return {
      appointment_uid: response.data?.data?.appointment_uid as string,
      id: response.data?.data?.id as string,
    };
  } catch (error: any) {
    // Preserve Supabase error handling pattern
    if (error.response?.status === 409 || error.response?.data?.code === '23505') {
      throw new Error('This time slot was just booked by someone else. Please choose another.');
    }
    throw error.response?.data || error;
  }
}

export async function getDoctorsByClinic(_clinicId: string): Promise<DoctorProfile[]> {
  try {
    const response = await get('/api/profile');
    
    if (!response.data) {
      console.warn('No data returned from /api/profile');
      return [];
    }

    const profiles = Array.isArray(response.data) ? response.data : response.data.data || [];
    
    // Filter for doctors and admins only
    return profiles
      .filter((profile: any) => ['doctor', 'admin'].includes(profile.role))
      .map((profile: any) => ({
        id: profile._id || profile.id,
        full_name: profile.full_name,
        availability: profile.availability,
        slot_duration_minutes: profile.slot_duration_minutes,
        leave: profile.leave || [],
      })) as DoctorProfile[];
  } catch (error) {
    console.error('Error fetching doctors:', error);
    throw error;
  }
}

// Get all clinic panels
export async function getClinicPanelsData(clinicId: string) {
  try {
    const response = await getClinicPanelsAPI(clinicId);
    return response.data?.data || [];
  } catch (error) {
    console.error('Error fetching clinic panels:', error);
    throw error;
  }
}

export async function getMedicalConditionsByClinic(clinicId: string) {
  const { getMedicalConditions } = await import('../../lib/apiClient');
  try {
    const response = await getMedicalConditions(clinicId);
    const data = response.data?.data || [];
    return data.map((condition: any) => ({
      id: condition._id,
      name: condition.name,
      has_value: condition.has_value,
    }));
  } catch (error) {
    console.error('Failed to fetch medical conditions:', error);
    throw error;
  }
}

export async function getBookedSlotsForDoctorOnDate(
  doctorId: string,
  date: string
): Promise<string[]> {
  const { getBookedSlotsAPI } = await import('../../lib/apiClient');
  try {
    const response = await getBookedSlotsAPI(doctorId, date);
    const slots = response.data?.data || [];
    
    // Format times to HH:MM format
    return slots.map((slot: string) => {
      const timeStr = slot as string; // e.g., "09:00:00" or "09:00"
      if (timeStr.includes(':')) {
        const parts = timeStr.split(':');
        const h = parts[0].padStart(2, '0');
        const m = parts[1].padStart(2, '0');
        return `${h}:${m}`;
      }
      return timeStr;
    });
  } catch (error) {
    console.error('Error fetching booked slots:', error);
    throw error;
  }
}

export async function checkDoctorLeaveStatus(doctorId: string, date: string, doctors: DoctorProfile[]): Promise<{ isOnLeave: boolean; leaveReason?: string }> {
  try {
    console.log('🔍 checkDoctorLeaveStatus START', { doctorId, date });
    
    // Find the doctor in the provided list
    const doctor = doctors.find(d => d.id === doctorId);
    console.log('👨‍⚕️ Doctor found:', !!doctor, doctor?.full_name);
    
    if (!doctor) {
      console.log('❌ Doctor not found');
      return { isOnLeave: false };
    }

    if (!doctor.leave) {
      console.log('❌ No leave array in doctor profile');
      return { isOnLeave: false };
    }

    if (!Array.isArray(doctor.leave)) {
      console.log('❌ Leave is not an array:', typeof doctor.leave);
      return { isOnLeave: false };
    }

    console.log('📋 Leave array found, length:', doctor.leave.length);
    console.log('📅 All leave records:', doctor.leave);

    // Check if the date falls within any leave period
    const checkDateStr = date; // Use string comparison for dates (YYYY-MM-DD format)
    console.log('🗓️ Checking date:', checkDateStr);
    
    let isOnLeave = false;
    let leaveReason: string | undefined;

    for (let i = 0; i < doctor.leave.length; i++) {
      const leaveRecord = doctor.leave[i];
      console.log(`📌 Checking leave record ${i}:`, leaveRecord);

      // Skip if explicitly marked as inactive
      if (leaveRecord.is_active === false) {
        console.log(`⏭️ Record ${i} is inactive, skipping`);
        continue;
      }

      // Handle single day leave (date field)
      if (leaveRecord.date) {
        console.log(`📌 Record ${i} has date field: "${leaveRecord.date}" vs checking: "${checkDateStr}"`);
        if (leaveRecord.date === checkDateStr) {
          console.log(`✅ MATCH! Doctor is on leave on ${checkDateStr}`);
          isOnLeave = true;
          leaveReason = leaveRecord.reason || `On leave on ${leaveRecord.day}`;
          break;
        }
      }

      // Handle date range leave (leave_start_date and leave_end_date)
      if (leaveRecord.leave_start_date && leaveRecord.leave_end_date) {
        console.log(`📌 Record ${i} has date range: ${leaveRecord.leave_start_date} to ${leaveRecord.leave_end_date}`);
        if (checkDateStr >= leaveRecord.leave_start_date && checkDateStr <= leaveRecord.leave_end_date) {
          console.log(`✅ MATCH! Doctor is on leave in range`);
          isOnLeave = true;
          leaveReason = leaveRecord.reason || `On leave from ${leaveRecord.leave_start_date} to ${leaveRecord.leave_end_date}`;
          break;
        }
      }
    }

    console.log('🏁 checkDoctorLeaveStatus END', { isOnLeave, leaveReason });
    return { isOnLeave, leaveReason };
  } catch (error) {
    console.error('💥 Error checking doctor leave:', error);
    return { isOnLeave: false };
  }
}
