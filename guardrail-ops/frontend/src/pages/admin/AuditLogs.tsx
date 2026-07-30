import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

export function AdminLogin() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const { adminLogin } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setIsSubmitting(true);

    try {
      // 1. Wait for token & user to be stored in localStorage and context
      await adminLogin(email, password);

      // 2. Navigate via React Router WITHOUT hard-reloading the page
      navigate("/admin/dashboard", { replace: true });
    } catch (err: any) {
      setError(err.response?.data?.error || "Invalid credentials or internal server error");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#0d192b] flex items-center justify-center p-4">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-md p-8">
        <div className="mb-6 text-left">
          <span className="text-xs font-semibold tracking-wider text-teal-500 uppercase">
            GUARDRAIL-OPS
          </span>
          <h1 className="text-2xl font-bold text-slate-800 mt-1">
            Admin / Security Console
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            Restricted to authorized GuardBank staff.
          </p>
        </div>

        {error && (
          <div className="mb-4 text-sm text-red-500 bg-red-50 p-2 rounded border border-red-200">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-600 mb-1">
              Admin email
            </label>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="admin@guardbank.com"
              className="w-full px-3 py-2 border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-teal-500 text-slate-800"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-600 mb-1">
              Password
            </label>
            <input
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••••••"
              className="w-full px-3 py-2 border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-teal-500 text-slate-800"
            />
          </div>

          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full bg-[#0d192b] hover:bg-slate-800 text-white font-medium py-2.5 px-4 rounded-md transition duration-200 disabled:opacity-50 mt-2"
          >
            {isSubmitting ? "Signing in..." : "Sign in"}
          </button>
        </form>

        <div className="mt-6 text-center">
          <Link
            to="/login"
            className="text-sm text-slate-600 hover:text-slate-800 underline"
          >
            Back to customer sign in
          </Link>
        </div>
      </div>
    </div>
  );
}