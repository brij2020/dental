import type { ChangeEvent } from "react";

export interface BookAppointment {
    full_name: string;
    patient_id: string;
    uhid?: string;
    contact_number?: string;
    clinic_id: string;
    doctor_id: string;
    appointment_date: string; // YYYY-MM-DD format
    appointment_time?: string;
    patient_note?: string | null;
}

interface dayTime {
    end: string;
    start: string;
    is_off: boolean;
}
interface availability {
    day: string;
    evening: dayTime;
    morning: dayTime;
}

export interface Slots {
    morning: string[];
    evening: string[];
}

export interface ClinicAddress {
    street?: string;
    city?: string;
    state?: string;
    postal_code?: string;
    country?: string;
}

export interface ClinicLocation {
    floor?: string;
    room_number?: string;
    wing?: string;
    latitude?: number;
    longitude?: number;
}

export interface Clinic {
    id?: string;
    _id?: string;
    name: string;
    phone?: string;
    address?: ClinicAddress;
    city?: string;
    State?: string;
    pincode?: string;
    contact_number?: string;
    contact_name?: string;
    doctor_id?: string;
    availability?: availability[] | null;
    slot_duration_minutes?: number | null;
    location?: ClinicLocation;
    status?: string;
    clinic_id?: string;
    description?: string;
    branding_moto?: string;
    admin_staff?: string;
    admin_staff_name?: string;
    doctors?: string[];
    doctor_name?: string;
}

export interface Filters {
    state: string;
    city: string;
    pin: string;
    location: string;
    name: string;
}

export interface ValidationErrors {
    pin: string;
    name: string;
    location: string;
}

export interface StateCities {
    [key: string]: string[];
}

export interface CustomInputProps {
    value?: string;
    onClick?: () => void;
    onChange?: (e: ChangeEvent<HTMLInputElement>) => void;
    placeholder?: string;
}
