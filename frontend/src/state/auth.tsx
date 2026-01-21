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

  const login = async (email: string, password: string) => {
    setLoading(true);
    try {
      const response = await post("/api/auth/login", { email, password });
      
      if (!response.data.token) {
        throw new Error("No token received from server");
      }

      const token = response.data.token;
      const userData: AppUser = {
        id: response.data.id,
        email: email,
        role: response.data.role,
        clinic_id: response.data.clinic_id,
        full_name: response.data.full_name,
      };

      // Store token and user data
      localStorage.setItem("auth_token", token);
      localStorage.setItem("user_data", JSON.stringify(userData));
      
      // Set the token for future API calls
      setAuthToken(token);
      
      // Update user state
      setUser(userData);
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
    () => ({ user, loading, login, logout }),
    [user, loading]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export default AuthProvider;
