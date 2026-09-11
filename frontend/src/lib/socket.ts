import { io, type Socket } from "socket.io-client";

// Typed contract — must match server/src/sockets/chat.socket.ts
export interface ServerToClient {
  receive_message: (msg: ChatWireMessage) => void;
  typing_start: (p: { roomId: string; userId: string }) => void;
  typing_stop: (p: { roomId: string; userId: string }) => void;
  user_online: (p: { userId: string }) => void;
  user_offline: (p: { userId: string }) => void;
  message_seen: (p: { roomId: string; messageId: string; userId: string }) => void;
  online_snapshot: (p: { users: string[] }) => void;
  "notification:new": (n: Record<string, any>) => void;
}
export interface ClientToServer {
  join_room: (roomId: string) => void;
  leave_room: (roomId: string) => void;
  send_message: (msg: Omit<ChatWireMessage, "id" | "ts" | "seenBy">) => void;
  typing_start: (p: { roomId: string; userId: string }) => void;
  typing_stop: (p: { roomId: string; userId: string }) => void;
  message_seen: (p: { roomId: string; messageId: string; userId: string }) => void;
}


export interface ChatWireMessage {
  id: string;
  roomId: string;
  senderId: string;
  text: string;
  ts: string;
  seenBy: string[];
}

export type ChatSocket = Socket<ServerToClient, ClientToServer>;

const SOCKET_URL = process.env.NEXT_PUBLIC_SOCKET_URL as string | undefined;

let socket: ChatSocket | null = null;

/** Returns a connected socket, or null in local demo mode (no server URL set)
 *  or when called outside the browser (SSR / static prerendering). */
export function getSocket(): ChatSocket | null {
  if (typeof window === "undefined") return null; // SSR/build — no localStorage, no socket
  if (!SOCKET_URL) return null; // demo mode — store simulates the peer
  if (socket) return socket;
  const token = localStorage.getItem("token") ?? "";
  socket = io(SOCKET_URL, {
    autoConnect: true,
    auth: { token },
    // Reconnection: exponential backoff, capped — avoids dupes on flaky nets.
    reconnection: true,
    reconnectionAttempts: Infinity,
    reconnectionDelay: 800,
    reconnectionDelayMax: 6000,
    transports: ["websocket"],
  });
  return socket;
}

export function isDemoMode() {
  return !SOCKET_URL;
}

export function disconnectSocket() {
  socket?.disconnect();
  socket = null;
}
