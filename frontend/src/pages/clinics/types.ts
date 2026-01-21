/**
 * Clinic Types and Interfaces
 */

export interface Address {
  street: string;
  city: string;
  state: string;
  postal_code: string;
  country: string;
}

export interface Location {
  latitude: number;
  longitude: number;
}

export interface ClinicAdminProfile {
  email: string;
  mobile_number: string;
  password?: string;
  full_name: string;
  clinic_id?: string;
  role: "admin";
  status: "Active" | "Inactive";
  slot_duration_minutes: number;
  profile_pic?: string;
  education?: string[];
  years_of_experience?: number;
  specialization?: string[];
  bio?: string;
  availability?: {
    [key: string]: string[];
  };
}

export interface CreateClinicRequest {
  name: string;
  phone: string;
  address: Address;
  logo?: string;
  branding_moto: string;
  location: Location;
  description: string;
  status: "Active" | "Inactive";
  adminProfile: ClinicAdminProfile;
}

export interface Clinic {
  id?: string;
  _id?: string;
  name: string;
  phone: string;
  address: Address;
  clinic_id?: string;
  logo?: string;
  branding_moto: string;
  location: Location;
  description: string;
  status: "Active" | "Inactive";
  created_at?: string;
  updated_at?: string;
  clinic_logo_path?: string;
}

export interface AdminProfile {
  _id?: string;
  email: string;
  mobile_number: string;
  full_name: string;
  clinic_id: string;
  role: "admin";
  status: "Active" | "Inactive";
  slot_duration_minutes: number;
  profile_pic?: string;
  education?: string[];
  years_of_experience?: number;
  specialization?: string[];
  bio?: string;
  availability?: {
    [key: string]: string[];
  };
  created_at?: string;
  updated_at?: string;
}

export interface CreateClinicResponse {
  clinic: Clinic;
  admin: AdminProfile;
}

export interface DefaultClinicStructure extends CreateClinicRequest {
  // Extends the request with any additional properties that may be needed
}

/**
 * Sample Default Clinic Data
 */
export const defaultClinicData: DefaultClinicStructure = {
  name: "Apollo Dental Clinic",
  phone: "9876543210",
  address: {
    street: "123 Main Street",
    city: "Mumbai",
    state: "Maharashtra",
    postal_code: "400001",
    country: "India",
  },
  logo: "https://example.com/logo.png",
  branding_moto: "Your Smile is Our Priority",
  location: {
    latitude: 19.076,
    longitude: 72.8777,
  },
  description: "Leading dental clinic providing comprehensive dental care",
  status: "Active",
  adminProfile: {
    email: "dr.mohit@example.com",
    mobile_number: "9876543223",
    password: "Doctor@123",
    full_name: "Dr Mohit Sharma",
    role: "admin",
    status: "Active",
    slot_duration_minutes: 20,
    profile_pic: "https://cdn.example.com/doctors/rahul.jpg",
    education: ["MBBS - AIIMS Delhi", "MD (Cardiology) - PGIMER"],
    years_of_experience: 12,
    specialization: ["Cardiology", "Heart Failure"],
    bio: "Dr Mohit Sharma is a senior cardiologist with 12+ years of experience.",
    availability: {
      monday: ["09:00-12:00", "17:00-20:00"],
      tuesday: ["10:00-14:00"],
      thursday: ["09:00-13:00"],
    },
  },
};
