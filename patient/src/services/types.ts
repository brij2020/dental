/**
 * Represents a dental professional in the system
 */
export interface Dentist {
  id: string;                 // Unique identifier for the dentist
  name: string;               // Full name of the dentist
  specialization: string;     // Dental specialty (e.g., Orthodontist, Periodontist)
  experience: number;         // Years of professional experience
  image?: string;             // Optional URL to the dentist's profile image
  isDefault?: boolean;        // Optional flag to mark as a default dentist
  isAvailable: boolean;       // Indicates if the dentist is currently accepting appointments
}

/**
 * Represents clinic reviews
 */
export interface Review {
  username: string;  
  profile: string;         
  rating: number; 
  review: string; 
}

/**
 * Represents a dental clinic 
 */
export interface Clinic {
  id: string;                 // Unique identifier for the clinic
  name: string;               // Name of the dental clinic
  address: string;            // Physical address of the clinic
  phone: string;              // Contact phone number
  email?: string;             // Optional contact email address
  rating: number;             // Clinic rating (likely out of 5)
  dentists: Dentist[];        // Array of dentists working at this clinic
  operatingHours: {           // Clinic business hours
    open: string;             // Opening time (format: HH:MM)
    close: string;            // Closing time (format: HH:MM)
    days: string[];           // Days of the week the clinic operates
  };
  reviews: Review[];
}

/**
 * Data required to schedule a dental appointment
 */
export interface AppointmentData {
  clinicId: string;           // ID of the selected clinic
  dentistId: string;          // ID of the selected dentist
  selectedDate: Date | null;  // Chosen appointment date
  selectedTimeSlot: string | null; // Chosen time slot (format: HH:MM)
}