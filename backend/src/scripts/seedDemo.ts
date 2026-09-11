/**
 * Seeds a demo account plus enough surrounding data (other developers,
 * an accepted connection, a DM with messages, a team with tasks, and a
 * startup idea) that a first-time visitor gets a real feel for the product
 * the moment they log in — not an empty dashboard.
 *
 * Safe to re-run: every write is an upsert / existence check.
 *
 * Usage:  npm run seed:demo   (from server/)
 */
import "dotenv/config";
import bcrypt from "bcryptjs";
import mongoose from "mongoose";
import { connectDB } from "../config/db.js";
import { env } from "../config/env.js";
import { User } from "../models/User.js";
import { Project } from "../models/Project.js";
import { Connection } from "../models/Connection.js";
import { Conversation } from "../models/Conversation.js";
import { Message } from "../models/Message.js";
import { Team } from "../models/Team.js";
import { Task } from "../models/Task.js";
import { StartupIdea } from "../models/StartupIdea.js";
import { computeTrustScore } from "../services/trustScore.service.js";

export const DEMO_EMAIL = "demo@skillshare.dev";
export const DEMO_PASSWORD = "demo1234";

type SeedUser = {
  name: string;
  handle: string;
  email: string;
  role: string;
  bio: string;
  location: string;
  availability: "available" | "open" | "busy";
  lookingFor: string[];
  skills: { name: string; level: number }[];
  stack: string[];
  github?: string;
  projectsCount?: number;
  certificatesCount?: number;
};

const OTHER_USERS: SeedUser[] = [
  {
    name: "Priya Nandan",
    handle: "priyan",
    email: "priya.demo@skillshare.dev",
    role: "Backend Engineer",
    bio: "Distributed systems and API design. Ex-fintech. Looking to cofound something in dev tooling.",
    location: "Bengaluru, India",
    availability: "open",
    lookingFor: ["Cofounder", "Collaborator"],
    skills: [{ name: "Node.js", level: 90 }, { name: "PostgreSQL", level: 85 }, { name: "System Design", level: 80 }],
    stack: ["Node.js", "PostgreSQL", "Redis", "Docker"],
    github: "https://github.com/priyan",
    projectsCount: 3,
    certificatesCount: 1,
  },
  {
    name: "Marco Belline",
    handle: "marcob",
    email: "marco.demo@skillshare.dev",
    role: "Product Designer",
    bio: "Design systems nerd. I turn rough ideas into shippable UI fast.",
    location: "Lisbon, Portugal",
    availability: "available",
    lookingFor: ["Hackathon", "Collaborator"],
    skills: [{ name: "Figma", level: 95 }, { name: "Design Systems", level: 88 }, { name: "Prototyping", level: 82 }],
    stack: ["Figma", "React", "Tailwind CSS"],
    projectsCount: 5,
    certificatesCount: 0,
  },
  {
    name: "Aiko Tanaka",
    handle: "aikot",
    email: "aiko.demo@skillshare.dev",
    role: "Full-stack Developer",
    bio: "Building a habit-tracking app on nights and weekends. Open to a technical cofounder.",
    location: "Tokyo, Japan",
    availability: "open",
    lookingFor: ["Cofounder"],
    skills: [{ name: "TypeScript", level: 92 }, { name: "React", level: 90 }, { name: "MongoDB", level: 75 }],
    stack: ["Next.js", "TypeScript", "MongoDB", "Tailwind CSS"],
    github: "https://github.com/aikot",
    projectsCount: 4,
    certificatesCount: 2,
  },
  {
    name: "Jordan Fields",
    handle: "jordanf",
    email: "jordan.demo@skillshare.dev",
    role: "ML Engineer",
    bio: "Recommendation systems and ranking. Hack-weekend regular.",
    location: "Austin, TX",
    availability: "busy",
    lookingFor: ["Hackathon"],
    skills: [{ name: "Python", level: 93 }, { name: "PyTorch", level: 85 }, { name: "Data Pipelines", level: 78 }],
    stack: ["Python", "PyTorch", "AWS"],
    projectsCount: 6,
    certificatesCount: 3,
  },
];

const DEMO_USER: SeedUser = {
  name: "Demo Developer",
  handle: "demo-dev",
  email: DEMO_EMAIL,
  role: "Full-stack Developer",
  bio: "This is a demo account — poke around Discover, Connections, Chat, Teams, and the Startups board freely.",
  location: "Remote",
  availability: "open",
  lookingFor: ["Cofounder", "Collaborator", "Hackathon"],
  skills: [{ name: "React", level: 88 }, { name: "Node.js", level: 82 }, { name: "TypeScript", level: 85 }],
  stack: ["Next.js", "TypeScript", "Node.js", "MongoDB"],
  github: "https://github.com/demo",
  projectsCount: 2,
  certificatesCount: 1,
};

async function upsertUser(u: SeedUser, password: string) {
  let user = await User.findOne({ email: u.email });
  if (user) return user;

  const hashed = await bcrypt.hash(password, 12);
  user = await User.create({
    name: u.name,
    handle: u.handle,
    email: u.email,
    password: hashed,
    role: u.role,
    bio: u.bio,
    location: u.location,
    availability: u.availability,
    lookingFor: u.lookingFor,
    skills: u.skills,
    stack: u.stack,
    github: u.github,
    userType: "developer",
    onboardingComplete: true,
    projectsCount: u.projectsCount ?? 0,
    certificatesCount: u.certificatesCount ?? 0,
    certificates: u.certificatesCount
      ? [{ name: "AWS Certified Developer", issuer: "Amazon Web Services", year: 2024 }]
      : [],
  });

  const { trustScore, trustBreakdown } = computeTrustScore(user);
  user.set({ trustScore, trustBreakdown, trustUpdatedAt: new Date() });
  await user.save();
  return user;
}

async function ensureProjects(userId: string, titles: string[]) {
  const existing = await Project.countDocuments({ owner: userId });
  if (existing > 0) return;
  for (const title of titles) {
    await Project.create({
      owner: userId,
      title,
      description: `${title} — a project shared on the demo profile.`,
      stack: ["TypeScript", "React"],
    });
  }
}

async function ensureConnection(fromId: string, toId: string, status: "pending" | "accepted") {
  const existing = await Connection.findOne({
    $or: [{ from: fromId, to: toId }, { from: toId, to: fromId }],
  });
  if (existing) return existing;
  return Connection.create({ from: fromId, to: toId, status });
}

async function ensureDM(userAId: string, userBId: string, sampleMessages: { from: string; text: string }[]) {
  let convo = await Conversation.findOne({
    kind: "dm",
    participants: { $all: [userAId, userBId], $size: 2 },
  });
  if (convo) return convo;

  convo = await Conversation.create({ kind: "dm", participants: [userAId, userBId] });
  for (const m of sampleMessages) {
    const msg = await Message.create({
      conversation: convo._id,
      sender: m.from,
      receiver: m.from === userAId ? userBId : userAId,
      text: m.text,
      seenBy: [m.from],
    });
    convo.lastMessage = m.text;
    convo.lastMessageAt = msg.get("createdAt");
  }
  await convo.save();
  return convo;
}

async function ensureTeam(ownerId: string, memberIds: string[]) {
  const existing = await Team.findOne({ name: "Launchpad", owner: ownerId });
  if (existing) return existing;

  const convo = await Conversation.create({ kind: "team", participants: [ownerId, ...memberIds] });
  const team = await Team.create({
    name: "Launchpad",
    tagline: "Weekend project to demo the Teams + Kanban flow",
    owner: ownerId,
    members: [ownerId, ...memberIds],
    openRoles: ["Designer"],
    stack: ["Next.js", "MongoDB"],
    stage: "building",
    conversation: convo._id,
  });

  await Task.create([
    { team: team._id, title: "Set up auth", status: "done", assignee: ownerId, priority: "high", order: 0 },
    { team: team._id, title: "Design onboarding flow", status: "in_progress", assignee: memberIds[0], priority: "med", order: 0 },
    { team: team._id, title: "Build matching algorithm", status: "review", assignee: ownerId, priority: "high", order: 0 },
    { team: team._id, title: "Write launch post", status: "todo", priority: "low", order: 0 },
  ]);

  return team;
}

async function ensureStartupIdea(authorId: string) {
  const existing = await StartupIdea.findOne({ author: authorId });
  if (existing) return existing;
  return StartupIdea.create({
    author: authorId,
    title: "Async standup bot for small teams",
    pitch: "A lightweight Slack bot that collects async standups and summarizes blockers — no meetings.",
    lookingFor: ["Cofounder", "Collaborator"],
    tags: ["SaaS", "Productivity", "Slack"],
  });
}

async function main() {
  await connectDB(env.mongoUri);

  const demo = await upsertUser(DEMO_USER, DEMO_PASSWORD);
  const others = [];
  for (const u of OTHER_USERS) {
    others.push(await upsertUser(u, "password123"));
  }

  await ensureProjects(demo.id, ["Habit Tracker API", "Realtime Kanban Board"]);

  // Demo user is connected to Priya, and has a pending request from Aiko.
  await ensureConnection(demo.id, others[0].id, "accepted");
  await ensureConnection(others[2].id, demo.id, "pending");

  await ensureDM(demo.id, others[0].id, [
    { from: others[0].id, text: "Hey! Saw we matched on backend + system design — want to jump on a call?" },
    { from: demo.id, text: "Yes! I've got some ideas for the API layer, let's sync this week." },
    { from: others[0].id, text: "Perfect, I'll send a time. Excited to build together 🚀" },
  ]);

  await ensureTeam(demo.id, [others[0].id, others[1].id]);
  await ensureStartupIdea(others[1].id);

  console.log("\n✓ Demo data seeded\n");
  console.log(`  Login:    ${DEMO_EMAIL}`);
  console.log(`  Password: ${DEMO_PASSWORD}\n`);

  await mongoose.disconnect();
}

main().catch((err) => {
  console.error("Seed failed:", err);
  process.exit(1);
});
