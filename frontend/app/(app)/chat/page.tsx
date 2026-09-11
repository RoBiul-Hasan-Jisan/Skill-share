"use client";

import { useEffect, useRef, useState, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useSearchParams } from "next/navigation";
import EmojiPicker, { type EmojiClickData, Theme } from "emoji-picker-react";
import {
  Send, Search, Hash, Users as UsersIcon,
  Check, CheckCheck, Trash2, Info, Circle, Wifi, WifiOff,
  ChevronLeft, MessageSquare, Eraser, Smile,
} from "lucide-react";
import { GlassCard } from "@/components/ui/GlassCard";
import { Avatar } from "@/components/ui/Avatar";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { Skeleton } from "@/components/ui/Skeleton";
import { TrustMeter } from "@/components/ui/TrustMeter";
import { useChatStore } from "@/store/chatStore";
import { api } from "@/lib/api";
import { useAuth } from "@/context/AuthContext";
import { useTheme } from "@/context/ThemeContext";
import { useToast } from "@/components/ui/Toast";
import { cn } from "@/lib/utils";
import type { ChatMessage, ChatRoom } from "@/types";

const QUICK_EMOJIS = ["👍", "🔥", "🎉", "🚀", "❤️", "😂"];

export default function Chat() {
  const searchParams = useSearchParams();
  const { user } = useAuth();
  const { theme } = useTheme();
  const toast = useToast();
  const myId = user?.id ?? "";

  const {
    rooms, activeRoomId, messages, typingByRoom, loadingRooms, connected,
    init, selectRoom, sendMessage, setTyping, markSeen, deleteMessage,
  } = useChatStore();

  const [query, setQuery] = useState("");
  const [draft, setDraft] = useState("");
  const [showInfo, setShowInfo] = useState(false);
  const [mobileView, setMobileView] = useState<"list" | "chat">("list");
  const [clearing, setClearing] = useState(false);
  const [confirmClear, setConfirmClear] = useState(false);
  const [showEmoji, setShowEmoji] = useState(false);
  const endRef = useRef<HTMLDivElement>(null);
  const typingTimer = useRef<ReturnType<typeof setTimeout>>();
  const deepLinked = useRef(false);
  const emojiRef = useRef<HTMLDivElement>(null);

  useEffect(() => { init(); }, [init]);

  // Close emoji picker on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (emojiRef.current && !emojiRef.current.contains(e.target as Node)) {
        setShowEmoji(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  // Auto-select room: prefer deep-link from navigation state, else first room
  useEffect(() => {
    if (loadingRooms || rooms.length === 0) return;
    const targetId = searchParams.get("roomId") ?? undefined;
    if (targetId && !deepLinked.current) {
      const found = rooms.find((r) => r.id === targetId);
      if (found) {
        deepLinked.current = true;
        selectRoom(found.id);
        setMobileView("chat");
        return;
      }
    }
    if (!activeRoomId) {
      selectRoom(rooms[0].id);
    }
  }, [rooms, loadingRooms, activeRoomId, selectRoom, searchParams]);

  const active = rooms.find((r) => r.id === activeRoomId) ?? null;
  const list = activeRoomId ? messages[activeRoomId] ?? [] : [];
  const typing = activeRoomId ? [...(typingByRoom[activeRoomId] ?? [])] : [];

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: "smooth" });
    if (activeRoomId) markSeen(activeRoomId);
  }, [list.length, typing.length, activeRoomId, markSeen]);

  const filtered = useMemo(
    () => rooms.filter((r) => r.name.toLowerCase().includes(query.toLowerCase())),
    [rooms, query],
  );
  const dms = filtered.filter((r) => r.kind === "dm");
  const teamRooms = filtered.filter((r) => r.kind === "team");

  const onChange = (v: string) => {
    setDraft(v);
    setTyping(true);
    clearTimeout(typingTimer.current);
    typingTimer.current = setTimeout(() => setTyping(false), 1200);
  };

  const submit = () => {
    if (!draft.trim()) return;
    sendMessage(draft);
    setDraft("");
    setTyping(false);
    setShowEmoji(false);
  };

  const onEmojiClick = (emojiData: EmojiClickData) => {
    setDraft((prev) => prev + emojiData.emoji);
    setShowEmoji(false);
  };

  const clearChat = async () => {
    if (!activeRoomId) return;
    if (!confirmClear) { setConfirmClear(true); return; }
    setClearing(true);
    try {
      await api.clearChat(activeRoomId);
      useChatStore.setState((s) => ({
        messages: {
          ...s.messages,
          [activeRoomId]: (s.messages[activeRoomId] ?? []).filter(
            (m) => m.senderId !== myId,
          ),
        },
      }));
      toast("Chat cleared");
    } catch {
      toast("Failed to clear chat", "error");
    } finally {
      setClearing(false);
      setConfirmClear(false);
    }
  };

  const handlePickRoom = (id: string) => {
    selectRoom(id);
    setMobileView("chat");
  };

  return (
    // h-[calc(100vh-11rem)] on mobile/tablet accounts for the fixed bottom nav + padding
    // lg screens have no bottom nav so use h-[calc(100vh-9rem)]
    <div className="relative overflow-hidden grid h-[calc(100vh-11rem)] lg:h-[calc(100vh-9rem)] grid-cols-1 gap-4 md:grid-cols-[280px_1fr] xl:grid-cols-[280px_1fr_280px]">
      {/* LEFT — room list */}
      <GlassCard className={cn(
        "flex-col overflow-hidden p-0",
        "md:flex",
        mobileView === "list" ? "flex" : "hidden",
      )}>
        <div className="border-b border-white/5 p-4">
          <div className="mb-3 flex items-center justify-between">
            <h2 className="font-display font-semibold text-white">Chat</h2>
            <span className={cn("flex items-center gap-1 text-[10px]", connected ? "text-neon-lime" : "text-slate-500")}>
              {connected ? <Wifi className="h-3 w-3" /> : <WifiOff className="h-3 w-3" />}
              {connected ? "live" : "demo"}
            </span>
          </div>
          <div className="flex items-center gap-2 rounded-xl border border-white/10 bg-white/[0.03] px-2.5 py-1.5">
            <Search className="h-3.5 w-3.5 text-slate-500" />
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search chats…"
              className="w-full bg-transparent text-sm outline-none placeholder:text-slate-500"
            />
          </div>
        </div>
        {loadingRooms ? (
          <div className="space-y-2 p-3">
            {Array.from({ length: 5 }).map((_, i) => <Skeleton key={i} className="h-14 w-full" />)}
          </div>
        ) : rooms.length === 0 ? (
          <div className="flex flex-1 flex-col items-center justify-center gap-3 p-6 text-center">
            <MessageSquare className="h-10 w-10 text-slate-600" />
            <p className="text-sm text-slate-400">No chats yet. Connect with someone to start chatting!</p>
          </div>
        ) : (
          <div className="flex-1 overflow-y-auto p-2">
            <RoomGroup label="Direct Messages" rooms={dms} activeId={activeRoomId} onPick={handlePickRoom} />
            <RoomGroup label="Team Rooms" rooms={teamRooms} activeId={activeRoomId} onPick={handlePickRoom} icon />
          </div>
        )}
      </GlassCard>

      {/* MIDDLE — messages */}
      <GlassCard className={cn(
        "flex-col overflow-hidden p-0",
        "md:flex",
        mobileView === "chat" ? "flex" : "hidden",
      )}>
        {active ? (
          <>
            <header className="flex items-center justify-between border-b border-white/5 p-4">
              <div className="flex items-center gap-3">
                <button
                  className="md:hidden rounded-lg p-1.5 text-slate-400 hover:text-white hover:bg-white/5"
                  onClick={() => setMobileView("list")}
                >
                  <ChevronLeft className="h-5 w-5" />
                </button>
                {active.kind === "team" ? (
                  <span className="grid h-10 w-10 place-items-center rounded-xl bg-neon-soft text-neon-cyan"><Hash className="h-5 w-5" /></span>
                ) : (
                  <Avatar src={active.avatar} name={active.name} size={40} status={active.online ? "available" : undefined} />
                )}
                <div>
                  <p className="text-sm font-medium text-white">{active.name}</p>
                  <p className="text-xs text-slate-500">
                    {active.kind === "team"
                      ? `${active.members.length} members`
                      : active.online ? "Online" : "Offline"}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-1">
                <button
                  onClick={clearChat}
                  disabled={clearing}
                  title={confirmClear ? "Click again to confirm clear" : "Clear my messages"}
                  className={cn(
                    "rounded-lg p-2 text-sm transition flex items-center gap-1",
                    confirmClear
                      ? "bg-neon-magenta/20 text-neon-magenta"
                      : "text-slate-400 hover:bg-white/5 hover:text-neon-magenta",
                  )}
                >
                  <Eraser className="h-4 w-4" />
                  {confirmClear && <span className="text-xs hidden sm:inline">Confirm?</span>}
                </button>
                <button onClick={() => setShowInfo((v) => !v)} className="rounded-lg p-2 text-slate-400 transition hover:bg-white/5 hover:text-white xl:hidden">
                  <Info className="h-4 w-4" />
                </button>
              </div>
            </header>

            <div className="flex-1 space-y-1 overflow-y-auto p-4">
              {list.length === 0 ? (
                <div className="grid h-full place-items-center text-sm text-slate-500">No messages yet — say hi 👋</div>
              ) : (
                <AnimatePresence initial={false}>
                  {list.map((m, i) => (
                    <MessageRow
                      key={m.id}
                      msg={m}
                      prev={list[i - 1]}
                      myId={myId}
                      isTeam={active.kind === "team"}
                      totalMembers={active.members.length}
                      onDelete={deleteMessage}
                    />
                  ))}
                </AnimatePresence>
              )}
              {typing.length > 0 && <TypingDots ids={typing} />}
              <div ref={endRef} />
            </div>

            {/* Input bar */}
            <div className="relative border-t border-white/5 p-3">
              {/* Emoji picker */}
              <AnimatePresence>
                {showEmoji && (
                  <motion.div
                    ref={emojiRef}
                    initial={{ opacity: 0, y: 8, scale: 0.97 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: 8, scale: 0.97 }}
                    transition={{ duration: 0.15 }}
                    className="absolute bottom-full left-0 right-0 z-50 pb-2 px-3"
                  >
                    <EmojiPicker
                      onEmojiClick={onEmojiClick}
                      theme={Theme.DARK}
                      width="100%"
                      height={360}
                      lazyLoadEmojis
                      searchPlaceholder="Search emoji…"
                      skinTonesDisabled
                    />
                  </motion.div>
                )}
              </AnimatePresence>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => setShowEmoji((v) => !v)}
                  className={cn(
                    "rounded-lg p-2 transition",
                    showEmoji ? "bg-neon-cyan/10 text-neon-cyan" : "text-slate-400 hover:bg-white/5 hover:text-neon-cyan",
                  )}
                  title="Emoji"
                >
                  <Smile className="h-4 w-4" />
                </button>
                <input
                  value={draft}
                  onChange={(e) => onChange(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && !e.shiftKey && submit()}
                  placeholder={`Message ${active.kind === "team" ? "#" + active.name : active.name}…`}
                  className="h-10 flex-1 rounded-xl border border-white/10 bg-white/[0.03] px-3 text-sm text-white outline-none placeholder:text-slate-500 focus:border-neon-cyan/50"
                />
                <Button onClick={submit} className="px-3"><Send className="h-4 w-4" /></Button>
              </div>
            </div>
          </>
        ) : (
          <div className="flex flex-1 flex-col items-center justify-center gap-3 text-center p-8">
            <MessageSquare className="h-12 w-12 text-slate-600" />
            <p className="text-slate-400">Select a conversation to start chatting</p>
          </div>
        )}
      </GlassCard>

      {/* RIGHT — info panel: always-visible column on xl, slide-in overlay on smaller screens */}
      {active && (
        <>
          {/* Mobile/tablet slide-in overlay */}
          <AnimatePresence>
            {showInfo && (
              <>
                <motion.div
                  key="info-backdrop"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.2 }}
                  className="absolute inset-0 z-10 bg-black/50 xl:hidden"
                  onClick={() => setShowInfo(false)}
                />
                <motion.div
                  key="info-panel"
                  initial={{ x: "100%" }}
                  animate={{ x: 0 }}
                  exit={{ x: "100%" }}
                  transition={{ type: "spring", stiffness: 300, damping: 30 }}
                  className="absolute inset-y-0 right-0 z-20 flex w-72 flex-col overflow-y-auto rounded-2xl xl:hidden"
                  style={{
                    background: theme === "dark" ? "rgba(8,8,8,0.97)" : "rgba(255,255,255,0.97)",
                    border: theme === "dark" ? "1px solid rgba(255,255,255,0.07)" : "1px solid rgba(0,0,0,0.08)",
                    backdropFilter: "blur(24px)",
                  }}
                >
                  {active.kind === "dm" ? <DmInfo room={active} /> : <TeamInfo room={active} />}
                </motion.div>
              </>
            )}
          </AnimatePresence>

          {/* Desktop column — always visible on xl */}
          <GlassCard className="hidden flex-col overflow-y-auto xl:flex">
            {active.kind === "dm" ? <DmInfo room={active} /> : <TeamInfo room={active} />}
          </GlassCard>
        </>
      )}
    </div>
  );
}

function RoomGroup({
  label, rooms, activeId, onPick, icon,
}: {
  label: string; rooms: ChatRoom[]; activeId: string | null;
  onPick: (id: string) => void; icon?: boolean;
}) {
  if (rooms.length === 0) return null;
  return (
    <div className="mb-2">
      <p className="px-2 py-1.5 text-[10px] font-semibold uppercase tracking-widest text-slate-500">{label}</p>
      {rooms.map((r) => (
        <button
          key={r.id}
          onClick={() => onPick(r.id)}
          className={cn(
            "flex w-full items-center gap-3 rounded-xl p-2.5 text-left transition",
            activeId === r.id ? "bg-white/[0.06]" : "hover:bg-white/[0.03]",
          )}
        >
          {icon ? (
            <span className="grid h-9 w-9 place-items-center rounded-lg bg-white/5 text-neon-cyan"><Hash className="h-4 w-4" /></span>
          ) : (
            <Avatar src={r.avatar} name={r.name} size={36} status={r.online ? "available" : undefined} />
          )}
          <div className="min-w-0 flex-1">
            <div className="flex items-center justify-between">
              <p className="truncate text-sm font-medium text-white">{r.name}</p>
              <span className="text-[10px] text-slate-500">{r.ts}</span>
            </div>
            <p className="truncate text-xs text-slate-500">{r.lastMessage}</p>
          </div>
          {r.unread > 0 && (
            <span className="grid h-5 min-w-5 place-items-center rounded-full bg-neon-grad px-1 text-[10px] font-bold text-ink-950">{r.unread}</span>
          )}
        </button>
      ))}
    </div>
  );
}

function MessageRow({
  msg, prev, myId, isTeam, totalMembers, onDelete,
}: {
  msg: ChatMessage; prev?: ChatMessage; myId: string;
  isTeam: boolean; totalMembers: number;
  onDelete: (id: string) => void;
}) {
  const { toggleReaction } = useChatStore();
  const [hover, setHover] = useState(false);
  const fromMe = msg.senderId === myId;
  const grouped = prev && prev.senderId === msg.senderId;
  const seenCount = msg.seenBy.filter((id) => id !== myId).length;
  const allSeen = isTeam ? seenCount >= totalMembers - 1 : seenCount > 0;

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0 }}
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
      className={cn("group flex gap-2", fromMe ? "justify-end" : "justify-start")}
    >
      {!fromMe && isTeam && !grouped && (
        <Avatar src={msg.senderAvatar} name={msg.senderName ?? "?"} size={28} className="mt-5" />
      )}
      {!fromMe && isTeam && grouped && <div className="w-7 shrink-0" />}

      <div className={cn("max-w-[78%]", fromMe && "items-end")}>
        {!fromMe && isTeam && !grouped && (
          <p className="mb-0.5 ml-1 text-[11px] font-medium text-neon-cyan">{msg.senderName}</p>
        )}
        <div className="relative">
          <div
            className={cn(
              "rounded-2xl px-3.5 py-2 text-sm",
              fromMe
                ? "bg-neon-grad text-ink-950"
                : "border border-white/10 bg-white/[0.04] text-slate-200",
            )}
          >
            {msg.text}
            {msg.edited && <span className="ml-1.5 text-[10px] opacity-60">(edited)</span>}
            <span className={cn("ml-2 inline-flex items-center gap-1 align-middle text-[10px]", fromMe ? "text-ink-950/60" : "text-slate-500")}>
              {msg.ts}
              {fromMe && (allSeen ? <CheckCheck className="h-3 w-3" /> : <Check className="h-3 w-3" />)}
            </span>
          </div>

          {/* hover actions */}
          <AnimatePresence>
            {hover && (
              <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.9 }}
                className={cn(
                  "absolute -top-7 flex items-center gap-0.5 rounded-full border border-white/10 bg-ink-800/90 px-1 py-0.5 backdrop-blur",
                  fromMe ? "right-0" : "left-0",
                )}
              >
                {QUICK_EMOJIS.slice(0, 4).map((e) => (
                  <button key={e} onClick={() => toggleReaction(msg.id, e)} className="rounded-full px-1 text-sm hover:bg-white/10">{e}</button>
                ))}
                {fromMe && (
                  <button onClick={() => onDelete(msg.id)} className="rounded-full p-1 text-slate-400 hover:text-neon-magenta"><Trash2 className="h-3 w-3" /></button>
                )}
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* reactions */}
        {msg.reactions && msg.reactions.length > 0 && (
          <div className={cn("mt-1 flex gap-1", fromMe && "justify-end")}>
            {msg.reactions.map((r) => (
              <button
                key={r.emoji}
                onClick={() => toggleReaction(msg.id, r.emoji)}
                className={cn(
                  "flex items-center gap-1 rounded-full border px-1.5 py-0.5 text-[11px]",
                  r.by.includes(myId) ? "border-neon-cyan/40 bg-neon-cyan/10" : "border-white/10 bg-white/5",
                )}
              >
                {r.emoji} {r.by.length}
              </button>
            ))}
          </div>
        )}
      </div>
    </motion.div>
  );
}

function TypingDots({ ids }: { ids: string[] }) {
  const { rooms, activeRoomId } = useChatStore();
  const members = rooms.find((r) => r.id === activeRoomId)?.members ?? [];
  const who = ids
    .map((id) => members.find((m) => m.id === id)?.name?.split(" ")[0])
    .filter(Boolean)
    .join(", ");
  return (
    <div className="flex items-center gap-2 pl-1 pt-1">
      <div className="flex items-center gap-1 rounded-full border border-white/10 bg-white/5 px-2.5 py-1.5">
        {[0, 1, 2].map((i) => (
          <motion.span key={i} className="h-1.5 w-1.5 rounded-full bg-slate-400"
            animate={{ opacity: [0.3, 1, 0.3] }} transition={{ duration: 1, repeat: Infinity, delay: i * 0.2 }} />
        ))}
      </div>
      <span className="text-xs text-slate-500">{who} is typing…</span>
    </div>
  );
}

function DmInfo({ room }: { room: ChatRoom }) {
  const u = room.members[0];
  return (
    <div className="flex flex-col items-center gap-3 text-center">
      <Avatar src={u.avatar} name={u.name} size={72} status={u.availability} />
      <div>
        <p className="font-display font-semibold text-white">{u.name}</p>
        <p className="text-xs text-slate-400">{u.role}</p>
      </div>
      <TrustMeter score={u.trustScore} size={92} />
      <div className="w-full">
        <p className="mb-2 text-left text-[10px] font-semibold uppercase tracking-widest text-slate-500">Stack</p>
        <div className="flex flex-wrap gap-1.5">
          {u.stack.map((s) => <Badge key={s} tone="cyan">{s}</Badge>)}
        </div>
      </div>
    </div>
  );
}

function TeamInfo({ room }: { room: ChatRoom }) {
  return (
    <div>
      <div className="flex items-center gap-2">
        <UsersIcon className="h-4 w-4 text-neon-cyan" />
        <h3 className="font-display font-semibold text-white">Members</h3>
      </div>
      <div className="mt-3 space-y-2">
        {room.members.map((u) => (
          <div key={u.id} className="flex items-center gap-3 rounded-xl border border-white/10 bg-white/[0.02] p-2">
            <Avatar src={u.avatar} name={u.name} size={32} status={u.availability} />
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm text-white">{u.name}</p>
              <p className="truncate text-xs text-slate-500">{u.role}</p>
            </div>
            <Circle className="h-2 w-2 fill-neon-lime text-neon-lime" />
          </div>
        ))}
      </div>
    </div>
  );
}
