import type { Response } from "express";
import { z } from "zod";
import { Team } from "../models/Team.js";
import { Conversation } from "../models/Conversation.js";
import { User } from "../models/User.js";
import { recomputeTrust } from "./user.controller.js";
import type { AuthedRequest } from "../middleware/auth.js";

const MEMBER_FIELDS = "name handle avatar availability trustScore role skills stack";

const createSchema = z.object({
  name: z.string().min(2),
  tagline: z.string().optional().default(""),
  openRoles: z.array(z.string()).optional().default([]),
  stack: z.array(z.string()).optional().default([]),
  stage: z.enum(["idea", "building", "launched"]).optional().default("idea"),
});

export async function myTeams(req: AuthedRequest, res: Response) {
  const teams = await Team.find({ members: req.userId })
    .populate("members", MEMBER_FIELDS)
    .lean();
  res.json({ teams });
}

export async function allTeams(req: AuthedRequest, res: Response) {
  const teams = await Team.find()
    .populate("members", MEMBER_FIELDS)
    .sort({ createdAt: -1 })
    .limit(50)
    .lean();
  res.json({ teams });
}

export async function createTeam(req: AuthedRequest, res: Response) {
  const body = createSchema.parse(req.body);
  const team = await Team.create({ ...body, owner: req.userId, members: [req.userId] });

  const convo = await Conversation.create({
    kind: "team",
    team: team._id,
    participants: [req.userId],
  });
  team.conversation = convo._id;
  await team.save();

  await User.findByIdAndUpdate(req.userId, { $inc: { teamsJoined: 1 } });
  await recomputeTrust(req.userId!);

  const populated = await Team.findById(team._id).populate("members", MEMBER_FIELDS).lean();
  res.status(201).json({ team: populated });
}

export async function deleteTeam(req: AuthedRequest, res: Response) {
  const team = await Team.findById(req.params.id).lean();
  if (!team) return res.status(404).json({ error: "Team not found" });
  if (String((team as any).owner) !== req.userId)
    return res.status(403).json({ error: "Only the team owner can delete this team" });
  await Team.findByIdAndDelete(req.params.id);
  if ((team as any).conversation)
    await Conversation.findByIdAndDelete((team as any).conversation);
  res.json({ ok: true });
}

export async function removeMember(req: AuthedRequest, res: Response) {
  const { id, memberId } = req.params;
  const team = await Team.findById(id).lean();
  if (!team) return res.status(404).json({ error: "Team not found" });
  if (String((team as any).owner) !== req.userId)
    return res.status(403).json({ error: "Only the owner can remove members" });
  if (memberId === req.userId)
    return res.status(400).json({ error: "Owner cannot remove themselves" });
  const updated = await Team.findByIdAndUpdate(
    id,
    { $pull: { members: memberId } },
    { new: true },
  ).populate("members", MEMBER_FIELDS).lean();
  await User.findByIdAndUpdate(memberId, { $inc: { teamsJoined: -1 } });
  await recomputeTrust(memberId);
  res.json({ team: updated });
}

export async function joinTeam(req: AuthedRequest, res: Response) {
  const existing = await Team.findById(req.params.id).select("members conversation").lean();
  if (!existing) return res.status(404).json({ error: "Team not found" });
  const alreadyMember = (existing.members as unknown[]).some((m) => String(m) === req.userId);

  const team = await Team.findByIdAndUpdate(
    req.params.id,
    { $addToSet: { members: req.userId } },
    { new: true },
  ).populate("members", MEMBER_FIELDS).lean();

  if (!team) return res.status(404).json({ error: "Team not found" });

  if ((team as any).conversation) {
    await Conversation.findByIdAndUpdate((team as any).conversation, {
      $addToSet: { participants: req.userId },
    });
  }

  // $addToSet is idempotent on membership, but the trust-score credit for
  // "joined a team" should only be granted once per actual join.
  if (!alreadyMember) {
    await User.findByIdAndUpdate(req.userId, { $inc: { teamsJoined: 1 } });
    await recomputeTrust(req.userId!);
  }

  res.json({ team });
}
