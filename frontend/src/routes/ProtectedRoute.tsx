import { Navigate, Outlet, useLocation } from "react-router-dom";
import { useAuth } from "../state/useAuth";

import SpinnerOverlay from "../components/SpinnerOverlay"; // ⬅️

export default function ProtectedRoute() {
  const { user, loading } = useAuth();
  const location = useLocation();

  if (loading) return <SpinnerOverlay />;

  if (!user) return <Navigate to="/login" replace state={{ from: location }} />;

  return <Outlet />;
}
