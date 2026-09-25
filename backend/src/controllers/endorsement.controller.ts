import type { Response } from "express";
import { Endorsement } from "../models/Endorsement.js";
import { Connection } from "../models/Connection.js";
import { Notification } from "../models/Notification.js";
import { User } from "../models/User.js";
import { emitToUser } from "../sockets/chat.socket.js";
import { recomputeTrust } from "./user.controller.js";
import type { AuthedRequest } from "../middleware/auth.js";

const fromSelect = "name handle avatar role";

/** GET /api/users/:id/endorsements — public list, grouped by skill client-side. */
export async function listEndorsements(req: AuthedRequest, res: Response) {
  const endorsements = await Endorsement.find({ to: req.params.id })
    .sort({ createdAt: -1 })
    .populate("from", fromSelect)
    .lean();
  res.json({ endorsements });
}

/** POST /api/users/:id/endorsements — body: { skill, note? }. Requires an
 *  accepted connection with the recipient, so endorsements mean something. */
export async function createEndorsement(req: AuthedRequest, res: Response) {
  const meId = req.userId!;
  const toId = req.params.id;
  const skill = String(req.body.skill ?? "").trim();
  const note = req.body.note ? String(req.body.note).trim().slice(0, 240) : undefined;

  if (!skill) return res.status(400).json({ error: "skill is required" });
  if (meId === toId) return res.status(400).json({ error: "Cannot endorse yourself" });

  const target = await User.findById(toId).select("name skills");
  if (!target) return res.status(404).json({ error: "User not found" });

  const validSkill = (target.skills ?? []).some(
    (s) => s.name?.toLowerCase() === skill.toLowerCase(),
  );
  if (!validSkill) return res.status(400).json({ error: "Skill is not on this user's profile" });

  const connected = await Connection.findOne({
    status: "accepted",
    $or: [
      { from: meId, to: toId },
      { from: toId, to: meId },
    ],
  });
  if (!connected) return res.status(403).json({ error: "You must be connected to endorse someone" });

  let endorsement;
  try {
    endorsement = await Endorsement.create({ from: meId, to: toId, skill, note });
  } catch (err: any) {
    if (err?.code === 11000) return res.status(409).json({ error: "You already endorsed this skill" });
    throw err;
  }

  await User.findByIdAndUpdate(toId, { $inc: { endorsementsCount: 1 } });
  await recomputeTrust(toId);

  const me = await User.findById(meId).select("name avatar");
  const notification = await Notification.create({
    user: toId,
    type: "system",
    payload: {
      subType: "endorsement",
      fromId: meId,
      fromName: me?.name,
      fromAvatar: me?.avatar,
      message: `${me?.name} endorsed you for ${skill}`,
      skill,
    },
  });
  emitToUser(toId, "notification:new", {
    id: String(notification._id),
    type: "endorsement",
    message: `${me?.name} endorsed you for ${skill}`,
    fromId: meId,
    fromName: me?.name,
    fromAvatar: me?.avatar,
    skill,
    createdAt: new Date(),
  });

  const populated = await endorsement.populate("from", fromSelect);
  res.status(201).json({ endorsement: populated });
}

/** DELETE /api/endorsements/:id — only the endorser can retract it. */
export async function deleteEndorsement(req: AuthedRequest, res: Response) {
  const endorsement = await Endorsement.findOne({ _id: req.params.id, from: req.userId });
  if (!endorsement) return res.status(404).json({ error: "Not found" });

  await endorsement.deleteOne();
  await User.findByIdAndUpdate(endorsement.to, { $inc: { endorsementsCount: -1 } });
  await recomputeTrust(String(endorsement.to));

  res.json({ ok: true });
}
