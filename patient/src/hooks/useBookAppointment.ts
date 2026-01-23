import { useState, useCallback } from 'react';
import type { BookAppointment } from '@/Components/bookAppointments/types';
import axios from 'axios';
import { supabase } from '@/lib/supabaseClient';

export default function useBookAppointment() {
    const [loading, setLoading] = useState<boolean>(false);

    const bookAppointment = useCallback(async (appointment: BookAppointment) => {
        setLoading(true);

        try {
            const { data: { session } } = await supabase.auth.getSession();
            const token = session?.access_token;

            const { data } = await axios.post(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/book-appointment`,
                appointment,
                {
                    headers: {
                        Authorization: `Bearer ${token}`,
                        'Content-Type': 'application/json',
                    }
                }
            )


            if (data && data?.error) {
                return { success: false, error: data.error };
            }

            return {
                success: true,
                data,
                message: data?.message ?? 'Appointment booked successfully',
            };
        } catch (err: unknown) {
            let message = 'Failed to book appointment';

            if (axios.isAxiosError(err)) {
                message = err.response?.data?.error || err.response?.data?.message || err.message || message;
            } else if (err instanceof Error) {
                message = err.message;
            }

            return { success: false, error: message };

        } finally {
            setLoading(false);
        }
    }, []);

    return { loading, bookAppointment };
}
