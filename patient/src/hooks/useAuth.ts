import { createContext, useContext } from "react";
type User = {
  id: string;
  name: string;
};

type authContextType = {
  isLoggedIn: boolean;
  user?: User | null;
  login: () => void;
  logout: () => void;
};
export const authenticationContext = createContext<authContextType | null>(null);

export function useAuthentication() {
  const context = useContext(authenticationContext);
  if (!context)
    throw new Error("authentication context used outside its scope");
  return context;
}