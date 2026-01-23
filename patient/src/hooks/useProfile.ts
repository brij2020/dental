import { useContext } from "react";
import { UserContext } from "@/contexts/UserContext";

export const useProfile = () => {
  const context = useContext(UserContext);
  if (!context) {
    throw new Error("useProfile must be used within a UserProvider");
  }
  return context;
};