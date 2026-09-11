import type { Server as HttpServer } from "http";
import { Server, type Socket } from "socket.io";
import jwt from "jsonwebtoken";
import { env } from "../config/env.js";
import { Conversation } from "../models/Conversation.js";
import { Message } from "../models/Message.js";
import { User } from "../models/User.js";

interface AuthedSocket extends Socket {
  userId?: string;
}

const online = new Map<string, Set<string>>();

function addPresence(userId: string, socketId: string): boolean {
  const set = online.get(userId) ?? new Set<string>();
  const wasOffline = set.size === 0;
  set.add(socketId);
  online.set(userId, set);
  return wasOffline;
}

function removePresence(userId: string, socketId: string): boolean {
  const set = online.get(userId);
  if (!set) return false;
  set.delete(socketId);
  if (set.size === 0) {
    online.delete(userId);
    return true;
  }
  online.set(userId, set);
  return false;
}

let _io: Server | null = null;

/** Emit an event to all sockets belonging to a specific user. */
export function emitToUser(userId: string, event: string, data: unknown) {
  _io?.to(`user:${userId}`).emit(event, data);
}

export function initChatSocket(httpServer: HttpServer) {
  const io = new Server(httpServer, {
    cors: { origin: env.clientOrigin, credentials: true },
  });
  _io = io;

  io.use((socket: AuthedSocket, next) => {
    const token = socket.handshake.auth?.token as string | undefined;
    if (!token) return next(new Error("Unauthorized"));
    try {
      const payload = jwt.verify(token, env.jwtSecret) as { id: string };
      socket.userId = payload.id;
      next();
    } catch {
      next(new Error("Invalid token"));
    }
  });

  io.on("connection", async (socket: AuthedSocket) => {
    const userId = socket.userId!;

    // Join user's private room for targeted notifications
    socket.join(`user:${userId}`);

    if (addPresence(userId, socket.id)) {
      socket.broadcast.emit("user_online", { userId });
      await User.findByIdAndUpdate(userId, { $set: { lastSeen: new Date() } }).catch(() => {});
    }
    socket.emit("online_snapshot", { users: [...online.keys()] });

    const convos = await Conversation.find({ participants: userId }).select("_id").lean();
    convos.forEach((c) => socket.join(String(c._id)));

    socket.on("join_room", (roomId: string) => socket.join(roomId));
    socket.on("leave_room", (roomId: string) => socket.leave(roomId));

    socket.on(
      "send_message",
      async (payload: {
        roomId: string;
        text: string;
        attachment?: { type: "image" | "file"; url: string; name: string };
      }) => {
        const { roomId, text, attachment } = payload;
        if (!text?.trim() && !attachment) return;

        const convo = await Conversation.findById(roomId);
        if (!convo || !convo.participants.some((p) => String(p) === userId)) return;

        const receiver =
          convo.kind === "dm"
            ? convo.participants.find((p) => String(p) !== userId) ?? null
            : null;

        const msg = await Message.create({
          conversation: convo._id,
          sender: userId,
          receiver,
          team: convo.team ?? null,
          text: text?.trim() ?? "",
          attachment,
          seenBy: [userId],
        });

        convo.lastMessage = text?.trim() || (attachment ? `📎 ${attachment.name}` : "");
        convo.lastMessageAt = new Date();
        await convo.save();
        await User.findByIdAndUpdate(userId, { $inc: { messagesSent: 1 } }).catch(() => {});

        // Broadcast to everyone EXCEPT the sending socket.
        // The sender already has their message via optimistic insert — no echo needed.
        socket.to(roomId).emit("receive_message", {
          id: String(msg._id),
          roomId,
          senderId: userId,
          text: msg.text,
          attachment: msg.attachment,
          ts: msg.createdAt,
          seenBy: [userId],
        });

        // Push notification to the receiver for DMs
        if (receiver) {
          const sender = await User.findById(userId).select("name avatar").lean();
          io.to(`user:${String(receiver)}`).emit("notification:new", {
            type: "message",
            message: `${sender?.name ?? "Someone"} sent you a message`,
            payload: { roomId, senderId: userId },
          });
        }
      },
    );

    socket.on("typing_start", ({ roomId }: { roomId: string }) =>
      socket.to(roomId).emit("typing_start", { roomId, userId }),
    );
    socket.on("typing_stop", ({ roomId }: { roomId: string }) =>
      socket.to(roomId).emit("typing_stop", { roomId, userId }),
    );

    socket.on(
      "message_seen",
      async ({ roomId, messageId }: { roomId: string; messageId: string }) => {
        await Message.updateOne(
          { _id: messageId },
          { $addToSet: { seenBy: userId } },
        ).catch(() => {});
        socket.to(roomId).emit("message_seen", { roomId, messageId, userId });
      },
    );

    socket.on("disconnect", () => {
      if (removePresence(userId, socket.id)) {
        socket.broadcast.emit("user_offline", { userId });
      }
    });
  });

  return io;
}
