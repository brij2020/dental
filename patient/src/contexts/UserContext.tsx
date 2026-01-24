import { createContext, useEffect, useState } from "react";
import { api } from "@/lib/apiClient";

interface Patient {
    id: string;
    patient_id: string;
    full_name: string;
    gender?: string;
    date_of_birth?: string;
    address?: string;
    city?: string;
    state?: string;
    pincode?: string;
    contact_number?: string;
    email: string;
    avatar?: string;
    uhid: string;
    created_at?: string;
    updated_at?: string;
}

interface AuthSession {
    token: string;
    patient_id: string;
    email: string;
    full_name: string;
    uhid: string;
}

interface UserContextType {
    user: AuthSession | null;
    setUser: React.Dispatch<React.SetStateAction<AuthSession | null>>;
    profile: Patient | null;
    setProfile: React.Dispatch<React.SetStateAction<Patient | null>>;
    loading: boolean;
}

interface UserProviderProps {
    children: React.ReactNode;
}

const UserContext = createContext<UserContextType | null>(null);

const UserProvider: React.FC<UserProviderProps> = ({ children }) => {
    const [user, setUser] = useState<AuthSession | null>(null);
    const [profile, setProfile] = useState<Patient | null>(null);
    const [loading, setLoading] = useState<boolean>(true);

    const fetchProfile = async (patientId: string) => {
        try {
            console.log("📋 Fetching patient profile:", patientId);
            const response: any = await api.get(`/api/patients/${patientId}`);
            
            if (response?.data) {
                console.log("✅ Profile fetched:", response.data);
                // Handle both nested data structure and direct response
                const profileData = response.data.data || response.data;
                setProfile(profileData);
            }
        } catch (error) {
            console.error("❌ Error fetching profile:", error);
            // Continue anyway - profile is optional, user auth data is already set
        }
    };

    useEffect(() => {
        const initializeAuth = async () => {
            try {
                // Check if token exists in localStorage
                const token = localStorage.getItem('authToken') || localStorage.getItem('auth_token');
                const patient_id = localStorage.getItem('patient_id');
                const email = localStorage.getItem('patient_email');
                const full_name = localStorage.getItem('patient_name');
                const uhid = localStorage.getItem('patient_uhid');

                if (token && patient_id && email && full_name) {
                    console.log("🔐 Found existing auth session");
                    
                    // Restore user session from localStorage
                    const authSession: AuthSession = {
                        token,
                        patient_id,
                        email,
                        full_name,
                        uhid: uhid || '',
                    };
                    
                    setUser(authSession);
                    
                    // Fetch fresh profile data in background (non-blocking)
                    if (patient_id) {
                        fetchProfile(patient_id);
                    }
                } else {
                    console.log("❌ No auth session found");
                    setUser(null);
                    setProfile(null);
                }
            } catch (error) {
                console.error("❌ Error initializing auth:", error);
                setUser(null);
                setProfile(null);
            } finally {
                // Always set loading to false immediately
                setLoading(false);
            }
        };

        initializeAuth();
    }, []);

    return (
        <UserContext.Provider value={{ user, setUser, profile, setProfile, loading }}>
            {children}
        </UserContext.Provider>
    );
};

export { UserContext, UserProvider };
