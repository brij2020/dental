import { useState, useCallback, useEffect } from 'react';
import { useProfile } from './useProfile';
import { api } from '@/lib/apiClient';
import type { Appointment } from '@/Components/Appointments/types';


export default function useGetAppointments() {
    const { profile } = useProfile();

    const [appointments, setAppointments] = useState<{
        upcoming: Appointment[],
        previous: Appointment[],
        missed: Appointment[]
    }>({ upcoming: [], previous: [], missed: [] });
    const [loading, setLoading] = useState<boolean>(true);
    const [error, setError] = useState<string | null>(null);

    const fetchAppointments = useCallback(async () => {
        // Fetch appointments immediately without waiting for profile
        setLoading(true);
        setError(null);

        const today = new Date().toISOString().split('T')[0];
        const nowTime = new Date().toTimeString().slice(0, 5);

        try {
            console.log('📅 Fetching appointments for patient');

            // Fetch from backend API
            const response: any = await api.get('/api/appointments');

            if (response?.data) {
                // Handle both success and direct data responses
                const data = response.data?.data || response.data || [];
                console.log('✅ Appointments fetched:', data);

                if (!Array.isArray(data) || data.length === 0) {
                setAppointments({ upcoming: [], previous: [], missed: [] });
                setLoading(false);
                return;
            }

            const upcoming: Appointment[] = [];
            const previous: Appointment[] = [];
            const missed: Appointment[] = [];

            data.forEach((a: any) => {
                if (!a?.appointment_date || !a?.appointment_time) return;
                const isToday = a.appointment_date === today;
                const isFutureDate = a.appointment_date > today;
                const isPastDate = a.appointment_date < today;
                const isUpcomingTime = a.appointment_time >= nowTime;
                const isPastTime = a.appointment_time <= nowTime;

                if (
                    a.status === "scheduled" &&
                    (isFutureDate || (isToday && isUpcomingTime))
                ) {
                    upcoming.push(a);
                } else if (
                    a.status === "completed" &&
                    (isPastDate || (isToday && isPastTime))
                ) {
                    previous.push(a);
                } else if (
                    a.status === "scheduled" &&
                    (isPastDate || (isToday && isPastTime))
                ) {
                    missed.push(a);
                }
            });

            // Sort upcoming appointments (earliest first)
            const sortedUpcoming = upcoming.sort((a, b) => {
                if (!a.appointment_date || !b.appointment_date) return 0;
                const dateCompare = a.appointment_date.localeCompare(b.appointment_date);
                if (dateCompare !== 0) return dateCompare;
                if (!a.appointment_time || !b.appointment_time) return 0;
                return a.appointment_time.localeCompare(b.appointment_time);
            });

            const sortedPrevious = previous.sort((a, b) => {
                if (!a.appointment_date || !b.appointment_date) return 0;
                const dateCompare = b.appointment_date.localeCompare(a.appointment_date);
                if (dateCompare !== 0) return dateCompare;
                if (!a.appointment_time || !b.appointment_time) return 0;
                return b.appointment_time.localeCompare(a.appointment_time);
            });

            const sortedMissed = missed.sort((a, b) => {
                if (!a.appointment_date || !b.appointment_date) return 0;
                const dateCompare = b.appointment_date.localeCompare(a.appointment_date);
                if (dateCompare !== 0) return dateCompare;
                if (!a.appointment_time || !b.appointment_time) return 0;
                return b.appointment_time.localeCompare(a.appointment_time);
            });

            console.log('✅ Fetched appointments from backend:', { upcoming: sortedUpcoming.length, previous: sortedPrevious.length, missed: sortedMissed.length });
            setAppointments({ upcoming: sortedUpcoming, previous: sortedPrevious, missed: sortedMissed });
            } else {
                throw new Error('No data in response');
            }
        } catch (err: unknown) {
            console.error('❌ Failed to fetch appointments:', err);
            if (err instanceof Error) {
                setError(err.message);
            } else {
                setError('Failed to fetch appointments');
            }
        } finally {
            setLoading(false);
        }
    }, [profile?.id]);


    useEffect(() => {
        fetchAppointments();
    }, [fetchAppointments]);


    return { appointments, loading, error, refetch: fetchAppointments };
}
