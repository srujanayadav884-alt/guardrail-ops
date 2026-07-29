import { FormEvent, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";

export default function Login() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError("");
    setSubmitting(true);
    try {
      await login(email, password);
      navigate("/");
    } catch (err: any) {
      setError(err.response?.data?.error || "Login failed. Please try again.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-guard-navy px-4">
      <div className="w-full max-w-md rounded-xl bg-white p-8 shadow-xl">
        <p className="text-sm uppercase tracking-widest text-guard-blue">GuardRail-Ops</p>
        <h1 className="mb-6 text-2xl font-bold text-guard-navy">Sign in to GuardBank</h1>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="mb-1 block text-sm font-medium text-guard-slate">Email</label>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full rounded-md border border-slate-300 px-3 py-2 focus:border-guard-blue focus:outline-none"
            />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-guard-slate">Password</label>
            <input
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full rounded-md border border-slate-300 px-3 py-2 focus:border-guard-blue focus:outline-none"
            />
          </div>

          {error && <p className="text-sm text-guard-alert">{error}</p>}

          <button
            type="submit"
            disabled={submitting}
            className="w-full rounded-md bg-guard-blue py-2 font-medium text-white hover:bg-guard-navy disabled:opacity-60"
          >
            {submitting ? "Signing in…" : "Sign in"}
          </button>
        </form>

        <p className="mt-4 text-center text-sm text-guard-slate">
          New to GuardBank?{" "}
          <Link to="/register" className="font-medium text-guard-blue">
            Create an account
          </Link>
        </p>
        <p className="mt-2 text-center text-sm text-guard-slate">
          <Link to="/admin/login" className="text-guard-blue">
            Admin login
          </Link>
        </p>
      </div>
    </div>
  );
}
