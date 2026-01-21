// features/appointments/api.ts
// Re-export centralized API functions
export {
  getAppointments,
  updateAppointmentStatus,
  updateAppointmentMedicalConditions,
} from '../../lib/appointmentsApi';

import type { MedicalCondition } from './types';

export async function getMedicalConditionsByClinic(clinicId: string): Promise<MedicalCondition[]> {
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