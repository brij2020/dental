import { useState, useEffect } from 'react';
import type { Clinic } from './types';
import { fetchClinicById, fetchDoctorSchedules } from './clinicService';
import type { DoctorSchedule } from './clinicService';

/**
 * Interface defining the return values of the useClinicData hook
 */
interface UseClinicDataReturn {
    clinic: Clinic | null;    // The clinic data or null if not loaded
    loading: boolean;         // Indicates if data is currently being fetched
    error: string | null;     // Error message if fetch failed, null otherwise
    refetch: () => void;      // Function to manually trigger a refetch
}

/**
 * Custom hook to fetch and manage clinic data
 * @param clinicId - The ID of the clinic to fetch, or null if not selected
 * @returns Object containing clinic data, loading state, error state, and refetch function
 */
export const useClinicData = (clinicId: string | null): UseClinicDataReturn => {
    // State to store the clinic data
    const [clinic, setClinic] = useState<Clinic | null>(null);
    // State to track loading status
    const [loading, setLoading] = useState(false);
    // State to store any error messages
    const [error, setError] = useState<string | null>(null);

    /**
     * Fetches clinic data from the API (currently mock data)
     */
    const fetchClinic = async () => {
        // Exit early if no clinicId is provided
        if (!clinicId) return;

        // Set loading state and clear any previous errors
        setLoading(true);
        setError(null);

        try {
            const [clinicResp, doctors] = await Promise.all([
                fetchClinicById(clinicId),
                fetchDoctorSchedules(clinicId)
            ]);

            const dentists = (doctors || []).map((d: DoctorSchedule) => ({
                id: d._id || d.id || d.doctor_id || String((d as any).doctor_id),
                name: (d as any).full_name || (d as any).doctor_name || (d as any).name || 'Unknown',
                specialization: d.specialization || '',
                experience: d.experience || d.years_of_experience || 0,
                image: (d as any).profile_pic || (d as any).image || undefined,
                isDefault: false,
                isAvailable: d.status !== 'Inactive'
            }));

            const mappedClinic: Clinic = {
                id: clinicResp._id || clinicResp.id || clinicResp.clinic_id || clinicId,
                _id: clinicResp._id,
                clinic_id: clinicResp.clinic_id || clinicResp.id || clinicId,
                name: clinicResp.name || 'Clinic',
                address: typeof clinicResp.address === 'string' ? clinicResp.address : (clinicResp.address?.street || '') + (clinicResp.address?.city ? ', ' + clinicResp.address.city : ''),
                phone: clinicResp.phone || (clinicResp as any).contact_number || '',
                email: (clinicResp as any).email,
                rating: (clinicResp as any).rating || 0,
                dentists,
                operatingHours: (clinicResp as any).operatingHours || { open: '09:00', close: '18:00', days: [] },
                reviews: (clinicResp as any).reviews || [],
                admin_staff: (clinicResp as any).admin_staff,
                admin_staff_name: (clinicResp as any).admin_staff_name || (clinicResp as any).admin_staff_name
            };

            setClinic(mappedClinic);
        } catch (err) {
            setError('Failed to fetch clinic information. Please try again.');
            console.error('Error fetching clinic:', err);
        } finally {
            setLoading(false);
        }
    };

    // Effect to fetch clinic data whenever clinicId changes
    useEffect(() => {
        fetchClinic();
    }, [clinicId]);

    // Return the hook's state and refetch function
    return {
        clinic,
        loading,
        error,
        refetch: fetchClinic
    };
};