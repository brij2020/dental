// src/state/auth.tsx

import React, { useCallback, useEffect, useMemo, useState } from "react";
import { get, post, setAuthToken } from "../lib/apiClient";
import { toast } from "react-toastify";
import { AuthContext, type AppUser } from "./authContext";

const TOKEN_STATUS_CHECK_INTERVAL_MS = 60 * 1000;

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

  const applySession = (
    responseData: {
      token?: string;
      id?: string;
      email?: string;
      role?: string;
      clinic_id?: string;
      full_name?: string;
    },
    fallbackEmail?: string
  ) => {
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

  const sendMobileOtp = async (identifier: string) => {
    await post("/api/auth/send-mobile-otp", { identifier });
  };

  const loginWithMobileOtp = async (identifier: string, otp: string) => {
    setLoading(true);
    try {
      const response = await post("/api/auth/verify-mobile-otp", {
        identifier,
        otp,
      });
      applySession(response.data);
      setLoading(false);
    } catch (error) {
      setLoading(false);
      throw error;
    }
  };

  const logout = useCallback(async () => {
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
  }, []);

  const value = useMemo(
    () => ({ user, loading, login, sendMobileOtp, loginWithMobileOtp, logout }),
    [user, loading, login, sendMobileOtp, loginWithMobileOtp, logout]
  );

  useEffect(() => {
    if (!user) return;

    let canceled = false;
    const handleTokenCheck = async () => {
      if (canceled) return;
      try {
        await get("/api/auth/token-status");
        return;
      } catch (error) {
        if (canceled) return;
        const axiosError = error as {
          response?: {
            status?: number;
            data?: {
              code?: string;
            };
          };
        };
        const status = axiosError.response?.status;
        const code = axiosError.response?.data?.code;
        if (status === 401 || code === "TOKEN_EXPIRED" || code === "TOKEN_INVALID") {
          toast.warn("Session expired. Please log in again.", { autoClose: 5000, hideProgressBar: true });
          await logout();
        }
      }
    };

    handleTokenCheck();
    const intervalId = window.setInterval(handleTokenCheck, TOKEN_STATUS_CHECK_INTERVAL_MS);

    return () => {
      canceled = true;
      window.clearInterval(intervalId);
    };
  }, [user, logout]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export default AuthProvider;
