import { useState, useCallback } from 'react';
import type { BookAppointment } from '@/Components/bookAppointments/types';
import { api } from '@/lib/apiClient';

export default function useBookAppointment() {
    const [loading, setLoading] = useState<boolean>(false);

    const bookAppointment = useCallback(async (appointment: BookAppointment) => {
        setLoading(true);

        try {
            // Log the appointment data being sent
            console.log('📋 Booking appointment with data:', appointment);

            // Ensure bookings from patient portal are marked provisional
            const payload = Object.assign({}, appointment, { provisional: true });
            // Call backend API through centralized axios client
            const response: any = await api.post('/api/appointments', payload);

            console.log('✅ Appointment booking response:', response);

            if (!response.success) {
                return { success: false, error: response.error || 'An error occurred' };
            }

            return {
                success: true,
                data: response.data || {},
                message: response.data?.message ?? 'Appointment booked successfully',
            };
        } catch (err: unknown) {

            let message = 'Failed to book appointment';

            if (err instanceof Error) {
                message = err.message;
            }

            return { success: false, error: message };

        } finally {
            setLoading(false);
        }
    }, []);

    return { loading, bookAppointment };
}
