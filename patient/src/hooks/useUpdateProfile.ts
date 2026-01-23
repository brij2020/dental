import { useState } from "react";
import { useProfile } from "./useProfile";
import { supabase } from "@/lib/supabaseClient";

export interface Profile {
    id: string;
    full_name: string;
    gender: string;
    date_of_birth: string | null;
    // age: number | null;
    address: string | null;
    city: string | null;
    state: string | null;
    pincode: string | null;
    contact_number: string | null;
    email: string | null;
    avatar: string | null;
    uhid: string | null;
    created_at: string | null;
    updated_at: string | null;
}

export default function useUpdateProfile() {
    const [loading, setLoading] = useState<boolean>(false);
    const { user } = useProfile();

    const updateProfile = async (updates: Partial<Profile>) => {
        try {
            setLoading(true);

            if (!user?.id) {
                setLoading(false);
                return { error: new Error("User ID is required") };
            }

            // If email is part of updates, update the Auth user first
            // if (updates.email && updates.email !== user.email) {
            //     const { error: authError } = await supabase.auth.updateUser({
            //         email: updates.email,
            //     });
            //     if (authError) {
            //         console.error("Failed to update auth email:", authError);
            //         setLoading(false);
            //         return { error: authError };
            //     }
            // }

            // Update patients table
            const { data, error } = await supabase
                .from("patients")
                .update(updates)
                .eq("id", user.id)
                .select()
                .maybeSingle();

            if (error) {
                console.error("Failed to update profile table:", error);
                setLoading(false);
                return { error };
            }
            setLoading(false);
            return { data: data ?? null };
        } catch (err) {
            console.error("updateProfile caught:", err);
            setLoading(false);
            return { error: err };
        }
    }

    return { loading, updateProfile };

}

