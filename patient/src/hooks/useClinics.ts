import { useState, useCallback, useEffect } from 'react';
import type { Clinic } from '@/Components/bookAppointments/types';
import * as clinicService from '@/services/clinicService';

export default function useClinics() {
    const [clinics, setClinics] = useState<Clinic[]>([]);
    const [loading, setLoading] = useState<boolean>(true);
    const [error, setError] = useState<string | null>(null);

    const fetchClinics = useCallback(async () => {
        setLoading(true);
        setError(null);
        try {
            // Fetch clinics from MongoDB via the dental backend API
            const fetchedClinics = await clinicService.fetchAllClinics();

            // Transform the API response to match the Clinic type
            const transformedClinics = fetchedClinics.map((clinic: any) => ({
                id: clinic.id || clinic._id,
                _id: clinic._id,
                name: clinic.name,
                phone: clinic.phone,
                address: {
                    street: clinic.address?.street || '',
                    city: clinic.address?.city || '',
                    state: clinic.address?.state || '',
                    postal_code: clinic.address?.postal_code || '',
                    country: clinic.address?.country || ''
                },
                location: {
                    floor: clinic.location?.floor || '',
                    room_number: clinic.location?.room_number || '',
                    wing: clinic.location?.wing || '',
                    latitude: clinic.location?.latitude || 0,
                    longitude: clinic.location?.longitude || 0
                },
                description: clinic.description || '',
                status: clinic.status || 'Active',
                clinic_id: clinic.clinic_id,
                logo: clinic.logo,
                branding_moto: clinic.branding_moto,
                // Preserve original fields for flexibility
                ...clinic
            }));

            setClinics(transformedClinics);
            console.log('Clinics fetched:', transformedClinics);

        } catch (err: unknown) {
            if (err instanceof Error) {
                setError(err.message);
            } else {
                setError('Failed to fetch clinics');
            }
            console.error('Error fetching clinics:', err);
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchClinics();
    }, [fetchClinics]);

    return { clinics, loading, error, refetch: fetchClinics };
}
