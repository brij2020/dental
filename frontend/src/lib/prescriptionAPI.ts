import apiClient from './apiClient';

const PRESCRIPTIONS_ENDPOINT = '/api/prescriptions';

export const prescriptionAPI = {
  // Get all prescriptions for a consultation
  getByConsultation: async (consultationId: string) => {
    const response = await apiClient.get(PRESCRIPTIONS_ENDPOINT, {
      params: { consultation_id: consultationId },
    });
    return response.data.data;
  },

  // Create or update prescriptions for a consultation (bulk replace)
  saveForConsultation: async (consultationId: string, prescriptions: any[]) => {
    const response = await apiClient.post(PRESCRIPTIONS_ENDPOINT + '/bulk', {
      consultation_id: consultationId,
      prescriptions,
    });
    return response.data.data;
  },

  // Delete all prescriptions for a consultation
  deleteByConsultation: async (consultationId: string) => {
    const response = await apiClient.delete(PRESCRIPTIONS_ENDPOINT, {
      params: { consultation_id: consultationId },
    });
    return response.data;
  },
};
