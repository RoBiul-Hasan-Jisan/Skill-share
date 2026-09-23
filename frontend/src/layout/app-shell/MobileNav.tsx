"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { mobileNavItems } from "./nav-items";

/** Mobile-only bottom tab bar. There is no drawer or rail anywhere in this
 *  shell — on small screens this bar plus the header's "More" menu is the
 *  entire navigation surface. */
export function BottomTabs({ unreadChat }: { unreadChat: number }) {
  const pathname = usePathname() ?? "";
  return (
    <nav className="fixed bottom-0 left-0 right-0 z-30 flex border-t border-white/10 bg-ink-950 lg:hidden">
      {mobileNavItems.map((item) => {
        const isActive = pathname === item.to || pathname.startsWith(`${item.to}/`);
        const chatBadge = item.to === "/chat" && unreadChat > 0;
        return (
          <Link key={item.to} href={item.to} className="relative flex flex-1 flex-col items-center justify-center gap-1 py-3 text-[10px] font-medium transition-colors">
            {isActive && <span className="absolute inset-x-2 top-0 h-0.5 bg-neon-grad" />}
            <span className={cn("relative transition-colors", isActive ? "text-neon-cyan" : "text-slate-500 hover:text-slate-300")}>
              <item.icon className="h-5 w-5" />
              {chatBadge && (
                <span className="absolute -right-1 -top-1 flex h-3.5 w-3.5 items-center justify-center rounded-full bg-neon-magenta text-[8px] font-bold text-white">
                  {unreadChat > 9 ? "9+" : unreadChat}
                </span>
              )}
            </span>
            <span className={cn("transition-colors", isActive ? "text-neon-cyan" : "text-slate-500")}>{item.label}</span>
          </Link>
        );
      })}
    </nav>
  );
}
