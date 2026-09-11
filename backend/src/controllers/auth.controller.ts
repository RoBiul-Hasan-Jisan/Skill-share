import type { Response } from "express";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { z } from "zod";
import { User } from "../models/User.js";
import { env } from "../config/env.js";
import { computeTrustScore } from "../services/trustScore.service.js";
import { firebaseAdmin } from "../config/firebase.js";
import type { AuthedRequest } from "../middleware/auth.js";

const sign = (id: string, role: string) =>
  jwt.sign({ id, role }, env.jwtSecret, { expiresIn: env.jwtExpires as never });

const registerSchema = z.object({
  name: z.string().min(2),
  email: z.string().email(),
  handle: z.string().min(2),
  password: z.string().min(8),
});

export async function register(req: AuthedRequest, res: Response) {
  const body = registerSchema.parse(req.body);
  const exists = await User.findOne({ $or: [{ email: body.email }, { handle: body.handle }] });
  if (exists) return res.status(409).json({ error: "Email or handle already in use" });

  const password = await bcrypt.hash(body.password, 12);
  const user = await User.create({ ...body, password });

  const { trustScore, trustBreakdown } = computeTrustScore(user);
  user.set({ trustScore, trustBreakdown, trustUpdatedAt: new Date() });
  await user.save();

  const token = sign(user.id, user.roleAccess);
  res.status(201).json({ token, user: safe(user) });
}

const loginSchema = z.object({ email: z.string().email(), password: z.string() });

export async function login(req: AuthedRequest, res: Response) {
  const body = loginSchema.parse(req.body);
  const user = await User.findOne({ email: body.email }).select("+password");
  if (!user) return res.status(401).json({ error: "Invalid credentials" });
  const ok = await bcrypt.compare(body.password, user.password);
  if (!ok) return res.status(401).json({ error: "Invalid credentials" });
  const token = sign(user.id, user.roleAccess);
  res.json({ token, user: safe(user) });
}

export async function me(req: AuthedRequest, res: Response) {
  const user = await User.findById(req.userId);
  if (!user) return res.status(404).json({ error: "Not found" });
  res.json({ user: safe(user) });
}

export async function googleAuth(req: AuthedRequest, res: Response) {
  const { idToken } = req.body as { idToken: string };
  if (!idToken) return res.status(400).json({ error: "idToken required" });

  if (!firebaseAdmin) return res.status(503).json({ error: "Google auth not configured" });

  const decoded = await firebaseAdmin.verifyIdToken(idToken);
  const { uid, email = "", name, picture } = decoded;

  let user = await User.findOne({ email });
  if (!user) {
    const base = (name ?? email.split("@")[0]).toLowerCase().replace(/[^a-z0-9]/g, "");
    const handle = base + uid.slice(0, 5);
    const password = await bcrypt.hash(uid + Date.now(), 10);
    user = await User.create({
      name: name ?? email.split("@")[0],
      email,
      handle,
      avatar: picture ?? "",
      password,
    });
    const { trustScore, trustBreakdown } = computeTrustScore(user);
    user.set({ trustScore, trustBreakdown, trustUpdatedAt: new Date() });
    await user.save();
  }

  const token = sign(user.id, user.roleAccess);
  res.json({ token, user: safe(user) });
}

/** POST /api/auth/onboarding — complete onboarding, set profile + userType */
export async function completeOnboarding(req: AuthedRequest, res: Response) {
  const {
    userType, role, bio, location, availability,
    skills, stack, github, website, twitter,
  } = req.body;

  const update: Record<string, unknown> = {
    onboardingComplete: true,
  };

  if (userType) update.userType = userType;
  if (role) update.role = role;
  if (bio) update.bio = bio;
  if (location) update.location = location;
  if (availability) update.availability = availability;
  if (Array.isArray(skills)) update.skills = skills;
  if (Array.isArray(stack)) update.stack = stack;
  if (github !== undefined) update.github = github;
  if (website !== undefined) update.website = website;
  if (twitter !== undefined) update.twitter = twitter;

  // Account type (recruiter vs developer) drives route-level access control
  // via roleAccess (checked by requireRole on the recruiter dashboard route
  // and by RequireAuth on the frontend). Keep the two in sync so choosing
  // "Recruiter" during onboarding actually unlocks the recruiter dashboard,
  // and choosing "Developer" never leaves a stale recruiter grant behind.
  if (userType === "recruiter") update.roleAccess = "recruiter";
  else if (userType === "developer") update.roleAccess = "member";

  const user = await User.findByIdAndUpdate(req.userId, { $set: update }, { new: true });
  if (!user) return res.status(404).json({ error: "Not found" });

  const { trustScore, trustBreakdown } = computeTrustScore(user);
  user.set({ trustScore, trustBreakdown, trustUpdatedAt: new Date() });
  await user.save();

  // roleAccess may have just changed — re-sign so the client's token
  // reflects it immediately instead of waiting for the next login.
  const token = sign(user.id, user.roleAccess);
  res.json({ token, user: safe(user) });
}

/** PATCH /api/auth/avatar — update avatar URL */
export async function updateAvatar(req: AuthedRequest, res: Response) {
  const { avatar } = req.body;
  if (!avatar) return res.status(400).json({ error: "avatar URL required" });
  const user = await User.findByIdAndUpdate(req.userId, { $set: { avatar } }, { new: true });
  res.json({ user: safe(user) });
}

export function safe(u: any) {
  const o = u.toObject ? u.toObject() : { ...u };
  delete o.password;
  return o;
}
