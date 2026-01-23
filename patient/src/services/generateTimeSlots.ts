import type { Clinic, Slots } from "@/Components/bookAppointments/types";

const timeToMinutes = (time: string) => {
    const [h, m] = time.split(":").map(Number);
    return h * 60 + m;
};

const minutesToTime = (mins: number) => {
    const h = Math.floor(mins / 60).toString().padStart(2, "0");
    const m = (mins % 60).toString().padStart(2, "0");
    return `${h}:${m}`;
};

const generateSlotsFromRange = (start: string, end: string, step: number) => {
    const slots: string[] = [];

    let current = timeToMinutes(start);
    const endMinutes = timeToMinutes(end);

    while (current + step <= endMinutes) {
        slots.push(minutesToTime(current));
        current += step;
    }

    return slots;
};

const generateSlots = (selectedDate: Date, clinic: Clinic) => {
    const emptySlots: Slots = { morning: [], evening: [] };

    if (!selectedDate || !clinic?.availability) return emptySlots;

    const dayName = selectedDate.toLocaleDateString("en-US", { weekday: "long" });

    const step = clinic.slot_duration_minutes || 30;

    const daySchedule = clinic.availability.find(
        (d: any) => d.day === dayName
    );

    const slots: Slots = { morning: [], evening: [] };

    if (!daySchedule) {
        return slots;
    }


    if (!daySchedule.morning?.is_off) {
        slots.morning.push(...generateSlotsFromRange( daySchedule.morning.start, daySchedule.morning.end, step ));
    }

    if (!daySchedule.evening?.is_off) {
        slots.evening.push(...generateSlotsFromRange( daySchedule.evening.start, daySchedule.evening.end, step ));
    }


    // Filtering past slots if today
    
    const today = new Date();
    const isToday = selectedDate.toDateString() === today.toDateString();

    const currentMinutes =
        today.getHours() * 60 + today.getMinutes();

    if (isToday) {
        slots.morning = slots.morning.filter((slot) => {
            const mins = timeToMinutes(slot);
            return mins > currentMinutes;
        });

        slots.evening = slots.evening.filter((slot) => {
            const mins = timeToMinutes(slot);
            return mins > currentMinutes;
        });
    }

    return slots;

}

export default generateSlots;