import type { Response } from "express";
import { User } from "../models/User.js";
import { Message } from "../models/Message.js";
import {
  computeTrustScore,
  ruleBasedSuggestions,
  isLowQuality,
} from "../services/trustScore.service.js";
import { matchCandidates, type MatchMode } from "../services/matching.service.js";
import type { AuthedRequest } from "../middleware/auth.js";

export async function recomputeTrust(userId: string) {
  const user = await User.findById(userId);
  if (!user) return null;
  const { trustScore, trustBreakdown } = computeTrustScore(user);
  user.set({ trustScore, trustBreakdown, trustUpdatedAt: new Date() });
  await user.save();
  return { trustScore, trustBreakdown };
}

export async function updateProfile(req: AuthedRequest, res: Response) {
  const allowed = [
    "name", "bio", "role", "location", "availability", "skills", "stack",
    "github", "website", "twitter", "githubStats", "certificatesCount", "projectsCount",
    "lookingFor",
  ];
  const patch: Record<string, unknown> = {};
  for (const k of allowed) if (k in req.body) patch[k] = req.body[k];

  const user = await User.findByIdAndUpdate(req.userId, patch, { new: true });
  if (!user) return res.status(404).json({ error: "Not found" });

  const { trustScore, trustBreakdown } = computeTrustScore(user);
  user.set({ trustScore, trustBreakdown, trustUpdatedAt: new Date() });
  await user.save();

  res.json({ user });
}

export async function myTrust(req: AuthedRequest, res: Response) {
  const user = await User.findById(req.userId);
  if (!user) return res.status(404).json({ error: "Not found" });
  const { trustScore, trustBreakdown } = computeTrustScore(user);
  const suggestions = ruleBasedSuggestions(user);
  res.json({ trustScore, trustBreakdown, suggestions, flagged: isLowQuality(user) });
}

export async function recruiterList(req: AuthedRequest, res: Response) {
  const minScore = Number(req.query.minScore ?? 0);
  const sort = req.query.sort === "asc" ? 1 : -1;
  const skill = req.query.skill ? String(req.query.skill) : null;

  // Recruiter accounts browse the developer pool only — never other
  // recruiter/admin accounts — regardless of trust score.
  const filter: Record<string, unknown> = {
    trustScore: { $gte: minScore },
    userType: "developer",
  };
  if (skill) filter["skills.name"] = skill;

  const developers = await User.find(filter)
    .sort({ trustScore: sort })
    .limit(100)
    .select("name handle avatar role location skills trustScore trustBreakdown availability")
    .lean();

  res.json({ developers });
}

export async function listUsers(req: AuthedRequest, res: Response) {
  const q = req.query.q ? String(req.query.q).trim() : "";
  const filter: Record<string, unknown> = { _id: { $ne: req.userId } };

  if (q) {
    const rx = new RegExp(q, "i");
    filter.$or = [
      { name: rx },
      { handle: rx },
      { role: rx },
      { "skills.name": rx },
      { stack: rx },
      { location: rx },
    ];
  }

  const users = await User.find(filter)
    .select("name handle avatar role location skills trustScore availability stack")
    .limit(q ? 10 : 100)
    .lean();
  res.json({ users });
}

export async function getUser(req: AuthedRequest, res: Response) {
  const user = await User.findById(req.params.id)
    .select("-password")
    .lean();
  if (!user) return res.status(404).json({ error: "Not found" });
  res.json({ user });
}

export async function rankedMatches(req: AuthedRequest, res: Response) {
  const me = await User.findById(req.userId).lean();
  if (!me) return res.status(404).json({ error: "Not found" });

  const modeParam = String(req.query.mode ?? "All");
  const mode: MatchMode = (["All", "Collaborator", "Cofounder", "Hackathon"] as const).includes(
    modeParam as MatchMode,
  )
    ? (modeParam as MatchMode)
    : "All";

  // Developers only ever match against other developer accounts — recruiter
  // and admin accounts never appear here. Recruiters get their own,
  // trust-ranked view of the developer pool via /recruiter/developers.
  const candidates = await User.find({
    _id: { $ne: me._id },
    userType: "developer",
    onboardingComplete: true,
  })
    .select("name handle avatar role skills stack trustScore trustBreakdown availability bio location lookingFor")
    .limit(200)
    .lean();

  const scored = matchCandidates(me, candidates, mode);

  const matches = scored.slice(0, 20).map((m) => ({
    user: m.candidate,
    score: m.score,
    sharedStack: m.sharedStack,
    sharedSkills: m.sharedSkills,
    complementarySkills: m.complementarySkills,
    roleComplementary: m.roleComplementary,
    lookingForMatch: m.lookingForMatch,
    breakdown: m.breakdown,
  }));

  res.json({ matches });
}

export async function myActivity(req: AuthedRequest, res: Response) {
  const now = new Date();
  const result: { day: string; views: number; matches: number }[] = [];

  for (let i = 6; i >= 0; i--) {
    const start = new Date(now);
    start.setDate(start.getDate() - i);
    start.setHours(0, 0, 0, 0);
    const end = new Date(start);
    end.setHours(23, 59, 59, 999);
    const dayName = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"][start.getDay()];

    const [sent, received] = await Promise.all([
      Message.countDocuments({ sender: req.userId, createdAt: { $gte: start, $lte: end } }),
      Message.countDocuments({ receiver: req.userId, createdAt: { $gte: start, $lte: end } }),
    ]);

    result.push({ day: dayName, views: received, matches: sent });
  }

  res.json({ activity: result });
}

export async function featuredUsers(_req: AuthedRequest, res: Response) {
  const users = await User.find()
    .sort({ trustScore: -1 })
    .limit(4)
    .select("name handle avatar role trustScore availability stack skills")
    .lean();
  res.json({ users });
}
