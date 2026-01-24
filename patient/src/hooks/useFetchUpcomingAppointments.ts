import { useState, useCallback, useEffect } from 'react';
import { api } from '@/lib/apiClient';

export interface Appointment {
    _id?: string;
    appointment_uid?: string;
    patient_id?: string;
    clinic_id?: string;
    doctor_id?: string;
    appointment_date: string;
    appointment_time: string;
    status?: string;
    full_name?: string;
    contact_number?: string;
    uhid?: string;
    patient_note?: string;
    created_at?: string;
}

export function useFetchUpcomingAppointments(patientId?: string) {
    const [appointments, setAppointments] = useState<Appointment[]>([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const fetchAppointments = useCallback(async () => {
        if (!patientId) {
            setError('Patient ID is required');
            return;
        }

        setLoading(true);
        setError(null);

        try {
            console.log('📅 Fetching upcoming appointments for patient:', patientId);

            // Construct query parameters
            const queryParams = new URLSearchParams({
                patient_id: patientId,
                status: 'scheduled', // Only get scheduled appointments
            });

            const response: any = await api.get(`/api/appointments?${queryParams.toString()}`);

            console.log('✅ Appointments response:', response);

            if (!response.success) {
                setError(response.error || 'Failed to fetch appointments');
                return;
            }

            // Filter for upcoming appointments (today and future)
            const today = new Date();
            today.setHours(0, 0, 0, 0);

            const upcomingAppointments = (response.data?.data || response.data || [])
                .filter((apt: Appointment) => {
                    const aptDate = new Date(apt.appointment_date);
                    aptDate.setHours(0, 0, 0, 0);
                    return aptDate >= today;
                })
                .sort((a: Appointment, b: Appointment) => {
                    const dateA = new Date(`${a.appointment_date} ${a.appointment_time}`);
                    const dateB = new Date(`${b.appointment_date} ${b.appointment_time}`);
                    return dateA.getTime() - dateB.getTime();
                });

            setAppointments(upcomingAppointments);
            console.log('📋 Filtered upcoming appointments:', upcomingAppointments.length);
        } catch (err: unknown) {
            let message = 'Failed to fetch appointments';
            if (err instanceof Error) {
                message = err.message;
            }
            console.error('❌ Error fetching appointments:', message);
            setError(message);
        } finally {
            setLoading(false);
        }
    }, [patientId]);

    // Auto-fetch when patientId changes
    useEffect(() => {
        if (patientId) {
            fetchAppointments();
        }
    }, [patientId, fetchAppointments]);

    return { appointments, loading, error, refetch: fetchAppointments };
}
