export function getAppointmentCountdown(appointment_date: string, appointment_time: string) {
    if(!appointment_date || !appointment_time){
        return;
    }
    const now = new Date();
    const appointmentDateTime = new Date(`${appointment_date}T${appointment_time}`);

    const today = now.toISOString().split("T")[0];

    if (appointment_date > today) {
        const diffMs = appointmentDateTime.getTime() - now.getTime();
        const days = Math.ceil(diffMs / (1000 * 60 * 60 * 24));

        return {
            type: "days",
            days,
        };
    }

    if (appointment_date === today) {
        const diffMs = appointmentDateTime.getTime() - now.getTime();

        const hours = Math.floor(diffMs / (1000 * 60 * 60));
        const minutes = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));

        return {
            type: "time",
            hours,
            minutes,
        };
    }

    return null;
}
