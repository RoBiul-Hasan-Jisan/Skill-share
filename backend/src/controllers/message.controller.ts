import type { Response } from "express";
import { Types } from "mongoose";
import { Conversation } from "../models/Conversation.js";
import { Message } from "../models/Message.js";
import { Team } from "../models/Team.js";
import { User } from "../models/User.js";
import type { AuthedRequest } from "../middleware/auth.js";

/**
 * Chat REST API — history, search, and conversation bootstrap.
 * Real-time delivery lives in sockets/chat.socket.ts; this layer is the
 * durable source of truth (persistence + pagination + search).
 */

/** GET /api/conversations — the current user's rooms, most-recent first. */
export async function listConversations(req: AuthedRequest, res: Response) {
  const convos = await Conversation.find({ participants: req.userId })
    .sort({ lastMessageAt: -1 })
    .populate("participants", "name handle avatar availability trustScore")
    .populate("team", "name")
    .lean();
  res.json({ conversations: convos });
}

/** GET /api/conversations/:id/messages?before=&limit= — paginated history. */
export async function getMessages(req: AuthedRequest, res: Response) {
  const { id } = req.params;
  const limit = Math.min(Number(req.query.limit ?? 30), 100);
  const before = req.query.before ? new Date(String(req.query.before)) : null;

  await assertMember(id, req.userId!);

  const filter: Record<string, unknown> = { conversation: id, deleted: false };
  if (before) filter.createdAt = { $lt: before };

  const msgs = await Message.find(filter)
    .sort({ createdAt: -1 })
    .limit(limit)
    .populate("sender", "name avatar")
    .lean();

  res.json({ messages: msgs.reverse() });
}

/** GET /api/conversations/:id/search?q= — searchable history (text index). */
export async function searchMessages(req: AuthedRequest, res: Response) {
  const { id } = req.params;
  const q = String(req.query.q ?? "").trim();
  await assertMember(id, req.userId!);
  if (!q) return res.json({ messages: [] });
  const msgs = await Message.find({
    conversation: id,
    deleted: false,
    $text: { $search: q },
  })
    .sort({ score: { $meta: "textScore" } })
    .limit(50)
    .lean();
  res.json({ messages: msgs });
}

/** POST /api/conversations/dm/:userId — get or create a 1:1 DM room. */
export async function openDm(req: AuthedRequest, res: Response) {
  const meId = req.userId!;
  const otherId = req.params.userId;
  if (meId === otherId) return res.status(400).json({ error: "Cannot DM yourself" });

  // Sorted pair guarantees a single canonical DM doc per pair (dedupe).
  const pair = [meId, otherId].sort();
  let convo = await Conversation.findOne({
    kind: "dm",
    participants: { $all: pair, $size: 2 },
  });
  if (!convo) {
    convo = await Conversation.create({ kind: "dm", participants: pair });
  }
  res.json({ conversation: convo });
}

/** Ensure every team has exactly one chat room; called when a team is created. */
export async function ensureTeamRoom(teamId: string) {
  const team = await Team.findById(teamId);
  if (!team) return null;
  if (team.conversation) return team.conversation;
  const convo = await Conversation.create({
    kind: "team",
    team: team._id,
    participants: team.members,
  });
  team.conversation = convo._id;
  await team.save();
  return convo._id;
}

/** PATCH /api/messages/:id — edit own message. */
export async function editMessage(req: AuthedRequest, res: Response) {
  const msg = await Message.findById(req.params.id);
  if (!msg) return res.status(404).json({ error: "Not found" });
  if (String(msg.sender) !== req.userId) return res.status(403).json({ error: "Forbidden" });
  msg.text = String(req.body.text ?? msg.text);
  msg.edited = true;
  await msg.save();
  res.json({ message: msg });
}

/** DELETE /api/messages/:id — soft delete own message. */
export async function deleteMessage(req: AuthedRequest, res: Response) {
  const msg = await Message.findById(req.params.id);
  if (!msg) return res.status(404).json({ error: "Not found" });
  if (String(msg.sender) !== req.userId) return res.status(403).json({ error: "Forbidden" });
  msg.deleted = true;
  msg.text = "";
  await msg.save();
  res.json({ ok: true });
}

/** DELETE /api/conversations/:id/messages — clear all messages for THIS user (soft-delete). */
export async function clearConversation(req: AuthedRequest, res: Response) {
  const meId = req.userId!;
  await assertMember(req.params.id, meId);
  await Message.updateMany(
    { conversation: req.params.id, sender: meId, deleted: false },
    { $set: { deleted: true, text: "" } },
  );
  res.json({ ok: true });
}

/** POST /api/messages/:id/react { emoji } — toggle a reaction. */
export async function reactMessage(req: AuthedRequest, res: Response) {
  const { emoji } = req.body as { emoji: string };
  const msg = await Message.findById(req.params.id);
  if (!msg) return res.status(404).json({ error: "Not found" });
  const uid = new Types.ObjectId(req.userId);
  const r = msg.reactions.find((x) => x.emoji === emoji);
  if (!r) msg.reactions.push({ emoji, by: [uid] });
  else {
    const has = r.by.some((b: Types.ObjectId) => String(b) === req.userId);
    r.by = has ? r.by.filter((b: Types.ObjectId) => String(b) !== req.userId) : [...r.by, uid];
  }
  msg.reactions = msg.reactions.filter((x) => x.by.length > 0);
  await msg.save();
  res.json({ message: msg });
}

async function assertMember(conversationId: string, userId: string) {
  const convo = await Conversation.findById(conversationId).select("participants");
  if (!convo) throw Object.assign(new Error("Conversation not found"), { status: 404 });
  const isMember = convo.participants.some((p) => String(p) === userId);
  if (!isMember) throw Object.assign(new Error("Forbidden"), { status: 403 });
}
