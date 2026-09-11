"use client";

import type { ReactNode } from "react";
import { RequireAuth } from "@/context/AuthContext";
import { AppShell } from "@/components/layout/AppShell";

export default function AuthenticatedLayout({ children }: { children: ReactNode }) {
  return (
    <RequireAuth>
      <AppShell>{children}</AppShell>
    </RequireAuth>
  );
}
