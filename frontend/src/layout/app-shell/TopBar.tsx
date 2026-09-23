"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { AnimatePresence, motion } from "framer-motion";
import {
  Search, Bell, Menu, X, MapPin, Sun, Moon, Command,
  UserPlus, Check, MessageCircle, Rocket,
} from "lucide-react";
import { Avatar } from "@/components/ui/Avatar";
import { Badge } from "@/components/ui/Badge";
import { cn } from "@/lib/utils";
import { useAuth } from "@/context/AuthContext";
import { useTheme } from "@/context/ThemeContext";
import { api } from "@/lib/api";
import { useToast } from "@/components/ui/Toast";
import { getSocket } from "@/lib/socket";
import type { AppNotification, DevUser } from "@/types";

function notifIcon(type: string) {
  switch (type) {
    case "connection_request": return <UserPlus className="h-4 w-4 text-neon-cyan" />;
    case "connection_accepted": return <Check className="h-4 w-4 text-neon-lime" />;
    case "message": return <MessageCircle className="h-4 w-4 text-neon-magenta" />;
    case "application": return <Rocket className="h-4 w-4 text-neon-magenta" />;
    default: return <Bell className="h-4 w-4 text-slate-400" />;
  }
}

export function TopBar({
  onOpenDrawer, unreadChat, bumpUnreadChat,
}: { onOpenDrawer: () => void; unreadChat: number; bumpUnreadChat: () => void }) {
  const { user } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const router = useRouter();
  const toast = useToast();

  const [notifOpen, setNotifOpen] = useState(false);
  const [notifications, setNotifications] = useState<AppNotification[]>([]);
  const [unread, setUnread] = useState(0);
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<DevUser[]>([]);
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchLoading, setSearchLoading] = useState(false);
  const notifRef = useRef<HTMLDivElement>(null);
  const searchRef = useRef<HTMLDivElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);
  const searchTimer = useRef<ReturnType<typeof setTimeout>>();

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
      try { setSearchResults(await api.searchUsers(q)); }
      catch { setSearchResults([]); }
      finally { setSearchLoading(false); }
    }, 280);
  }, []);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (searchRef.current && !searchRef.current.contains(e.target as Node)) setSearchOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

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
      if (n.type === "message") bumpUnreadChat();
    };
    socket.on("notification:new", handler);
    return () => { socket.off("notification:new", handler); };
  }, [bumpUnreadChat]);

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

  return (
    <header className="sticky top-0 z-30 flex items-center gap-3 border-b border-white/10 bg-ink-950 px-4 py-3 sm:gap-4 sm:px-5">
      <button
        type="button"
        className="shrink-0 rounded border border-white/10 p-2 text-slate-300 transition hover:text-white lg:hidden"
        onClick={onOpenDrawer}
      >
        <Menu className="h-4 w-4" />
      </button>

      <div className="relative max-w-md flex-1" ref={searchRef}>
        <div className="flex items-center gap-2 rounded border border-white/10 bg-white/[0.03] px-3 py-2 text-sm text-slate-400 transition-colors focus-within:border-neon-cyan/40">
          <Search className="h-4 w-4 shrink-0" />
          <input
            ref={searchInputRef}
            value={searchQuery}
            onChange={(e) => handleSearchChange(e.target.value)}
            onFocus={() => searchQuery.trim() && setSearchOpen(true)}
            placeholder="Search developers, skills…"
            className="w-full bg-transparent text-white outline-none placeholder:text-slate-500"
          />
          {searchQuery ? (
            <button onClick={() => { setSearchQuery(""); setSearchResults([]); setSearchOpen(false); }} className="text-slate-500 transition-colors hover:text-white">
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
              initial={{ opacity: 0, y: -6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -6 }}
              transition={{ duration: 0.12 }}
              className="absolute left-0 right-0 top-11 z-50 overflow-hidden rounded-md border border-white/10 bg-ink-900 shadow-card"
            >
              {searchLoading ? (
                <div className="flex items-center justify-center gap-2 py-8 text-sm text-slate-500">
                  <span className="block h-4 w-4 animate-spin rounded-full border border-slate-600 border-t-neon-cyan" />
                  Searching…
                </div>
              ) : searchResults.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-8 text-sm text-slate-500">
                  <Search className="mb-2 h-6 w-6 opacity-30" />
                  No developers found
                </div>
              ) : (
                <div className="max-h-80 overflow-y-auto py-2">
                  {searchResults.map((u) => (
                    <button
                      key={u.id}
                      onClick={() => { router.push(`/profile/${u.id}`); setSearchOpen(false); setSearchQuery(""); }}
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

      <button
        onClick={toggleTheme}
        className="hidden h-8 w-8 shrink-0 place-items-center rounded border border-white/10 text-slate-400 transition hover:border-white/20 hover:text-white sm:grid"
        title="Toggle theme"
      >
        {theme === "dark" ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
      </button>

      <Badge tone="cyan" className="hidden shrink-0 sm:inline-flex">{user?.tier?.toUpperCase()} plan</Badge>

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
                    <Bell className="mb-2 h-8 w-8 opacity-20" />
                    <p className="text-sm">All caught up!</p>
                  </div>
                ) : (
                  notifications.map((n) => (
                    <div
                      key={n.id}
                      onClick={() => handleNotifClick(n)}
                      className={cn("flex cursor-pointer items-start gap-3 px-4 py-3 transition hover:bg-white/[0.04]", !n.read && "bg-neon-cyan/[0.03]")}
                    >
                      <div className="mt-0.5 shrink-0">
                        {n.fromAvatar ? (
                          <Avatar src={n.fromAvatar} name={n.fromName ?? "?"} size={32} />
                        ) : (
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

      <Link href="/profile" className="shrink-0 rounded-full ring-2 ring-transparent transition hover:ring-neon-cyan/30">
        <Avatar src={user?.avatar} name={user?.name ?? "You"} size={36} />
      </Link>
    </header>
  );
}
