"use client";

import {
  createContext,
  useContext,
  useState,
  useCallback,
  useEffect,
  type ReactNode,
} from "react";
import { useRouter, usePathname } from "next/navigation";
import { firebaseAuth, googleProvider, signInWithPopup, signOut } from "@/lib/firebase";
import { API_BASE, normalizeUser } from "@/lib/api";
import type { DevUser } from "@/types";

type Role = "member" | "admin" | "recruiter";

export type AuthUser = DevUser & { role_access: Role };

interface AuthState {
  user: AuthUser | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  signup: (name: string, email: string, password: string) => Promise<void>;
  googleSignIn: () => Promise<void>;
  logout: () => void;
  refreshUser: () => Promise<void>;
  completeOnboarding: (data: Record<string, unknown>) => Promise<void>;
}

const AuthContext = createContext<AuthState | undefined>(undefined);

async function apiFetch<T>(path: string, opts?: RequestInit): Promise<T> {
  const token = localStorage.getItem("token") ?? "";
  const res = await fetch(`${API_BASE}${path}`, {
    ...opts,
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...(opts?.headers ?? {}),
    },
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: res.statusText }));
    throw new Error((err as any).error ?? res.statusText);
  }
  return res.json() as Promise<T>;
}

function storeSession(token: string, userId: string) {
  localStorage.setItem("token", token);
  localStorage.setItem("userId", userId);
}

function clearSession() {
  localStorage.removeItem("token");
  localStorage.removeItem("userId");
}

function toAuthUser(raw: any): AuthUser {
  return {
    ...normalizeUser(raw),
    role_access: (raw.roleAccess ?? raw.role_access ?? "member") as Role,
  };
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [loading, setLoading] = useState(true);

  const refreshUser = useCallback(async () => {
    const token = localStorage.getItem("token");
    if (!token) return;
    try {
      const { user: raw } = await apiFetch<{ user: any }>("/auth/me");
      const uid = String(raw._id ?? raw.id ?? "");
      if (uid) localStorage.setItem("userId", uid);
      setUser(toAuthUser(raw));
    } catch {
      clearSession();
      setUser(null);
    }
  }, []);

  // Restore session on mount — also re-persist userId so getMyId() works after a refresh
  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) { setLoading(false); return; }
    apiFetch<{ user: any }>("/auth/me")
      .then(({ user: raw }) => {
        // Re-store userId so getMyId() returns the correct value after a page refresh
        const uid = String(raw._id ?? raw.id ?? "");
        if (uid) localStorage.setItem("userId", uid);
        setUser(toAuthUser(raw));
      })
      .catch(() => { clearSession(); })
      .finally(() => setLoading(false));
  }, []);

  const login = useCallback(async (email: string, password: string) => {
    setLoading(true);
    try {
      const { token, user: raw } = await apiFetch<{ token: string; user: any }>("/auth/login", {
        method: "POST",
        body: JSON.stringify({ email, password }),
      });
      storeSession(token, String(raw._id ?? raw.id));
      setUser(toAuthUser(raw));
    } finally {
      setLoading(false);
    }
  }, []);

  const signup = useCallback(async (name: string, email: string, password: string) => {
    setLoading(true);
    try {
      const base = name.toLowerCase().replace(/[^a-z0-9]/g, "");
      const handle = base + Math.random().toString(36).slice(2, 6);
      const { token, user: raw } = await apiFetch<{ token: string; user: any }>("/auth/register", {
        method: "POST",
        body: JSON.stringify({ name, email, password, handle }),
      });
      storeSession(token, String(raw._id ?? raw.id));
      setUser(toAuthUser(raw));
    } finally {
      setLoading(false);
    }
  }, []);

  const googleSignIn = useCallback(async () => {
    setLoading(true);
    try {
      const result = await signInWithPopup(firebaseAuth, googleProvider);
      const idToken = await result.user.getIdToken();
      const { token, user: raw } = await apiFetch<{ token: string; user: any }>("/auth/google", {
        method: "POST",
        body: JSON.stringify({ idToken }),
      });
      storeSession(token, String(raw._id ?? raw.id));
      setUser(toAuthUser(raw));
    } finally {
      setLoading(false);
    }
  }, []);

  const logout = useCallback(() => {
    clearSession();
    signOut(firebaseAuth).catch(() => {});
    setUser(null);
  }, []);

  // Account type (developer vs recruiter) is set here and drives roleAccess
  // server-side, which gates the Recruiter dashboard route. The endpoint
  // re-signs the JWT with the updated roleAccess so that gate unlocks
  // immediately, without requiring the user to log out and back in.
  const completeOnboarding = useCallback(async (data: Record<string, unknown>) => {
    const { token, user: raw } = await apiFetch<{ token: string; user: any }>("/auth/onboarding", {
      method: "POST",
      body: JSON.stringify(data),
    });
    if (token) storeSession(token, String(raw._id ?? raw.id));
    setUser(toAuthUser(raw));
  }, []);

  return (
    <AuthContext.Provider
      value={{ user, loading, login, signup, googleSignIn, logout, refreshUser, completeOnboarding }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}

export function RequireAuth({ children, role }: { children: ReactNode; role?: Role }) {
  const { user, loading } = useAuth();
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    if (loading) return;
    if (!user) {
      router.replace(`/login?from=${encodeURIComponent(pathname ?? "/dashboard")}`);
      return;
    }
    if (role && user.role_access !== role) {
      router.replace("/dashboard");
      return;
    }
    if (!user.onboardingComplete && pathname !== "/onboarding") {
      router.replace("/onboarding");
    }
  }, [loading, user, role, pathname, router]);

  if (
    loading ||
    !user ||
    (role && user.role_access !== role) ||
    (!user.onboardingComplete && pathname !== "/onboarding")
  ) {
    return (
      <div className="grid min-h-screen place-items-center">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-neon-cyan border-t-transparent" />
      </div>
    );
  }

  return <>{children}</>;
}
