import { create } from "zustand";
import { getSocket, isDemoMode, type ChatWireMessage } from "@/lib/socket";
import { api, getMyId } from "@/lib/api";
import type { ChatMessage, ChatRoom } from "@/types";

const now = () =>
  new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });

interface ChatState {
  rooms: ChatRoom[];
  activeRoomId: string | null;
  messages: Record<string, ChatMessage[]>;
  typingByRoom: Record<string, Set<string>>;
  onlineUsers: Set<string>;
  loadingRooms: boolean;
  connected: boolean;

  init: () => Promise<void>;
  selectRoom: (roomId: string) => Promise<void>;
  sendMessage: (text: string, attachment?: ChatMessage["attachment"]) => void;
  setTyping: (isTyping: boolean) => void;
  markSeen: (roomId: string) => void;
  toggleReaction: (messageId: string, emoji: string) => void;
  editMessage: (messageId: string, text: string) => void;
  deleteMessage: (messageId: string) => Promise<void>;
}

export const useChatStore = create<ChatState>((set, get) => {
  const seenIds = new Set<string>();

  const insert = (roomId: string, msg: ChatMessage) => {
    if (seenIds.has(msg.id)) return;
    seenIds.add(msg.id);
    set((s) => ({
      messages: { ...s.messages, [roomId]: [...(s.messages[roomId] ?? []), msg] },
      rooms: s.rooms.map((r) =>
        r.id === roomId ? { ...r, lastMessage: msg.text, ts: "now" } : r,
      ),
    }));
  };

  const socket = getSocket();
  if (socket) {
    socket.on("connect", () => set({ connected: true }));
    socket.on("disconnect", () => set({ connected: false }));
    socket.on("receive_message", (w: ChatWireMessage) =>
      insert(w.roomId, {
        id: w.id,
        roomId: w.roomId,
        senderId: w.senderId,
        fromMe: w.senderId === getMyId(),
        text: w.text,
        ts: w.ts,
        seenBy: w.seenBy,
      }),
    );
    socket.on("typing_start", ({ roomId, userId }) =>
      set((s) => {
        const next = new Set(s.typingByRoom[roomId] ?? []);
        next.add(userId);
        return { typingByRoom: { ...s.typingByRoom, [roomId]: next } };
      }),
    );
    socket.on("typing_stop", ({ roomId, userId }) =>
      set((s) => {
        const next = new Set(s.typingByRoom[roomId] ?? []);
        next.delete(userId);
        return { typingByRoom: { ...s.typingByRoom, [roomId]: next } };
      }),
    );
    socket.on("user_online", ({ userId }) =>
      set((s) => ({ onlineUsers: new Set(s.onlineUsers).add(userId) })),
    );
    socket.on("user_offline", ({ userId }) =>
      set((s) => {
        const next = new Set(s.onlineUsers);
        next.delete(userId);
        return { onlineUsers: next };
      }),
    );
    socket.on("message_seen", ({ roomId, messageId, userId }) =>
      set((s) => ({
        messages: {
          ...s.messages,
          [roomId]: (s.messages[roomId] ?? []).map((m) =>
            m.id === messageId && !m.seenBy.includes(userId)
              ? { ...m, seenBy: [...m.seenBy, userId] }
              : m,
          ),
        },
      })),
    );
  }

  return {
    rooms: [],
    activeRoomId: null,
    messages: {},
    typingByRoom: {},
    onlineUsers: new Set<string>(),
    loadingRooms: true,
    connected: !isDemoMode(),

    init: async () => {
      set({ loadingRooms: true });
      try {
        const rooms = await api.rooms();
        set({ loadingRooms: false, rooms });
      } catch {
        set({ loadingRooms: false });
      }
    },

    selectRoom: async (roomId) => {
      set({ activeRoomId: roomId });
      set((s) => ({
        rooms: s.rooms.map((r) => (r.id === roomId ? { ...r, unread: 0 } : r)),
      }));
      if (!get().messages[roomId]) {
        try {
          const msgs = await api.messages(roomId);
          msgs.forEach((m) => seenIds.add(m.id));
          set((s) => ({ messages: { ...s.messages, [roomId]: msgs } }));
        } catch { /* room may be empty */ }
      }
      get().markSeen(roomId);
      getSocket()?.emit("join_room", roomId);
    },

    sendMessage: (text, attachment) => {
      const roomId = get().activeRoomId;
      const myId = getMyId();
      if (!roomId || (!text.trim() && !attachment)) return;
      const msg: ChatMessage = {
        id: `local-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
        roomId,
        senderId: myId,
        fromMe: true,
        text: text.trim(),
        ts: now(),
        seenBy: [],
        attachment,
      };
      insert(roomId, msg);
      const socket = getSocket();
      if (socket) {
        socket.emit("send_message", { roomId, senderId: myId, text: msg.text, attachment } as never);
      } else {
        // Demo mode: simulate peer reply
        const peer = get().rooms.find((r) => r.id === roomId)?.members[0];
        if (!peer) return;
        const pid = peer.id;
        set((s) => {
          const next = new Set(s.typingByRoom[roomId] ?? []);
          next.add(pid);
          return { typingByRoom: { ...s.typingByRoom, [roomId]: next } };
        });
        setTimeout(() => {
          set((s) => {
            const next = new Set(s.typingByRoom[roomId] ?? []);
            next.delete(pid);
            return { typingByRoom: { ...s.typingByRoom, [roomId]: next } };
          });
          insert(roomId, {
            id: `sim-${Date.now()}`,
            roomId,
            senderId: pid,
            fromMe: false,
            text: pickReply(text),
            ts: now(),
            seenBy: [myId],
            senderName: peer.name,
            senderAvatar: peer.avatar,
          });
          set((s) => ({
            messages: {
              ...s.messages,
              [roomId]: (s.messages[roomId] ?? []).map((m) =>
                m.id === msg.id ? { ...m, seenBy: [pid] } : m,
              ),
            },
          }));
        }, 1600);
      }
    },

    setTyping: (isTyping) => {
      const roomId = get().activeRoomId;
      if (!roomId) return;
      getSocket()?.emit(isTyping ? "typing_start" : "typing_stop", {
        roomId,
        userId: getMyId(),
      });
    },

    markSeen: (roomId) => {
      const myId = getMyId();
      const socket = getSocket();
      set((s) => ({
        messages: {
          ...s.messages,
          [roomId]: (s.messages[roomId] ?? []).map((m) => {
            if (!m.fromMe && !m.seenBy.includes(myId)) {
              socket?.emit("message_seen", { roomId, messageId: m.id, userId: myId });
              return { ...m, seenBy: [...m.seenBy, myId] };
            }
            return m;
          }),
        },
      }));
    },

    toggleReaction: (messageId, emoji) => {
      const roomId = get().activeRoomId;
      const myId = getMyId();
      if (!roomId) return;
      set((s) => ({
        messages: {
          ...s.messages,
          [roomId]: (s.messages[roomId] ?? []).map((m) => {
            if (m.id !== messageId) return m;
            const reactions = [...(m.reactions ?? [])];
            const idx = reactions.findIndex((r) => r.emoji === emoji);
            if (idx === -1) reactions.push({ emoji, by: [myId] });
            else if (reactions[idx].by.includes(myId))
              reactions[idx] = { ...reactions[idx], by: reactions[idx].by.filter((u) => u !== myId) };
            else reactions[idx] = { ...reactions[idx], by: [...reactions[idx].by, myId] };
            return { ...m, reactions: reactions.filter((r) => r.by.length > 0) };
          }),
        },
      }));
    },

    editMessage: (messageId, text) => {
      const roomId = get().activeRoomId;
      if (!roomId) return;
      set((s) => ({
        messages: {
          ...s.messages,
          [roomId]: (s.messages[roomId] ?? []).map((m) =>
            m.id === messageId ? { ...m, text, edited: true } : m,
          ),
        },
      }));
    },

    deleteMessage: async (messageId) => {
      const roomId = get().activeRoomId;
      if (!roomId) return;
      // Optimistic remove
      set((s) => ({
        messages: {
          ...s.messages,
          [roomId]: (s.messages[roomId] ?? []).filter((m) => m.id !== messageId),
        },
      }));
      // Persist to server (ignore errors — already removed from view)
      try {
        await fetch(`${process.env.NEXT_PUBLIC_API_URL ?? "/api"}/messages/${messageId}`, {
          method: "DELETE",
          headers: { Authorization: `Bearer ${localStorage.getItem("token") ?? ""}` },
        });
      } catch { /* silent */ }
    },
  };
});

function pickReply(input: string): string {
  const t = input.toLowerCase();
  if (t.includes("?")) return "Good question — let me check and get back to you 🤔";
  if (t.includes("ship") || t.includes("deploy")) return "On it, deploying now 🚀";
  if (t.includes("thanks") || t.includes("thx")) return "Anytime! 🙌";
  const generic = ["Got it ✅", "Sounds good!", "💯", "Let's do it.", "Pushing changes now."];
  return generic[Math.floor(Math.random() * generic.length)];
}
