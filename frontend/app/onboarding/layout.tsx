"use client";

import type { ReactNode } from "react";
import { RequireAuth } from "@/context/AuthContext";

export default function OnboardingLayout({ children }: { children: ReactNode }) {
  return <RequireAuth>{children}</RequireAuth>;
}
