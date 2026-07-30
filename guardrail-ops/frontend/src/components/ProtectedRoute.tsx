import { Navigate, Outlet } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

export function ProtectedRoute() {
  const { user, loading } = useAuth();
  const token = localStorage.getItem("guardrail_token");

  if (loading) {
    return <div className="min-h-screen bg-[#0d192b] text-white p-8">Loading session...</div>;
  }

  // Check both token in storage and user state
  if (!token && !user) {
    return <Navigate to="/admin/login" replace />;
  }

  return <Outlet />;
}
