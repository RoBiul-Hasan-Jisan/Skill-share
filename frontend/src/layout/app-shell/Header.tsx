"use client";

import { useState, useRef, useEffect } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { AnimatePresence, motion } from "framer-motion";
import {
  Search, Bell, X, MapPin, Sun, Moon, Command, MoreHorizontal,
  UserPlus, Check, MessageCircle, Rocket, LogOut,
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
import { navItems } from "./nav-items";

function notifIcon(type: string) {
  switch (type) {
    case "connection_request": return <UserPlus className="h-4 w-4 text-neon-cyan" />;
    case "connection_accepted": return <Check className="h-4 w-4 text-neon-lime" />;
    case "message": return <MessageCircle className="h-4 w-4 text-neon-magenta" />;
    case "application": return <Rocket className="h-4 w-4 text-neon-magenta" />;
    default: return <Bell className="h-4 w-4 text-slate-400" />;
  }
}

/** Single horizontal masthead — logo, a row of roster tabs, search, and
 *  utilities all in one bar. No side rail, no slide-out drawer: on narrow
 *  screens the tab row scrolls and a compact "More" panel covers anything
 *  that doesn't fit the bottom tab bar. This is the whole nav skeleton. */
export function Header({ unreadChat, bumpUnreadChat }: { unreadChat: number; bumpUnreadChat: () => void }) {
  const pathname = usePathname() ?? "";
  const router = useRouter();
  const { user, logout } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const toast = useToast();
  const isRecruiter = user?.role_access === "recruiter";
  const items = navItems.filter((item) => item.to !== "/recruiter" || isRecruiter);

  const [moreOpen, setMoreOpen] = useState(false);
  const [notifOpen, setNotifOpen] = useState(false);
  const [notifications, setNotifications] = useState<AppNotification[]>([]);
  const [unread, setUnread] = useState(0);
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<DevUser[]>([]);
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchExpanded, setSearchExpanded] = useState(false);
  const [searchLoading, setSearchLoading] = useState(false);
  const moreRef = useRef<HTMLDivElement>(null);
  const notifRef = useRef<HTMLDivElement>(null);
  const searchRef = useRef<HTMLDivElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);
  const searchTimer = useRef<ReturnType<typeof setTimeout>>();

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault();
        setSearchExpanded(true);
        setTimeout(() => searchInputRef.current?.focus(), 0);
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, []);

  const handleSearchChange = (q: string) => {
    setSearchQuery(q);
    clearTimeout(searchTimer.current);
    if (!q.trim()) { setSearchResults([]); setSearchOpen(false); return; }
    setSearchLoading(true);
    setSearchOpen(true);
    searchTimer.current = setTimeout(async () => {
      try { setSearchResults(await api.searchUsers(q)); }
      catch { setSearchResults([]); }
      finally { setSearchLoading(false); }
    }, 280);
  };

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (searchRef.current && !searchRef.current.contains(e.target as Node)) {
        setSearchOpen(false);
        if (!searchQuery) setSearchExpanded(false);
      }
      if (moreRef.current && !moreRef.current.contains(e.target as Node)) setMoreOpen(false);
      if (notifRef.current && !notifRef.current.contains(e.target as Node)) setNotifOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [searchQuery]);

  useEffect(() => {
    api.notifications().then(setNotifications).catch(() => {});
    api.notificationUnreadCount().then(setUnread).catch(() => {});
  }, []);

  useEffect(() => {
    const socket = getSocket();
    if (!socket) return;
    const handler = (n: any) => {
      const notif: AppNotification = {
        id: n.id ?? String(Date.now()), type: n.type, message: n.message, read: false,
        fromId: n.fromId, fromName: n.fromName, fromAvatar: n.fromAvatar, payload: n,
        createdAt: n.createdAt ?? new Date().toISOString(),
      };
      setNotifications((prev) => [notif, ...prev]);
      setUnread((u) => u + 1);
      if (n.type === "message") bumpUnreadChat();
    };
    socket.on("notification:new", handler);
    return () => { socket.off("notification:new", handler); };
  }, [bumpUnreadChat]);

  const markAllRead = async () => {
    await api.markAllNotificationsRead().catch(() => {});
    setNotifications((n) => n.map((x) => ({ ...x, read: true })));
    setUnread(0);
  };

  const handleNotifClick = async (n: AppNotification) => {
    if (!n.read) {
      await api.markNotificationRead(n.id).catch(() => {});
      setNotifications((prev) => prev.map((x) => (x.id === n.id ? { ...x, read: true } : x)));
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
    <header className="sticky top-0 z-30 border-b border-white/10 bg-ink-950">
      <div className="mx-auto flex max-w-6xl items-center gap-3 px-4 py-2.5 sm:gap-4 sm:px-6">
        <Link href="/dashboard" className="shrink-0"><Logo withWord={false} /></Link>

        {/* Horizontal roster tabs — replaces the sidebar entirely */}
        <nav className="hidden min-w-0 flex-1 items-center gap-0.5 overflow-x-auto lg:flex">
          {items.map((item, i) => {
            const isActive = pathname === item.to || pathname.startsWith(`${item.to}/`);
            const chatBadge = item.to === "/chat" && unreadChat > 0;
            return (
              <Link
                key={item.to}
                href={item.to}
                className={cn(
                  "group relative flex shrink-0 items-center gap-1.5 rounded px-2.5 py-1.5 text-[13px] font-medium transition-colors",
                  isActive ? "text-white" : "text-slate-400 hover:text-slate-100",
                )}
              >
                {item.label}
                {isActive && <span className="absolute inset-x-1.5 -bottom-[11px] h-0.5 bg-neon-grad" />}
                {chatBadge && (
                  <span className="flex h-3.5 w-3.5 items-center justify-center rounded-full bg-neon-magenta text-[8px] font-bold text-white">
                    {unreadChat > 9 ? "9+" : unreadChat}
                  </span>
                )}
              </Link>
            );
          })}
        </nav>

        <div className="flex-1 lg:hidden" />

        {/* Search */}
        <div className="relative shrink-0" ref={searchRef}>
          <AnimatePresence initial={false}>
            {searchExpanded ? (
              <motion.div
                initial={{ width: 36, opacity: 0.6 }} animate={{ width: 240, opacity: 1 }} exit={{ width: 36, opacity: 0.6 }}
                transition={{ duration: 0.18 }}
                className="flex items-center gap-2 overflow-hidden rounded border border-white/10 bg-white/[0.03] px-2.5 py-1.5 focus-within:border-neon-cyan/40"
              >
                <Search className="h-3.5 w-3.5 shrink-0 text-slate-400" />
                <input
                  ref={searchInputRef}
                  value={searchQuery}
                  onChange={(e) => handleSearchChange(e.target.value)}
                  onFocus={() => searchQuery.trim() && setSearchOpen(true)}
                  placeholder="Search…"
                  className="w-full min-w-0 bg-transparent text-sm text-white outline-none placeholder:text-slate-500"
                />
                <button onClick={() => { setSearchQuery(""); setSearchResults([]); setSearchOpen(false); setSearchExpanded(false); }} className="shrink-0 text-slate-500 hover:text-white">
                  <X className="h-3.5 w-3.5" />
                </button>
              </motion.div>
            ) : (
              <button
                onClick={() => { setSearchExpanded(true); setTimeout(() => searchInputRef.current?.focus(), 0); }}
                className="grid h-9 w-9 place-items-center rounded border border-white/10 text-slate-300 transition hover:border-white/20 hover:text-white"
                title="Search (⌘K)"
              >
                <Search className="h-4 w-4" />
              </button>
            )}
          </AnimatePresence>

          <AnimatePresence>
            {searchOpen && (
              <motion.div
                initial={{ opacity: 0, y: -6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -6 }}
                transition={{ duration: 0.12 }}
                className="absolute right-0 top-11 z-50 w-80 overflow-hidden rounded-md border border-white/10 bg-ink-900 shadow-card"
              >
                {searchLoading ? (
                  <div className="flex items-center justify-center gap-2 py-8 text-sm text-slate-500">
                    <span className="block h-4 w-4 animate-spin rounded-full border border-slate-600 border-t-neon-cyan" /> Searching…
                  </div>
                ) : searchResults.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-8 text-sm text-slate-500">
                    <Search className="mb-2 h-6 w-6 opacity-30" /> No developers found
                  </div>
                ) : (
                  <div className="max-h-80 overflow-y-auto py-2">
                    {searchResults.map((u) => (
                      <button
                        key={u.id}
                        onClick={() => { router.push(`/profile/${u.id}`); setSearchOpen(false); setSearchQuery(""); setSearchExpanded(false); }}
                        className="group flex w-full items-center gap-3 px-4 py-2.5 transition hover:bg-white/[0.05]"
                      >
                        <Avatar src={u.avatar} name={u.name} size={36} status={u.availability} />
                        <div className="min-w-0 flex-1 text-left">
                          <p className="truncate text-sm font-medium text-white transition-colors group-hover:text-neon-cyan">{u.name}</p>
                          <p className="flex items-center gap-1 truncate text-xs text-slate-400">
                            {u.role}
                            {u.location && <><span className="text-slate-600">·</span><MapPin className="h-3 w-3" />{u.location}</>}
                          </p>
                        </div>
                        <span className="shrink-0 rounded-full border border-white/10 px-2 py-0.5 text-[10px] text-slate-400">{u.trustScore}</span>
                      </button>
                    ))}
                  </div>
                )}
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {!searchExpanded && (
          <kbd className="hidden items-center gap-1 rounded border border-white/10 px-1.5 py-1 text-[10px] text-white/20 xl:flex">
            <Command className="h-2.5 w-2.5" />K
          </kbd>
        )}

        <button onClick={toggleTheme} className="hidden h-9 w-9 shrink-0 place-items-center rounded border border-white/10 text-slate-400 transition hover:border-white/20 hover:text-white sm:grid" title="Toggle theme">
          {theme === "dark" ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
        </button>

        <Badge tone="cyan" className="hidden shrink-0 xl:inline-flex">{user?.tier?.toUpperCase()} plan</Badge>

        {/* Notifications */}
        <div className="relative shrink-0" ref={notifRef}>
          <button
            onClick={() => { setNotifOpen(!notifOpen); if (!notifOpen && unread > 0) markAllRead(); }}
            className="relative rounded border border-white/10 p-2 text-slate-300 transition hover:border-white/20 hover:text-white"
          >
            <Bell className="h-4 w-4" />
            {unread > 0 && (
              <span className="absolute -right-1 -top-1 flex h-4 w-4 items-center justify-center rounded-full bg-neon-magenta text-[9px] font-bold text-white">
                {unread > 9 ? "9+" : unread}
              </span>
            )}
          </button>
          <AnimatePresence>
            {notifOpen && (
              <motion.div
                initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }}
                transition={{ duration: 0.15 }}
                className="absolute right-0 top-10 z-50 w-80 rounded-md border border-white/10 bg-ink-900 shadow-card"
              >
                <div className="flex items-center justify-between border-b border-white/10 px-4 py-3">
                  <h3 className="text-sm font-semibold text-white">Notifications</h3>
                  {unread > 0 && <button onClick={markAllRead} className="text-xs text-neon-cyan hover:underline">Mark all read</button>}
                </div>
                <div className="max-h-80 overflow-y-auto">
                  {notifications.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-10 text-slate-500">
                      <Bell className="mb-2 h-8 w-8 opacity-20" /><p className="text-sm">All caught up!</p>
                    </div>
                  ) : (
                    notifications.map((n) => (
                      <div
                        key={n.id}
                        onClick={() => handleNotifClick(n)}
                        className={cn("flex cursor-pointer items-start gap-3 px-4 py-3 transition hover:bg-white/[0.04]", !n.read && "bg-neon-cyan/[0.03]")}
                      >
                        <div className="mt-0.5 shrink-0">
                          {n.fromAvatar ? <Avatar src={n.fromAvatar} name={n.fromName ?? "?"} size={32} /> : (
                            <div className="grid h-8 w-8 place-items-center rounded-full bg-white/10">{notifIcon(n.type)}</div>
                          )}
                        </div>
                        <div className="min-w-0 flex-1">
                          <p className={cn("text-sm leading-snug", n.read ? "text-slate-400" : "text-white")}>{n.message}</p>
                          <p className="mt-0.5 text-xs text-slate-600">{new Date(n.createdAt).toLocaleDateString()}</p>
                          {n.type === "connection_request" && n.payload?.connectionId && (
                            <div className="mt-2 flex gap-2" onClick={(e) => e.stopPropagation()}>
                              <button onClick={() => handleAcceptConnection(n)} className="rounded bg-neon-cyan/20 px-2.5 py-1 text-xs text-neon-cyan transition hover:bg-neon-cyan/30">Accept</button>
                              <button
                                onClick={async () => {
                                  await api.rejectConnection(n.payload!.connectionId).catch(() => {});
                                  setNotifications((p) => p.filter((x) => x.id !== n.id));
                                  setUnread((u) => Math.max(0, u - 1));
                                }}
                                className="rounded bg-white/10 px-2.5 py-1 text-xs text-slate-400 transition hover:text-white"
                              >
                                Decline
                              </button>
                            </div>
                          )}
                        </div>
                        {!n.read && <div className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-neon-cyan" />}
                      </div>
                    ))
                  )}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* More — covers the nav items that don't fit the mobile bottom bar
            (Startups, Recruiter, Billing) plus theme/logout on small screens.
            This is the entire concession to "overflow"; there is no drawer. */}
        <div className="relative shrink-0 lg:hidden" ref={moreRef}>
          <button onClick={() => setMoreOpen((v) => !v)} className="grid h-9 w-9 place-items-center rounded border border-white/10 text-slate-300 hover:border-white/20 hover:text-white">
            <MoreHorizontal className="h-4 w-4" />
          </button>
          <AnimatePresence>
            {moreOpen && (
              <motion.div
                initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }}
                transition={{ duration: 0.15 }}
                className="absolute right-0 top-11 z-50 w-56 overflow-hidden rounded-md border border-white/10 bg-ink-900 shadow-card"
              >
                {items.map((item, i) => (
                  <Link
                    key={item.to}
                    href={item.to}
                    onClick={() => setMoreOpen(false)}
                    className="flex items-center gap-3 px-4 py-2.5 text-sm text-slate-300 transition hover:bg-white/[0.05] hover:text-white"
                  >
                    <item.icon className="h-4 w-4" /> {item.label}
                  </Link>
                ))}
                <div className="section-line" />
                <button onClick={toggleTheme} className="flex w-full items-center gap-3 px-4 py-2.5 text-sm text-slate-300 transition hover:bg-white/[0.05] hover:text-white sm:hidden">
                  {theme === "dark" ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />} Toggle theme
                </button>
                <button onClick={handleLogout} className="flex w-full items-center gap-3 px-4 py-2.5 text-sm text-neon-magenta transition hover:bg-white/[0.05]">
                  <LogOut className="h-4 w-4" /> Log out
                </button>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        <Link href="/profile" className="hidden shrink-0 rounded-full ring-2 ring-transparent transition hover:ring-neon-cyan/30 lg:block">
          <Avatar src={user?.avatar} name={user?.name ?? "You"} size={34} />
        </Link>
        <button onClick={handleLogout} className="hidden shrink-0 rounded border border-white/10 p-2 text-slate-400 transition hover:border-neon-magenta/40 hover:text-neon-magenta lg:grid lg:place-items-center" title="Log out">
          <LogOut className="h-4 w-4" />
        </button>
      </div>
    </header>
  );
}
