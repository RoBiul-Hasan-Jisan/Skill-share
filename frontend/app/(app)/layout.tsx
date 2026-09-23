"use client";

import type { ReactNode } from "react";
import { RequireAuth } from "@/context/AuthContext";
import { AppShell } from "@/layout/app-shell";

export default function AuthenticatedLayout({ children }: { children: ReactNode }) {
  return (
    <RequireAuth>
      <AppShell>{children}</AppShell>
    </RequireAuth>
  );
}
