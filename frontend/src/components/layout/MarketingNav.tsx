"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { Sun, Moon, Menu, X } from "lucide-react";
import { Logo } from "@/components/ui/Logo";
import { Button } from "@/components/ui/Button";
import { useTheme } from "@/context/ThemeContext";

const links = [
  { href: "#features",    label: "Features" },
  { href: "#how-it-works", label: "How it works" },
  { href: "#matching",    label: "Smart Matching" },
  { href: "#pricing",     label: "Pricing" },
];

function ThemeToggle() {
  const { theme, toggleTheme } = useTheme();
  return (
    <button
      onClick={toggleTheme}
      aria-label="Toggle theme"
      className="grid h-8 w-8 place-items-center rounded-lg text-white/40 transition-colors hover:text-white/80"
    >
      <AnimatePresence mode="wait" initial={false}>
        <motion.span
          key={theme}
          initial={{ rotate: -90, opacity: 0 }}
          animate={{ rotate: 0, opacity: 1 }}
          exit={{ rotate: 90, opacity: 0 }}
          transition={{ duration: 0.2 }}
        >
          {theme === "dark" ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
        </motion.span>
      </AnimatePresence>
    </button>
  );
}

export function MarketingNav() {
  const nav = useRouter();
  const { theme } = useTheme();
  const [open, setOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [activeSection, setActiveSection] = useState("");

  /* Scroll detection for glass intensification */
  useEffect(() => {
    const handler = () => setScrolled(window.scrollY > 40);
    window.addEventListener("scroll", handler, { passive: true });
    return () => window.removeEventListener("scroll", handler);
  }, []);

  /* Active section detection */
  useEffect(() => {
    const sections = links.map((l) => l.href.slice(1));
    const observer = new IntersectionObserver(
      (entries) => {
        const visible = entries.find((e) => e.isIntersecting);
        if (visible) setActiveSection(visible.target.id);
      },
      { threshold: 0.4 },
    );
    sections.forEach((id) => {
      const el = document.getElementById(id);
      if (el) observer.observe(el);
    });
    return () => observer.disconnect();
  }, []);

  const scrollTo = (href: string) => {
    setOpen(false);
    const el = document.querySelector(href);
    if (el) el.scrollIntoView({ behavior: "smooth" });
  };

  return (
    <>
      <motion.header
        initial={{ y: -20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.5, ease: [0.2, 0.8, 0.2, 1] }}
        className="fixed inset-x-0 top-4 z-50 mx-auto max-w-5xl px-4 sm:px-5"
      >
        <motion.div
          animate={{
            background:
              theme === "dark"
                ? scrolled ? "rgba(0,0,0,0.92)" : "rgba(0,0,0,0.72)"
                : scrolled ? "rgba(255,255,255,0.92)" : "rgba(255,255,255,0.72)",
            borderColor:
              theme === "dark"
                ? scrolled ? "rgba(255,255,255,0.10)" : "rgba(255,255,255,0.06)"
                : scrolled ? "rgba(0,0,0,0.10)" : "rgba(0,0,0,0.06)",
            boxShadow: scrolled
              ? "0 4px 40px rgba(0,0,0,0.15), 0 0 0 1px rgba(59,130,246,0.04) inset"
              : "none",
          }}
          transition={{ duration: 0.3 }}
          className="flex items-center justify-between gap-4 rounded-2xl border px-4 py-2.5"
          style={{ backdropFilter: "blur(24px)" }}
        >
          <Link href="/" className="shrink-0">
            <Logo />
          </Link>

          {/* Desktop nav */}
          <nav className="hidden items-center gap-0.5 md:flex">
            {links.map((l) => {
              const isActive = activeSection === l.href.slice(1);
              return (
                <a
                  key={l.href}
                  href={l.href}
                  onClick={(e) => { e.preventDefault(); scrollTo(l.href); }}
                  className="relative rounded-lg px-3.5 py-2 text-sm transition-colors"
                >
                  <span className={isActive ? "text-white" : "text-white/40 hover:text-white transition-colors"}>
                    {l.label}
                  </span>
                  {isActive && (
                    <motion.span
                      layoutId="nav-active"
                      className="absolute inset-0 rounded-lg bg-white/[0.07]"
                      transition={{ type: "spring", stiffness: 380, damping: 32 }}
                    />
                  )}
                </a>
              );
            })}
          </nav>

          {/* Desktop actions */}
          <div className="hidden items-center gap-2 md:flex">
            <ThemeToggle />
            <button
              onClick={() => nav.push("/login")}
              className="rounded-lg px-3.5 py-2 text-sm text-white/40 transition-colors hover:text-white"
            >
              Log in
            </button>
            <Button variant="white" size="sm" onClick={() => nav.push("/signup")}>
              Get started →
            </Button>
          </div>

          {/* Mobile actions */}
          <div className="flex items-center gap-1 md:hidden">
            <ThemeToggle />
            <button
              onClick={() => setOpen((o) => !o)}
              aria-label="Toggle menu"
              className="grid h-8 w-8 place-items-center rounded-lg text-white/40 transition-colors hover:text-white"
            >
              <AnimatePresence mode="wait" initial={false}>
                <motion.span
                  key={open ? "x" : "menu"}
                  initial={{ rotate: -90, opacity: 0 }}
                  animate={{ rotate: 0, opacity: 1 }}
                  exit={{ rotate: 90, opacity: 0 }}
                  transition={{ duration: 0.15 }}
                >
                  {open ? <X className="h-4 w-4" /> : <Menu className="h-4 w-4" />}
                </motion.span>
              </AnimatePresence>
            </button>
          </div>
        </motion.div>
      </motion.header>

      {/* Mobile menu */}
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: -8, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -8, scale: 0.98 }}
            transition={{ duration: 0.18 }}
            className="fixed inset-x-4 top-[4.5rem] z-40 rounded-2xl border p-3 md:hidden"
            style={{
              background: theme === "dark" ? "rgba(5,5,5,0.97)" : "rgba(255,255,255,0.97)",
              borderColor: theme === "dark" ? "rgba(255,255,255,0.08)" : "rgba(0,0,0,0.08)",
              backdropFilter: "blur(24px)",
              boxShadow: theme === "dark" ? "0 8px 40px rgba(0,0,0,0.6)" : "0 8px 40px rgba(0,0,0,0.15)",
            }}
          >
            <nav className="flex flex-col">
              {links.map((l, i) => (
                <motion.a
                  key={l.href}
                  href={l.href}
                  onClick={(e) => { e.preventDefault(); scrollTo(l.href); }}
                  initial={{ opacity: 0, x: -8 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: i * 0.04 }}
                  className="rounded-xl px-4 py-3 text-sm text-white/50 transition-colors hover:bg-white/[0.04] hover:text-white"
                >
                  {l.label}
                </motion.a>
              ))}
            </nav>
            <div className="mt-3 grid grid-cols-2 gap-2 border-t border-white/[0.06] pt-3">
              <Button variant="outline" size="sm" className="w-full" onClick={() => { setOpen(false); nav.push("/login"); }}>
                Log in
              </Button>
              <Button variant="white" size="sm" className="w-full" onClick={() => { setOpen(false); nav.push("/signup"); }}>
                Get started
              </Button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
