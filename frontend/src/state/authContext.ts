// src/state/authContext.ts

import { createContext } from "react";

export type AppUser = {
  id: string;
  email: string;
  role: string;
  clinic_id?: string;
  full_name?: string;
};

export type AuthContextValue = {
  user: AppUser | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  sendMobileOtp: (identifier: string) => Promise<void>;
  loginWithMobileOtp: (identifier: string, otp: string) => Promise<void>;
  logout: () => Promise<void>;
};

export const AuthContext = createContext<AuthContextValue | undefined>(undefined);
