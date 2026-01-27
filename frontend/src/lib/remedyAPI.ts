import apiClient from './apiClient';

const REMEDIES_ENDPOINT = '/api/remedies';

export const remedyAPI = {
  // Get all remedies for a clinic
  getByClinic: async (clinicId: string) => {
    const response = await apiClient.get(`${REMEDIES_ENDPOINT}/clinic/${clinicId}`);
    return response.data.data;
  },

  // Get all remedies (optionally filtered)
  getAll: async (clinicId?: string) => {
    const response = await apiClient.get(REMEDIES_ENDPOINT, {
      params: clinicId ? { clinic_id: clinicId } : {},
    });
    return response.data.data;
  },

  // Get a single remedy by ID
  getById: async (id: string) => {
    const response = await apiClient.get(`${REMEDIES_ENDPOINT}/${id}`);
    return response.data.data;
  },

  // Create a new remedy
  create: async (data: {
    clinic_id: string;
    name: string;
    times?: string | null;
    quantity?: string | null;
    days?: string | null;
    note?: string | null;
  }) => {
    const response = await apiClient.post(REMEDIES_ENDPOINT, data);
    return response.data.data;
  },

  // Update remedy by ID
  update: async (
    id: string,
    data: {
      name?: string;
      times?: string | null;
      quantity?: string | null;
      days?: string | null;
      note?: string | null;
    }
  ) => {
    const response = await apiClient.put(`${REMEDIES_ENDPOINT}/${id}`, data);
    return response.data.data;
  },

  // Update remedy by clinic_id and name
  updateByClinicAndName: async (
    clinicId: string,
    name: string,
    data: {
      name?: string;
      times?: string | null;
      quantity?: string | null;
      days?: string | null;
      note?: string | null;
    }
  ) => {
    const response = await apiClient.put(
      `${REMEDIES_ENDPOINT}/clinic/${clinicId}/${name}`,
      data
    );
    return response.data.data;
  },

  // Delete remedy by ID
  delete: async (id: string) => {
    const response = await apiClient.delete(`${REMEDIES_ENDPOINT}/${id}`);
    return response.data;
  },

  // Delete remedy by clinic_id and name
  deleteByClinicAndName: async (clinicId: string, name: string) => {
    const response = await apiClient.delete(
      `${REMEDIES_ENDPOINT}/clinic/${clinicId}/${name}`
    );
    return response.data;
  },

  // Get remedies with search and limit (for migration from Supabase REST)
  search: async (clinicId: string, name: string, limit: number = 10) => {
    const response = await apiClient.get(REMEDIES_ENDPOINT, {
      params: {
        clinic_id: clinicId,
        name,
        limit,
      },
    });
    return response.data.data;
  },
};
