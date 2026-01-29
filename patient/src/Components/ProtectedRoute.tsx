import { useEffect, type ReactNode } from "react";
import { useNavigate } from "react-router-dom";
import { useProfile } from "@/hooks/useProfile";
import Loading from "@/Components/Loading";

type ProtectedRouteProps = {
  children: ReactNode;
};


export default function ProtectedRoute({ children }: ProtectedRouteProps) {
  const navigate = useNavigate();
  const { user, loading } = useProfile();

  useEffect(() => {
    // Only redirect if loading is complete AND there's no user
    // This ensures we wait for UserContext to initialize from localStorage
    if (!loading && !user) {
      navigate("/login", { replace: true });
    }
    
  }, [user, loading, navigate]);

  if (loading) {
    return (
      <Loading size={"100vh"}/>
    );
  }

  // If not loading and user exists, render children
  if (user) {
    return (
      <>
        {children}
      </>
    );
  }

  // This should not happen due to the useEffect redirect, but as a fallback
  return null;
}


