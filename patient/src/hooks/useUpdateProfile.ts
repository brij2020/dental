import { useState } from "react";
import { useProfile } from "./useProfile";
import { api } from "@/lib/apiClient";

export interface Profile {
    id?: string;
    patient_id?: string;
    full_name?: string;
    gender?: string;
    date_of_birth?: string | null;
    address?: string | null;
    city?: string | null;
    state?: string | null;
    pincode?: string | null;
    contact_number?: string | null;
    email?: string | null;
    avatar?: string | null;
    uhid?: string | null;
    created_at?: string | null;
    updated_at?: string | null;
}

export default function useUpdateProfile() {
    const [loading, setLoading] = useState<boolean>(false);
    const { user } = useProfile();

    const updateProfile = async (updates: Partial<Profile>) => {
        try {
            setLoading(true);
            console.log("🔄 Updating profile with patient_id:", user?.patient_id);

            // Validate patient ID before proceeding
            if (!user?.patient_id) {
                setLoading(false);
                const error = new Error("Patient ID is required. Please log in again.");
                console.error(error.message);
                return { 
                    success: false,
                    error,
                    data: null
                };
            }

            // Update patient profile via central axios client
            const response = await api.put(`/api/patients/${user.patient_id}`, updates);

            if (!response.success) {
                const errorMessage = 'error' in response ? response.error : 'Failed to update profile';
                console.error("Failed to update profile:", response);
                setLoading(false);
                const error = new Error(errorMessage);
                return { 
                    success: false,
                    error,
                    data: null
                };
            }

            setLoading(false);
            const responseData = 'data' in response ? response.data?.data : null;
            return { 
                success: true,
                data: responseData ?? null,
                error: null
            };
        } catch (err) {
            console.error("updateProfile caught:", err);
            setLoading(false);
            const error = err instanceof Error ? err : new Error('Unknown error occurred');
            return { 
                success: false,
                error,
                data: null
            };
        }
    }

    return { loading, updateProfile };

}

