import { Navigate, Outlet } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

export function ProtectedRoute() {
  const { user, loading } = useAuth();
  
  // Read token directly from storage to prevent race conditions during React state updates
  const token = localStorage.getItem("guardrail_token");
  const storedUser = localStorage.getItem("guardrail_user");

  if (loading) {
    return (
      <div className="min-h-screen bg-[#0d192b] text-white flex items-center justify-center font-mono">
        Authenticating session...
      </div>
    );
  }

  // Allow access if token exists in storage OR context user is set
  if (!token && !storedUser && !user) {
    return <Navigate to="/admin/login" replace />;
  }

  return <Outlet />;
}