import { useState, useCallback, useEffect } from 'react';
import { supabase } from '../lib/supabaseClient';
import { useProfile } from './useProfile';
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
        if (!profile?.id) return;

        setLoading(true);
        setError(null);

        const today = new Date().toISOString().split('T')[0];
        const nowTime = new Date().toTimeString().slice(0, 5);

        try {
            const { data, error } = await supabase
                .from('appointments')
                .select(`
                    id,
                    status,
                    appointment_uid,
                    appointment_date,
                    appointment_time,
                    doctor_id,
                    clinics (
                        id,
                        name,
                        address,
                        city,
                        "State",
                        pincode,
                        contact_number,  
                        contact_name,
                        doctor_id
                    )
                `)
                .order('appointment_date')
                .order('appointment_time');

            if (error) throw error;
            if (!data) {
                setAppointments({ upcoming: [], previous: [], missed: [] });
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

            setAppointments({ upcoming, previous: sortedPrevious, missed: sortedMissed });
        } catch (err: unknown) {
            if (err instanceof Error) {
                setError(err.message);
            } else {

                setError('Failed to fetch upcoming appointments');
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
