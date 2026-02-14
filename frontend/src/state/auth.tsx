// src/state/auth.tsx

import React, { useEffect, useMemo, useState } from "react";
import { post, setAuthToken } from "../lib/apiClient";
import { AuthContext, type AppUser } from "./authContext";

const AuthProvider: React.FC<React.PropsWithChildren> = ({ children }) => {
  const [user, setUser] = useState<AppUser | null>(null);
  const [loading, setLoading] = useState(true);

  // Effect 1: Restore user session from localStorage on mount
  useEffect(() => {
    const restoreSession = () => {
      const token = localStorage.getItem("auth_token");
      const userData = localStorage.getItem("user_data");
      
      if (token && userData) {
        try {
          setAuthToken(token);
          const parsedUser = JSON.parse(userData);
          setUser(parsedUser);
        } catch (error) {
          console.error("Failed to restore session:", error);
          localStorage.removeItem("auth_token");
          localStorage.removeItem("user_data");
        }
      }
      setLoading(false);
    };

    restoreSession();
  }, []);

  // Effect 2: Handles PROFILE FETCHING (on initial load, user is already complete)
  // This effect is kept for any future refetches if needed
  useEffect(() => {
    // Profile data is now included in the login response
    // No need for additional fetching
  }, [user]);

  const applySession = (responseData: any, fallbackEmail?: string) => {
    if (!responseData?.token) {
      throw new Error("No token received from server");
    }

    const token = responseData.token;
    const userData: AppUser = {
      id: responseData.id,
      email: responseData.email || fallbackEmail || "",
      role: responseData.role,
      clinic_id: responseData.clinic_id,
      full_name: responseData.full_name,
    };

    localStorage.setItem("auth_token", token);
    localStorage.setItem("user_data", JSON.stringify(userData));
    setAuthToken(token);
    setUser(userData);
  };

  const login = async (email: string, password: string) => {
    setLoading(true);
    try {
      const response = await post("/api/auth/login", { email, password });
      applySession(response.data, email);
      setLoading(false);
    } catch (error) {
      setLoading(false);
      throw error;
    }
  };

  const sendMobileOtp = async (mobileNumber: string) => {
    await post("/api/auth/send-mobile-otp", { mobile_number: mobileNumber });
  };

  const loginWithMobileOtp = async (mobileNumber: string, otp: string) => {
    setLoading(true);
    try {
      const response = await post("/api/auth/verify-mobile-otp", {
        mobile_number: mobileNumber,
        otp,
      });
      applySession(response.data);
      setLoading(false);
    } catch (error) {
      setLoading(false);
      throw error;
    }
  };

  const logout = async () => {
    setLoading(true);
    try {
      // Clear localStorage
      localStorage.removeItem("auth_token");
      localStorage.removeItem("user_data");
      
      // Clear user state
      setUser(null);
      
      // Reset auth token
      setAuthToken("");
      setLoading(false);
    } catch (error) {
      setLoading(false);
      throw error;
    }
  };

  const value = useMemo(
    () => ({ user, loading, login, sendMobileOtp, loginWithMobileOtp, logout }),
    [user, loading]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export default AuthProvider;
