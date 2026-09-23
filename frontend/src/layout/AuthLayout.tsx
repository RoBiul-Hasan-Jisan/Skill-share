"use client";

import type { ReactNode } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { Check } from "lucide-react";
import { Logo } from "@/components/ui/Logo";

const ROSTER_PREVIEW = [
  { name: "Priya N.", role: "Full-stack · React/Node", score: 94 },
  { name: "Marco D.", role: "ML Engineer · Python", score: 88 },
  { name: "Aiko T.", role: "Product Designer", score: 91 },
];

/** Right panel is a mock roster preview instead of a glowing blob — it
 *  shows, rather than tells, what "matched by skill" means. */
export function AuthLayout({ children, mode }: { children: ReactNode; mode: "login" | "signup" }) {
  return (
    <div className="grid min-h-screen lg:grid-cols-2">
      <div className="flex flex-col justify-center px-6 py-10 sm:px-16">
        <Link href="/" className="mb-10"><Logo /></Link>
        <motion.div
          initial={{ opacity: 0, y: 18 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="mx-auto w-full max-w-sm"
        >
          {children}
        </motion.div>
      </div>

      <div className="relative hidden flex-col justify-center gap-6 overflow-hidden border-l border-white/10 bg-ink-900 px-12 lg:flex">
        <div>
          <p className="text-xs font-medium uppercase tracking-[0.18em] text-neon-cyan/70">Current roster</p>
          <h2 className="mt-2 max-w-xs font-display text-2xl font-bold leading-tight text-white">
            {mode === "login" ? "Welcome back to your mesh." : "Join developers building together."}
          </h2>
        </div>

        <div className="glass divide-y divide-white/[0.06] p-0">
          {ROSTER_PREVIEW.map((r) => (
            <div key={r.name} className="flex items-center gap-3 px-4 py-3">
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-medium text-white">{r.name}</p>
                <p className="truncate text-xs text-slate-500">{r.role}</p>
              </div>
              <span className="font-mono text-xs text-neon-cyan/80">{r.score}</span>
            </div>
          ))}
        </div>

        <ul className="space-y-2 text-sm text-slate-400">
          {["Skill-matched collaborators", "Realtime team workspaces", "Cofounder discovery"].map((f) => (
            <li key={f} className="flex items-center gap-2">
              <Check className="h-3.5 w-3.5 text-neon-lime" /> {f}
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
