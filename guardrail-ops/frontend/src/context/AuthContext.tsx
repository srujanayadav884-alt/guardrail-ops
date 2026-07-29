import { createContext, useContext, useState, useEffect, ReactNode } from "react";
import { api } from "../api/client";
import { AuthUser } from "../types";

interface AuthContextValue {
  user: AuthUser | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  adminLogin: (email: string, password: string) => Promise<void>;
  register: (fullName: string, email: string, password: string, phone?: string) => Promise<void>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const stored = localStorage.getItem("guardrail_user");
    if (stored) {
      setUser(JSON.parse(stored));
    }
    setLoading(false);
  }, []);

  function persist(token: string, user: AuthUser) {
    localStorage.setItem("guardrail_token", token);
    localStorage.setItem("guardrail_user", JSON.stringify(user));
    setUser(user);
  }

  async function login(email: string, password: string) {
    const res = await api.post("/auth/login", { email, password });
    persist(res.data.token, res.data.user);
  }

  async function adminLogin(email: string, password: string) {
    const res = await api.post("/auth/admin-login", { email, password });
    persist(res.data.token, res.data.user);
  }

  async function register(fullName: string, email: string, password: string, phone?: string) {
    const res = await api.post("/auth/register", { fullName, email, password, phone });
    persist(res.data.token, res.data.user);
  }

  function logout() {
    localStorage.removeItem("guardrail_token");
    localStorage.removeItem("guardrail_user");
    setUser(null);
  }

  return (
    <AuthContext.Provider value={{ user, loading, login, adminLogin, register, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
