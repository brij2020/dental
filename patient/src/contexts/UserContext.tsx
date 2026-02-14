import { createContext, useCallback, useEffect, useState } from "react";
import { api, get } from "@/lib/apiClient";
import { toast } from "react-toastify";

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
const TOKEN_STATUS_CHECK_INTERVAL_MS = 60 * 1000;

const UserProvider: React.FC<UserProviderProps> = ({ children }) => {
  const [user, setUser] = useState<AuthSession | null>(null);
  const [profile, setProfile] = useState<Patient | null>(null);
  const [loading, setLoading] = useState<boolean>(true);

  const fetchProfile = async (patientId: string) => {
    try {
      const response: any = await api.get(`/api/patients/${patientId}`);
      if (response?.data) {
        const profileData = response.data.data || response.data;
        setProfile(profileData);
      }
    } catch (error) {
      console.error("❌ Error fetching profile:", error);
    }
  };

  const clearSession = useCallback(() => {
    localStorage.removeItem("authToken");
    localStorage.removeItem("auth_token");
    localStorage.removeItem("patient_id");
    localStorage.removeItem("patient_email");
    localStorage.removeItem("patient_name");
    localStorage.removeItem("patient_uhid");
    setUser(null);
    setProfile(null);
    setLoading(false);
  }, []);

  useEffect(() => {
    const initializeAuth = async () => {
      try {
        const token = localStorage.getItem("authToken") || localStorage.getItem("auth_token");
        const patient_id = localStorage.getItem("patient_id");
        const email = localStorage.getItem("patient_email");
        const full_name = localStorage.getItem("patient_name");
        const uhid = localStorage.getItem("patient_uhid");

        if (token && patient_id && email && full_name) {
          const authSession: AuthSession = {
            token,
            patient_id,
            email,
            full_name,
            uhid: uhid || "",
          };
          setUser(authSession);
          if (patient_id) {
            fetchProfile(patient_id);
          }
        } else {
          setUser(null);
          setProfile(null);
        }
      } catch (error) {
        console.error("❌ Error initializing auth:", error);
        setUser(null);
        setProfile(null);
      } finally {
        setLoading(false);
      }
    };

    initializeAuth();
  }, []);

  useEffect(() => {
    if (!user) return;

    let canceled = false;

    const handleTokenCheck = async () => {
      if (canceled) return;

      try {
        await get("/api/auth/token-status");
      } catch (error: any) {
        if (canceled) return;
        const status = error?.response?.status;
        const code = error?.response?.data?.code;
        if (status === 401 || code === "TOKEN_EXPIRED" || code === "TOKEN_INVALID") {
          toast.warn("Session expired. Please log in again.", { autoClose: 4000, hideProgressBar: true });
          clearSession();
          window.location.href = "/login";
        }
      }
    };

    handleTokenCheck();
    const intervalId = window.setInterval(handleTokenCheck, TOKEN_STATUS_CHECK_INTERVAL_MS);

    return () => {
      canceled = true;
      window.clearInterval(intervalId);
    };
  }, [user, clearSession]);

  return (
    <UserContext.Provider value={{ user, setUser, profile, setProfile, loading }}>
      {children}
    </UserContext.Provider>
  );
};

export { UserContext, UserProvider };
