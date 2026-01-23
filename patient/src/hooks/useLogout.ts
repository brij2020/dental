import { supabase } from "@/lib/supabaseClient";
import { useCallback, useState } from "react";

export default function useLogout(){
    const [loading, setLoading] = useState<boolean>(false);

    const logout = useCallback(async () => {
        setLoading(true);

        try {
            const { error } = await supabase.auth.signOut();
            if (error) throw error;

            return {
                success: true,
                message: "Logged out successfully"
            }
        } catch (err) {
            let message = "Something went wrong while Logging out!";
            if (err instanceof Error) {
                message = err.message;
            } 

            return { success: false, error: message };
        } finally {
            setLoading(false);
        }
    }, [])

    return { loading, logout}
}