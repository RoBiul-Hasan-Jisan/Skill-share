"use client";

import { useState, useEffect, useCallback, type ReactNode } from "react";
import { usePathname } from "next/navigation";
import { motion } from "framer-motion";
import { Header } from "./Header";
import { BottomTabs } from "./MobileNav";

const pageVariants = {
  initial: { opacity: 0, y: 10 },
  enter: { opacity: 1, y: 0, transition: { duration: 0.2, ease: [0.22, 1, 0.36, 1] as const } },
};

/** App shell — a single horizontal header (logo, roster tabs, search,
 *  utilities) and full-width content below it. No sidebar, no drawer:
 *  the entire skeleton is header + content + (on mobile) a bottom tab
 *  bar, which is a different page shape from a fixed side rail. */
export function AppShell({ children }: { children: ReactNode }) {
  const pathname = usePathname() ?? "";
  const [unreadChat, setUnreadChat] = useState(0);

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: "instant" as ScrollBehavior });
  }, [pathname]);

  useEffect(() => {
    if (pathname === "/chat") setUnreadChat(0);
  }, [pathname]);

  const bumpUnreadChat = useCallback(() => setUnreadChat((c) => c + 1), []);

  return (
    <div className="min-h-screen bg-ink-950">
      <Header unreadChat={unreadChat} bumpUnreadChat={bumpUnreadChat} />
      <main className="mx-auto max-w-6xl px-4 pb-24 pt-5 sm:px-6 lg:pb-8">
        <motion.div key={pathname} variants={pageVariants} initial="initial" animate="enter">
          {children}
        </motion.div>
      </main>
      <BottomTabs unreadChat={unreadChat} />
    </div>
  );
}
