"use client";

import { useState, useEffect, useRef, useCallback, type ReactNode } from "react";
import Link from "next/link";
import { useRouter, usePathname } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import {
  LayoutDashboard, Sparkles, Users, MessageSquare, Rocket,
  CreditCard, Search, Bell, LogOut, Briefcase, Menu, X,
  UserPlus, Check, MessageCircle, MapPin, Sun, Moon, Command,
} from "lucide-react";
import { Logo } from "@/components/ui/Logo";
import { Avatar } from "@/components/ui/Avatar";
import { Badge } from "@/components/ui/Badge";
import { cn } from "@/lib/utils";
import { useAuth } from "@/context/AuthContext";
import { useTheme } from "@/context/ThemeContext";
import { api } from "@/lib/api";
import { useToast } from "@/components/ui/Toast";
import { getSocket } from "@/lib/socket";
import type { AppNotification, DevUser } from "@/types";

const nav = [
  { to: "/dashboard",   label: "Dashboard",   icon: LayoutDashboard },
  { to: "/discover",    label: "Smart Matching",  icon: Sparkles },
  { to: "/connections", label: "Connections",  icon: UserPlus },
  { to: "/chat",        label: "Chat",         icon: MessageSquare },
  { to: "/teams",       label: "Teams",        icon: Users },
  { to: "/startups",    label: "Startups",     icon: Rocket },
  { to: "/recruiter",   label: "Recruiter",    icon: Briefcase },
  // { to: "/billing",     label: "Billing",      icon: CreditCard },
];

const mobileNav = [
  { to: "/dashboard",   label: "Home",    icon: LayoutDashboard },
  { to: "/discover",    label: "Match",   icon: Sparkles },
  { to: "/connections", label: "Network", icon: UserPlus },
  { to: "/chat",        label: "Chat",    icon: MessageSquare },
  { to: "/teams",       label: "Teams",   icon: Users },
];

/* ─── Sidebar nav — outside component so React never remounts it ── */
function SidebarNav({ unreadChat, onNavigate }: { unreadChat: number; onNavigate?: () => void }) {
  const pathname = usePathname() ?? "";
  const { user } = useAuth();
  const isRecruiter = user?.role_access === "recruiter";
  const items = nav.filter((item) => item.to !== "/recruiter" || isRecruiter);
  return (
    <nav className="mt-6 flex flex-1 flex-col gap-0.5">
      {items.map((item) => {
        const isActive = pathname === item.to || pathname.startsWith(`${item.to}/`);
        const chatBadge = item.to === "/chat" && unreadChat > 0;
        return (
          <Link
            key={item.to}
            href={item.to}
            onClick={onNavigate}
            className={cn(
              "group relative flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm transition-colors duration-150",
              isActive
                ? "text-white"
                : "text-slate-400 hover:bg-white/[0.04] hover:text-slate-100",
            )}
          >
            {isActive && (
              <motion.span
                layoutId="sidebar-pill"
                className="absolute inset-0 rounded-xl bg-white/[0.07]"
                transition={{ type: "spring", stiffness: 380, damping: 32 }}
              />
            )}
            {isActive && (
              <span className="absolute left-0 h-[60%] w-0.5 rounded-r-full bg-gradient-to-b from-[#C8862E] to-[#A66A22]" />
            )}
            <span className="relative z-10 flex items-center gap-3 flex-1">
              <item.icon className="h-4 w-4 shrink-0" />
              {item.label}
              {chatBadge && (
                <span className="ml-auto flex h-4 w-4 items-center justify-center rounded-full bg-neon-magenta text-[9px] font-bold text-white">
                  {unreadChat > 9 ? "9+" : unreadChat}
                </span>
              )}
            </span>
          </Link>
        );
      })}
    </nav>
  );
}

function NotificationIcon(type: string) {
  switch (type) {
    case "connection_request": return <UserPlus className="h-4 w-4 text-neon-cyan" />;
    case "connection_accepted": return <Check className="h-4 w-4 text-neon-lime" />;
    case "message": return <MessageCircle className="h-4 w-4 text-neon-magenta" />;
    case "application": return <Rocket className="h-4 w-4 text-neon-magenta" />;
    default: return <Bell className="h-4 w-4 text-slate-400" />;
  }
}

/* ─── Page transition wrapper ────────────────────────────────────── */
const pageVariants = {
  initial: { opacity: 0, y: 10 },
  enter:   { opacity: 1, y: 0, transition: { duration: 0.2, ease: [0.22, 1, 0.36, 1] } },
};

export function AppShell({ children }: { children: ReactNode }) {
  const { user, logout } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const router = useRouter();
  const pathname = usePathname() ?? "";
  const toast = useToast();

  const [drawerOpen, setDrawerOpen] = useState(false);
  const [notifOpen, setNotifOpen] = useState(false);
  const [notifications, setNotifications] = useState<AppNotification[]>([]);
  const [unread, setUnread] = useState(0);
  const [unreadChat, setUnreadChat] = useState(0);
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<DevUser[]>([]);
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchLoading, setSearchLoading] = useState(false);
  const notifRef = useRef<HTMLDivElement>(null);
  const searchRef = useRef<HTMLDivElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);
  const searchTimer = useRef<ReturnType<typeof setTimeout>>();

  const closeDrawer = () => setDrawerOpen(false);

  /* Scroll to top on route change */
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: "instant" as ScrollBehavior });
    setDrawerOpen(false);
  }, [pathname]);

  /* Cmd+K / Ctrl+K to focus search */
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault();
        searchInputRef.current?.focus();
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, []);

  const handleSearchChange = useCallback((q: string) => {
    setSearchQuery(q);
    clearTimeout(searchTimer.current);
    if (!q.trim()) { setSearchResults([]); setSearchOpen(false); return; }
    setSearchLoading(true);
    setSearchOpen(true);
    searchTimer.current = setTimeout(async () => {
      try {
        const users = await api.searchUsers(q);
        setSearchResults(users);
      } catch { setSearchResults([]); }
      finally { setSearchLoading(false); }
    }, 280);
  }, []);

  /* Outside click — search */
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (searchRef.current && !searchRef.current.contains(e.target as Node)) setSearchOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  /* Notifications */
  useEffect(() => {
    api.notifications().then(setNotifications).catch(() => {});
    api.notificationUnreadCount().then(setUnread).catch(() => {});
  }, []);

  useEffect(() => {
    const socket = getSocket();
    if (!socket) return;
    const handler = (n: any) => {
      const notif: AppNotification = {
        id: n.id ?? String(Date.now()),
        type: n.type,
        message: n.message,
        read: false,
        fromId: n.fromId,
        fromName: n.fromName,
        fromAvatar: n.fromAvatar,
        payload: n,
        createdAt: n.createdAt ?? new Date().toISOString(),
      };
      setNotifications((prev) => [notif, ...prev]);
      setUnread((u) => u + 1);
      if (n.type === "message") setUnreadChat((c) => c + 1);
    };
    socket.on("notification:new", handler);
    return () => { socket.off("notification:new", handler); };
  }, []);

  /* Clear chat badge when user navigates to /chat */
  useEffect(() => {
    if (pathname === "/chat") setUnreadChat(0);
  }, [pathname]);

  /* Outside click — notifications */
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (notifRef.current && !notifRef.current.contains(e.target as Node)) setNotifOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const markAllRead = async () => {
    await api.markAllNotificationsRead().catch(() => {});
    setNotifications((n) => n.map((x) => ({ ...x, read: true })));
    setUnread(0);
  };

  const handleNotifClick = async (n: AppNotification) => {
    if (!n.read) {
      await api.markNotificationRead(n.id).catch(() => {});
      setNotifications((prev) => prev.map((x) => x.id === n.id ? { ...x, read: true } : x));
      setUnread((u) => Math.max(0, u - 1));
    }
    setNotifOpen(false);
    if (n.type === "connection_request" || n.type === "connection_accepted") router.push("/discover");
    else if (n.type === "message") router.push("/chat");
    else if (n.type === "application") router.push("/startups");
  };

  const handleAcceptConnection = async (n: AppNotification) => {
    const connectionId = n.payload?.connectionId;
    if (!connectionId) return;
    try {
      await api.acceptConnection(connectionId);
      setNotifications((prev) => prev.filter((x) => x.id !== n.id));
      setUnread((u) => Math.max(0, u - 1));
      toast(`Connected with ${n.fromName}!`);
      router.push("/chat");
    } catch (err: any) {
      toast(err.message ?? "Failed to accept", "error");
    }
  };

  const handleLogout = () => { logout(); router.push("/"); };

  return (
    <div className="flex min-h-screen">
      {/* ── Desktop Sidebar ── */}
      <aside className="sticky top-0 hidden h-screen w-64 flex-col border-r border-white/10 bg-ink-950 p-4 lg:flex">
        <div className="px-2 py-2">
          <Link href="/dashboard" className="block"><Logo /></Link>
        </div>

        <SidebarNav unreadChat={unreadChat} />

        {/* User card */}
        <div className="mt-4 glass flex items-center gap-3 p-3 group">
          <button onClick={() => router.push("/profile")} className="shrink-0">
            <Avatar src={user?.avatar} name={user?.name ?? "You"} status="open" size={36} />
          </button>
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-semibold text-white">{user?.name}</p>
            <p className="truncate text-xs text-slate-500">@{user?.handle}</p>
          </div>
          <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
            <button
              onClick={toggleTheme}
              className="grid h-7 w-7 place-items-center rounded-lg text-slate-500 hover:text-neon-cyan hover:bg-white/[0.05] transition"
              title="Toggle theme"
            >
              {theme === "dark" ? <Sun className="h-3.5 w-3.5" /> : <Moon className="h-3.5 w-3.5" />}
            </button>
            <button
              onClick={handleLogout}
              className="grid h-7 w-7 place-items-center rounded-lg text-slate-500 hover:text-neon-magenta hover:bg-white/[0.05] transition"
              title="Log out"
            >
              <LogOut className="h-3.5 w-3.5" />
            </button>
          </div>
        </div>
      </aside>

      {/* ── Mobile Drawer Overlay ── */}
      <AnimatePresence>
        {drawerOpen && (
          <motion.div
            key="overlay"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-40 bg-black/60 backdrop-blur-sm lg:hidden"
            onClick={closeDrawer}
          />
        )}
      </AnimatePresence>

      {/* ── Mobile Drawer Panel ── */}
      <AnimatePresence>
        {drawerOpen && (
          <motion.aside
            key="drawer"
            initial={{ x: "-100%" }}
            animate={{ x: 0 }}
            exit={{ x: "-100%" }}
            transition={{ type: "spring", damping: 28, stiffness: 280 }}
            className="fixed left-0 top-0 z-50 flex h-full w-72 flex-col border-r border-white/5 bg-ink-950 p-4 lg:hidden"
          >
            <div className="flex items-center justify-between px-2 py-2">
              <Link href="/dashboard" className="block" onClick={closeDrawer}><Logo /></Link>
              <button
                type="button"
                onClick={closeDrawer}
                className="rounded-lg p-1.5 text-slate-400 hover:text-white active:bg-white/10"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            <SidebarNav unreadChat={unreadChat} onNavigate={closeDrawer} />
            <div className="glass mt-4 flex items-center gap-3 p-3">
              <Avatar src={user?.avatar} name={user?.name ?? "You"} status="open" size={36} />
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-semibold text-white">{user?.name}</p>
                <p className="truncate text-xs text-slate-500">@{user?.handle}</p>
              </div>
              <button onClick={handleLogout} className="text-slate-500 transition hover:text-neon-magenta">
                <LogOut className="h-4 w-4" />
              </button>
            </div>
          </motion.aside>
        )}
      </AnimatePresence>

      {/* ── Main content area ── */}
      <div className="flex min-w-0 flex-1 flex-col">
        {/* Topbar */}
        <header className="sticky top-0 z-30 flex items-center gap-3 border-b border-white/10 bg-ink-950 px-4 py-3 sm:gap-4 sm:px-5">
          <button
            type="button"
            className="shrink-0 rounded-lg border border-white/10 p-2 text-slate-300 transition hover:text-white lg:hidden"
            onClick={() => setDrawerOpen(true)}
          >
            <Menu className="h-4 w-4" />
          </button>

          {/* Search */}
          <div className="relative flex-1 max-w-md" ref={searchRef}>
            <div className="flex items-center gap-2 rounded-xl border border-white/10 bg-white/[0.03] px-3 py-2 text-sm text-slate-400 focus-within:border-neon-cyan/40 transition-colors">
              <Search className="h-4 w-4 shrink-0" />
              <input
                ref={searchInputRef}
                value={searchQuery}
                onChange={(e) => handleSearchChange(e.target.value)}
                onFocus={() => searchQuery.trim() && setSearchOpen(true)}
                placeholder="Search developers, skills…"
                className="w-full bg-transparent outline-none placeholder:text-slate-500 text-white"
              />
              {searchQuery ? (
                <button onClick={() => { setSearchQuery(""); setSearchResults([]); setSearchOpen(false); }} className="text-slate-500 hover:text-white transition-colors">
                  <X className="h-3.5 w-3.5" />
                </button>
              ) : (
                <kbd className="hidden items-center gap-1 rounded border border-white/10 px-1.5 py-0.5 text-[10px] text-white/20 sm:flex">
                  <Command className="h-2.5 w-2.5" />K
                </kbd>
              )}
            </div>

            <AnimatePresence>
              {searchOpen && (
                <motion.div
                  initial={{ opacity: 0, y: -6, scale: 0.98 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: -6, scale: 0.98 }}
                  transition={{ duration: 0.12 }}
                  className="absolute left-0 right-0 top-11 z-50 overflow-hidden rounded-md border border-white/10 bg-ink-900 shadow-card"
                >
                  {searchLoading ? (
                    <div className="flex items-center justify-center gap-2 py-8 text-sm text-slate-500">
                      <span className="h-4 w-4 rounded-full border border-slate-600 border-t-neon-cyan animate-spin block" />
                      Searching…
                    </div>
                  ) : searchResults.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-8 text-sm text-slate-500">
                      <Search className="h-6 w-6 mb-2 opacity-30" />
                      No developers found
                    </div>
                  ) : (
                    <div className="max-h-80 overflow-y-auto py-2">
                      {searchResults.map((u) => (
                        <button
                          key={u.id}
                          onClick={() => { router.push(`/profile/${u.id}`); setSearchOpen(false); setSearchQuery(""); }}
                          className="flex w-full items-center gap-3 px-4 py-2.5 transition hover:bg-white/[0.05] group"
                        >
                          <Avatar src={u.avatar} name={u.name} size={36} status={u.availability} />
                          <div className="min-w-0 flex-1 text-left">
                            <p className="truncate text-sm font-medium text-white group-hover:text-neon-cyan transition-colors">{u.name}</p>
                            <p className="flex items-center gap-1 truncate text-xs text-slate-400">
                              {u.role}
                              {u.location && <><span className="text-slate-600">·</span><MapPin className="h-3 w-3" />{u.location}</>}
                            </p>
                          </div>
                          <span className="shrink-0 rounded-full border border-white/10 px-2 py-0.5 text-[10px] text-slate-400">
                            {u.trustScore}
                          </span>
                        </button>
                      ))}
                    </div>
                  )}
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Theme toggle (desktop) */}
          <button
            onClick={toggleTheme}
            className="hidden sm:grid h-8 w-8 place-items-center rounded-lg border border-white/10 text-slate-400 hover:text-white hover:border-white/20 transition shrink-0"
            title="Toggle theme"
          >
            {theme === "dark" ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
          </button>

          <Badge tone="cyan" className="hidden sm:inline-flex shrink-0">{user?.tier?.toUpperCase()} plan</Badge>

          {/* Notification Bell */}
          <div className="relative shrink-0" ref={notifRef}>
            <button
              onClick={() => { setNotifOpen(!notifOpen); if (!notifOpen && unread > 0) markAllRead(); }}
              className="relative rounded-lg border border-white/10 p-2 text-slate-300 transition hover:text-white hover:border-white/20"
            >
              <Bell className="h-4 w-4" />
              {unread > 0 && (
                <motion.span
                  key={unread}
                  initial={{ scale: 0.5 }}
                  animate={{ scale: 1 }}
                  className="absolute -right-1 -top-1 flex h-4 w-4 items-center justify-center rounded-full bg-neon-magenta text-[9px] font-bold text-white"
                >
                  {unread > 9 ? "9+" : unread}
                </motion.span>
              )}
            </button>

            <AnimatePresence>
              {notifOpen && (
                <motion.div
                  initial={{ opacity: 0, y: -8, scale: 0.97 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: -8, scale: 0.97 }}
                  transition={{ duration: 0.15 }}
                  className="absolute right-0 top-10 z-50 w-80 rounded-md border border-white/10 bg-ink-900 shadow-card"
                >
                  <div className="flex items-center justify-between border-b border-white/5 px-4 py-3">
                    <h3 className="font-semibold text-white text-sm">Notifications</h3>
                    {unread > 0 && (
                      <button onClick={markAllRead} className="text-xs text-neon-cyan hover:underline">Mark all read</button>
                    )}
                  </div>
                  <div className="max-h-80 overflow-y-auto">
                    {notifications.length === 0 ? (
                      <div className="flex flex-col items-center justify-center py-10 text-slate-500">
                        <Bell className="h-8 w-8 mb-2 opacity-20" />
                        <p className="text-sm">All caught up!</p>
                      </div>
                    ) : (
                      notifications.map((n) => (
                        <div
                          key={n.id}
                          onClick={() => handleNotifClick(n)}
                          className={cn(
                            "flex cursor-pointer items-start gap-3 px-4 py-3 transition hover:bg-white/[0.04]",
                            !n.read && "bg-neon-cyan/[0.03]",
                          )}
                        >
                          <div className="mt-0.5 shrink-0">
                            {n.fromAvatar ? (
                              <Avatar src={n.fromAvatar} name={n.fromName ?? "?"} size={32} />
                            ) : (
                              <div className="grid h-8 w-8 place-items-center rounded-full bg-white/10">
                                {NotificationIcon(n.type)}
                              </div>
                            )}
                          </div>
                          <div className="min-w-0 flex-1">
                            <p className={cn("text-sm leading-snug", n.read ? "text-slate-400" : "text-white")}>{n.message}</p>
                            <p className="text-xs text-slate-600 mt-0.5">
                              {new Date(n.createdAt).toLocaleDateString()}
                            </p>
                            {n.type === "connection_request" && n.payload?.connectionId && (
                              <div className="mt-2 flex gap-2" onClick={(e) => e.stopPropagation()}>
                                <button
                                  onClick={() => handleAcceptConnection(n)}
                                  className="rounded-lg bg-neon-cyan/20 px-2.5 py-1 text-xs text-neon-cyan hover:bg-neon-cyan/30 transition"
                                >
                                  Accept
                                </button>
                                <button
                                  onClick={async () => {
                                    await api.rejectConnection(n.payload!.connectionId).catch(() => {});
                                    setNotifications((p) => p.filter((x) => x.id !== n.id));
                                    setUnread((u) => Math.max(0, u - 1));
                                  }}
                                  className="rounded-lg bg-white/10 px-2.5 py-1 text-xs text-slate-400 hover:text-white transition"
                                >
                                  Decline
                                </button>
                              </div>
                            )}
                          </div>
                          {!n.read && (
                            <motion.div
                              initial={{ scale: 0 }}
                              animate={{ scale: 1 }}
                              className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-neon-cyan"
                            />
                          )}
                        </div>
                      ))
                    )}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          <Link href="/profile" className="shrink-0 rounded-full ring-2 ring-transparent hover:ring-neon-cyan/30 transition">
            <Avatar src={user?.avatar} name={user?.name ?? "You"} size={36} />
          </Link>
        </header>

        {/* Page content with fade-in transitions (no exit animation — avoids React Router Outlet conflicts) */}
        <main className="min-w-0 flex-1 p-4 pb-24 sm:p-5 lg:p-8 lg:pb-8">
          <motion.div
            key={pathname}
            variants={pageVariants}
            initial="initial"
            animate="enter"
          >
            {children}
          </motion.div>
        </main>
      </div>

      {/* ── Mobile Bottom Nav ── */}
      <nav className="fixed bottom-0 left-0 right-0 z-30 flex border-t border-white/10 bg-ink-950 lg:hidden">
        {mobileNav.map((item) => {
          const isActive = pathname === item.to || pathname.startsWith(`${item.to}/`);
          const chatBadge = item.to === "/chat" && unreadChat > 0;
          return (
            <Link
              key={item.to}
              href={item.to}
              className="relative flex flex-1 flex-col items-center justify-center gap-1 py-3 text-[10px] font-medium transition-colors"
            >
              {isActive && (
                <motion.span
                  layoutId="mobile-tab-indicator"
                  className="absolute inset-x-2 top-0 h-0.5 rounded-b-full bg-gradient-to-r from-[#C8862E] to-[#A66A22]"
                  transition={{ type: "spring", stiffness: 380, damping: 32 }}
                />
              )}
              <span className={cn("relative transition-colors", isActive ? "text-neon-cyan" : "text-slate-500 hover:text-slate-300")}>
                <item.icon className="h-5 w-5" />
                {chatBadge && (
                  <span className="absolute -right-1 -top-1 flex h-3.5 w-3.5 items-center justify-center rounded-full bg-neon-magenta text-[8px] font-bold text-white">
                    {unreadChat > 9 ? "9+" : unreadChat}
                  </span>
                )}
              </span>
              <span className={cn("transition-colors", isActive ? "text-neon-cyan" : "text-slate-500")}>
                {item.label}
              </span>
            </Link>
          );
        })}
      </nav>
    </div>
  );
}
