// src/state/authContext.ts

import { createContext } from "react";

export type AppUser = {
  id: string;
  email: string;
  role: string;
  clinic_id?: string;
};

export type AuthContextValue = {
  user: AppUser | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
};

export const AuthContext = createContext<AuthContextValue | undefined>(undefined);