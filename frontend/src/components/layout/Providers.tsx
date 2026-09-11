"use client";

import type { ReactNode } from "react";
import { AuthProvider } from "@/context/AuthContext";
import { ThemeProvider } from "@/context/ThemeContext";
import { ToastProvider } from "@/components/ui/Toast";
import { AuroraBackground } from "@/components/layout/AuroraBackground";

export function Providers({ children }: { children: ReactNode }) {
  return (
    <ThemeProvider>
      <AuthProvider>
        <ToastProvider>
          <AuroraBackground />
          {children}
        </ToastProvider>
      </AuthProvider>
    </ThemeProvider>
  );
}
