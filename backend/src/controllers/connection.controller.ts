import type { Response } from "express";
import { Connection } from "../models/Connection.js";
import { Notification } from "../models/Notification.js";
import { Conversation } from "../models/Conversation.js";
import { User } from "../models/User.js";
import { emitToUser } from "../sockets/chat.socket.js";
import type { AuthedRequest } from "../middleware/auth.js";

const userSelect = "name handle avatar role availability trustScore";

/** POST /api/connections/request/:userId */
export async function sendRequest(req: AuthedRequest, res: Response) {
  const meId = req.userId!;
  const toId = req.params.userId;

  if (meId === toId) return res.status(400).json({ error: "Cannot connect with yourself" });

  const target = await User.findById(toId).select(userSelect);
  if (!target) return res.status(404).json({ error: "User not found" });

  // Check existing
  const existing = await Connection.findOne({
    $or: [
      { from: meId, to: toId },
      { from: toId, to: meId },
    ],
  });

  if (existing) {
    if (existing.status === "accepted") return res.status(409).json({ error: "Already connected" });
    if (existing.status === "pending") return res.status(409).json({ error: "Request already pending" });
    // If rejected, allow re-request
    if (existing.status === "rejected") {
      existing.from = meId as any;
      existing.to = toId as any;
      existing.status = "pending";
      await existing.save();
    }
  } else {
    await Connection.create({ from: meId, to: toId });
  }

  const me = await User.findById(meId).select("name avatar");

  // Create notification for recipient
  const notification = await Notification.create({
    user: toId,
    type: "match",
    payload: {
      subType: "connection_request",
      fromId: meId,
      fromName: me?.name,
      fromAvatar: me?.avatar,
      message: `${me?.name} sent you a connection request`,
    },
  });

  // Real-time push
  emitToUser(toId, "notification:new", {
    id: String(notification._id),
    type: "connection_request",
    message: `${me?.name} sent you a connection request`,
    fromId: meId,
    fromName: me?.name,
    fromAvatar: me?.avatar,
    createdAt: new Date(),
  });

  res.json({ ok: true });
}

/** POST /api/connections/:id/accept */
export async function acceptRequest(req: AuthedRequest, res: Response) {
  const meId = req.userId!;
  const conn = await Connection.findOne({ _id: req.params.id, to: meId, status: "pending" });
  if (!conn) return res.status(404).json({ error: "Request not found" });

  conn.status = "accepted";
  await conn.save();

  // Update follower counts
  await User.findByIdAndUpdate(conn.from, { $inc: { followers: 1 } });
  await User.findByIdAndUpdate(conn.to, { $inc: { followers: 1 } });

  // Auto-create DM conversation
  const pair = [String(conn.from), String(conn.to)].sort();
  let convo = await Conversation.findOne({ kind: "dm", participants: { $all: pair, $size: 2 } });
  if (!convo) {
    convo = await Conversation.create({ kind: "dm", participants: pair });
  }

  const me = await User.findById(meId).select("name avatar");

  // Notify the requester
  const notification = await Notification.create({
    user: conn.from,
    type: "match",
    payload: {
      subType: "connection_accepted",
      fromId: meId,
      fromName: me?.name,
      fromAvatar: me?.avatar,
      message: `${me?.name} accepted your connection request`,
      conversationId: String(convo._id),
    },
  });

  emitToUser(String(conn.from as any), "notification:new", {
    id: String(notification._id),
    type: "connection_accepted",
    message: `${me?.name} accepted your connection request`,
    fromId: meId,
    fromName: me?.name,
    fromAvatar: me?.avatar,
    conversationId: String(convo._id),
    createdAt: new Date(),
  });

  res.json({ ok: true, conversationId: String(convo._id) });
}

/** POST /api/connections/:id/reject */
export async function rejectRequest(req: AuthedRequest, res: Response) {
  const meId = req.userId!;
  const conn = await Connection.findOne({ _id: req.params.id, to: meId, status: "pending" });
  if (!conn) return res.status(404).json({ error: "Request not found" });
  conn.status = "rejected";
  await conn.save();
  res.json({ ok: true });
}

/** GET /api/connections — accepted connections for current user */
export async function listConnections(req: AuthedRequest, res: Response) {
  const meId = req.userId!;
  const conns = await Connection.find({
    $or: [{ from: meId }, { to: meId }],
    status: "accepted",
  })
    .populate("from", userSelect)
    .populate("to", userSelect)
    .sort({ updatedAt: -1 })
    .lean();

  const users = conns.map((c) => {
    const other = String((c.from as any)._id ?? c.from) === meId ? c.to : c.from;
    return { connectionId: String(c._id), user: other };
  });

  res.json({ connections: users });
}

/** GET /api/connections/pending — incoming pending requests */
export async function listPending(req: AuthedRequest, res: Response) {
  const meId = req.userId!;
  const pending = await Connection.find({ to: meId, status: "pending" })
    .populate("from", userSelect)
    .sort({ createdAt: -1 })
    .lean();
  res.json({ pending });
}

/** GET /api/connections/status/:userId — relationship status */
export async function connectionStatus(req: AuthedRequest, res: Response) {
  const meId = req.userId!;
  const otherId = req.params.userId;

  const conn = await Connection.findOne({
    $or: [
      { from: meId, to: otherId },
      { from: otherId, to: meId },
    ],
  });

  if (!conn) return res.json({ status: "none" });
  if (conn.status === "accepted") return res.json({ status: "connected", connectionId: String(conn._id) });
  if (conn.status === "pending") {
    const direction = String(conn.from) === meId ? "pending_sent" : "pending_received";
    return res.json({ status: direction, connectionId: String(conn._id) });
  }
  return res.json({ status: "none" });
}

/** DELETE /api/connections/:userId — remove/disconnect */
export async function removeConnection(req: AuthedRequest, res: Response) {
  const meId = req.userId!;
  const otherId = req.params.userId;
  await Connection.deleteOne({
    $or: [
      { from: meId, to: otherId },
      { from: otherId, to: meId },
    ],
    status: "accepted",
  });
  res.json({ ok: true });
}
