"use client";

import { Github } from "lucide-react";
import { Logo } from "@/components/ui/Logo";

const LINKS = [
  { href: "#features", label: "Features" },
  { href: "#how-it-works", label: "How it works" },
  { href: "#pricing", label: "Pricing" },
  { href: "#faq", label: "FAQ" },
];

export function Footer() {
  return (
    <footer className="border-t border-white/[0.08]">
      <div className="mx-auto flex max-w-4xl flex-col items-center justify-between gap-6 px-4 py-10 text-center sm:flex-row sm:items-start sm:px-6 sm:text-left">
        <div>
          <Logo />
          <p className="mt-2 text-xs text-white/25">Skill-based developer collaboration.</p>
        </div>

        <nav aria-label="Footer" className="flex flex-wrap justify-center gap-x-6 gap-y-2">
          {LINKS.map((l) => (
            <a key={l.href} href={l.href} className="text-xs text-white/30 transition-colors hover:text-white/60">
              {l.label}
            </a>
          ))}
        </nav>

        <div className="flex items-center gap-4">
          <a
            href="https://github.com/RoBiul-Hasan-Jisan"
            target="_blank"
            rel="noopener noreferrer"
            className="grid h-8 w-8 place-items-center rounded border border-white/[0.09] bg-white/[0.03] text-white/30 transition-colors hover:text-white/60"
            aria-label="GitHub"
          >
            <Github className="h-4 w-4" aria-hidden />
          </a>
          <p className="text-xs text-white/20">© {new Date().getFullYear()} SkillShare</p>
        </div>
      </div>
    </footer>
  );
}
