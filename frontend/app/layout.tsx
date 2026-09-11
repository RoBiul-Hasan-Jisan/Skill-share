import type { Metadata } from "next";
import type { ReactNode } from "react";
import { Providers } from "@/components/layout/Providers";
import "./globals.css";

export const metadata: Metadata = {
  title: "SkillShare — Find your dev team",
  description:
    "SkillShare is a developer collaboration platform for skill-based teammate and cofounder matching, team chat, and trust scoring.",
  icons: {
    icon: "/logo.svg",
    shortcut: "/logo.svg",
  },
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <body>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
