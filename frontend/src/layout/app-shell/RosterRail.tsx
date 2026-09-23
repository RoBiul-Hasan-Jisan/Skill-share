"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { LogOut, Sun, Moon } from "lucide-react";
import { Logo } from "@/components/ui/Logo";
import { Avatar } from "@/components/ui/Avatar";
import { cn } from "@/lib/utils";
import { useAuth } from "@/context/AuthContext";
import { useTheme } from "@/context/ThemeContext";
import { navItems } from "./nav-items";

/** Desktop sidebar — a fixed roster of every section, current one ticked
 *  off with a tab mark rather than a soft glow pill. */
export function RosterRail({ unreadChat }: { unreadChat: number }) {
  const pathname = usePathname() ?? "";
  const router = useRouter();
  const { user, logout } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const isRecruiter = user?.role_access === "recruiter";
  const items = navItems.filter((item) => item.to !== "/recruiter" || isRecruiter);

  const handleLogout = () => { logout(); router.push("/"); };

  return (
    <aside className="sticky top-0 hidden h-screen w-64 flex-col border-r border-white/10 bg-ink-950 p-4 lg:flex">
      <div className="px-2 py-2">
        <Link href="/dashboard" className="block"><Logo /></Link>
      </div>

      <nav className="mt-6 flex flex-1 flex-col gap-0.5">
        {items.map((item, i) => {
          const isActive = pathname === item.to || pathname.startsWith(`${item.to}/`);
          const chatBadge = item.to === "/chat" && unreadChat > 0;
          return (
            <Link
              key={item.to}
              href={item.to}
              className={cn(
                "group relative flex items-center gap-3 rounded px-3 py-2.5 text-sm transition-colors",
                isActive ? "bg-white/[0.06] text-white" : "text-slate-400 hover:bg-white/[0.04] hover:text-slate-100",
              )}
            >
              {isActive && <span className="absolute left-0 h-[60%] w-0.5 bg-neon-grad" />}
              <span className="roster-index w-4 shrink-0 text-right">{i + 1}</span>
              <item.icon className="h-4 w-4 shrink-0" />
              <span className="flex-1">{item.label}</span>
              {chatBadge && (
                <span className="flex h-4 w-4 items-center justify-center rounded-full bg-neon-magenta text-[9px] font-bold text-white">
                  {unreadChat > 9 ? "9+" : unreadChat}
                </span>
              )}
            </Link>
          );
        })}
      </nav>

      <div className="mt-4 glass flex items-center gap-3 p-3 group">
        <button onClick={() => router.push("/profile")} className="shrink-0">
          <Avatar src={user?.avatar} name={user?.name ?? "You"} status="open" size={36} />
        </button>
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-semibold text-white">{user?.name}</p>
          <p className="truncate text-xs text-slate-500">@{user?.handle}</p>
        </div>
        <div className="flex items-center gap-1 opacity-0 transition-opacity group-hover:opacity-100">
          <button onClick={toggleTheme} className="grid h-7 w-7 place-items-center rounded text-slate-500 transition hover:bg-white/[0.05] hover:text-neon-cyan" title="Toggle theme">
            {theme === "dark" ? <Sun className="h-3.5 w-3.5" /> : <Moon className="h-3.5 w-3.5" />}
          </button>
          <button onClick={handleLogout} className="grid h-7 w-7 place-items-center rounded text-slate-500 transition hover:bg-white/[0.05] hover:text-neon-magenta" title="Log out">
            <LogOut className="h-3.5 w-3.5" />
          </button>
        </div>
      </div>
    </aside>
  );
}
