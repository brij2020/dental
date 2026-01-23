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
    if (!loading && !user) {
      navigate("/login");
    }
  }, [user, loading, navigate]);

  if (loading) {
    return (
      <Loading size={"100vh"}/>
    );
  }

  return (
    <>
      {children}
    </>
  );
}


