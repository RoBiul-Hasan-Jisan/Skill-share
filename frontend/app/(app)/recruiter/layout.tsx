"use client";

import type { ReactNode } from "react";
import { RequireAuth } from "@/context/AuthContext";

// Nested inside app/(app)/layout.tsx, which already enforces basic auth +
// onboarding. This adds the account-type check: only accounts that chose
// "Recruiter" during onboarding (roleAccess === "recruiter") can reach the
// recruiter dashboard — developer accounts are redirected to /dashboard
// instead of hitting a 403 from the API.
export default function RecruiterLayout({ children }: { children: ReactNode }) {
  return <RequireAuth role="recruiter">{children}</RequireAuth>;
}
