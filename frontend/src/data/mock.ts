import type {
  DevUser,
  MatchSuggestion,
  Team,
  StartupIdea,
  Task,
  ChatRoom,
  ChatMessage,
  ActivityPoint,
  TrustBreakdown,
} from "@/types";

const av = (seed: number) =>
  `https://api.dicebear.com/9.x/glass/svg?seed=devmesh${seed}`;

// Composite trust = weighted sum of sub-scores (see lib/trust.ts for weights).
const tb = (p: number, g: number, c: number, pr: number, a: number): TrustBreakdown => ({
  profile: p, github: g, certificates: c, projects: pr, activity: a,
});

export const me: DevUser = {
  id: "u0",
  name: "Aria Chen",
  handle: "ariac",
  avatar: av(0),
  role: "Full-stack + AI Engineer",
  bio: "Shipping AI products. TS all day, Python when the models call. Looking for a design-minded cofounder.",
  location: "Remote · GMT+6",
  availability: "open",
  tier: "pro",
  skills: [
    { name: "TypeScript", level: 94 },
    { name: "React", level: 90 },
    { name: "Node.js", level: 85 },
    { name: "LLM / RAG", level: 80 },
    { name: "Postgres", level: 72 },
  ],
  stack: ["Next.js", "Node", "FastAPI", "MongoDB", "OpenAI", "Redis"],
  github: "ariac",
  website: "aria.dev",
  twitter: "ariacodes",
  followers: 4820,
  projects: 23,
  rep: 982,
  certificates: 6,
  userType: "developer" as const, onboardingComplete: true, trustScore: 88,
  trustBreakdown: tb(92, 86, 80, 95, 78), lookingFor: ["Cofounder"],
};

export const users: DevUser[] = [
  {
    id: "u1", name: "Kofi Mensah", handle: "kofidesigns", avatar: av(1),
    role: "Product Designer / Frontend",
    bio: "I make AI products feel human. Figma → React. Looking to cofound.",
    location: "Accra · GMT", availability: "available", tier: "startup",
    skills: [
      { name: "UI/UX", level: 96 }, { name: "React", level: 82 },
      { name: "Framer", level: 90 }, { name: "Design Systems", level: 88 },
    ],
    stack: ["Figma", "React", "Tailwind", "Framer Motion"],
    github: "kofim", followers: 9100, projects: 41, rep: 1240, certificates: 9,
    userType: "developer" as const, onboardingComplete: true, trustScore: 93, trustBreakdown: tb(98, 84, 95, 96, 88), lookingFor: ["Cofounder", "Hackathon"],
  },
  {
    id: "u2", name: "Lena Ortiz", handle: "lena_ml", avatar: av(2),
    role: "ML Engineer",
    bio: "Vector search, embeddings, eval pipelines. Ex-research, now building.",
    location: "Lisbon · GMT", availability: "open", tier: "pro",
    skills: [
      { name: "Python", level: 95 }, { name: "LangChain", level: 88 },
      { name: "PyTorch", level: 84 }, { name: "Vector DBs", level: 86 },
    ],
    stack: ["FastAPI", "LangChain", "Pinecone", "OpenAI"],
    github: "lenao", followers: 3300, projects: 17, rep: 870, certificates: 7,
    userType: "developer" as const, onboardingComplete: true, trustScore: 84, trustBreakdown: tb(80, 90, 88, 82, 76), lookingFor: ["Collaborator"],
  },
  {
    id: "u3", name: "Devon Park", handle: "devops_dev", avatar: av(3),
    role: "Platform / DevOps",
    bio: "Make it scale, make it cheap. K8s, Terraform, observability.",
    location: "Seoul · GMT+9", availability: "busy", tier: "free",
    skills: [
      { name: "Kubernetes", level: 91 }, { name: "Terraform", level: 87 },
      { name: "Go", level: 78 }, { name: "AWS", level: 89 },
    ],
    stack: ["K8s", "Terraform", "Go", "AWS", "Grafana"],
    github: "devonp", followers: 2100, projects: 12, rep: 640, certificates: 3,
    userType: "developer" as const, onboardingComplete: true, trustScore: 67, trustBreakdown: tb(58, 82, 45, 72, 70), lookingFor: [],
  },
  {
    id: "u4", name: "Sara Haddad", handle: "sarah_builds", avatar: av(4),
    role: "Founder / Growth",
    bio: "2x founder, 1 exit. I do the parts engineers hate. Seeking technical cofounder.",
    location: "Dubai · GMT+4", availability: "available", tier: "startup",
    skills: [
      { name: "Growth", level: 92 }, { name: "Sales", level: 85 },
      { name: "Product", level: 80 },
    ],
    stack: ["Notion", "HubSpot", "Mixpanel"],
    followers: 15400, projects: 8, rep: 1510, certificates: 4,
    userType: "developer" as const, onboardingComplete: true, trustScore: 74, trustBreakdown: tb(88, 30, 60, 78, 95), lookingFor: ["Cofounder"],
  },
  {
    id: "u5", name: "Tomas Veir", handle: "tveir", avatar: av(5),
    role: "Backend Engineer",
    bio: "Distributed systems, event-driven everything. Rust curious.",
    location: "Berlin · GMT+1", availability: "open", tier: "pro",
    skills: [
      { name: "Node.js", level: 90 }, { name: "Postgres", level: 88 },
      { name: "Kafka", level: 80 }, { name: "Rust", level: 65 },
    ],
    stack: ["Node", "Postgres", "Kafka", "Redis"],
    github: "tveir", followers: 1800, projects: 19, rep: 720, certificates: 2,
    userType: "developer" as const, onboardingComplete: true, trustScore: 71, trustBreakdown: tb(70, 88, 35, 80, 68), lookingFor: ["Hackathon"],
  },
  {
    id: "u6", name: "Mia Novak", handle: "mianovak", avatar: av(6),
    role: "Frontend Engineer",
    bio: "New grad. Strong on React, learning the rest. Eager to join a team.",
    location: "Zagreb · GMT+1", availability: "available", tier: "free",
    skills: [{ name: "React", level: 68 }, { name: "CSS", level: 74 }],
    stack: ["React", "Tailwind"],
    followers: 210, projects: 2, rep: 90, certificates: 0,
    userType: "developer" as const, onboardingComplete: true, trustScore: 28, trustBreakdown: tb(35, 20, 0, 30, 40), lookingFor: [],
  },
];

const all = [me, ...users];
export const findUser = (id: string) => all.find((u) => u.id === id);

export const matches: MatchSuggestion[] = [
  {
    user: users[0], score: 96,
    reasons: [
      "Complements your backend skills with senior design",
      "Both targeting AI products, both want to cofound",
      "Overlapping React stack means zero ramp-up",
    ],
    sharedStack: ["React", "Tailwind"], complementary: ["UI/UX", "Design Systems"],
  },
  {
    user: users[1], score: 91,
    reasons: [
      "Owns the ML layer you'd otherwise build alone",
      "Shared FastAPI + OpenAI stack",
      "Availability aligns (open to new project)",
    ],
    sharedStack: ["FastAPI", "OpenAI"], complementary: ["LangChain", "Vector DBs"],
  },
  {
    user: users[3], score: 84,
    reasons: [
      "Non-technical cofounder profile you've been searching for",
      "Proven growth + sales track record",
      "Same product ambition (B2B AI tooling)",
    ],
    sharedStack: [], complementary: ["Growth", "Sales", "Product"],
  },
  {
    user: users[4], score: 79,
    reasons: [
      "Deep backend coverage frees you for AI work",
      "Postgres + Redis overlap",
      "Strong systems reputation",
    ],
    sharedStack: ["Postgres", "Redis"], complementary: ["Kafka", "Distributed Systems"],
  },
];

export const teams: Team[] = [
  {
    id: "t1", name: "Synthwave Labs",
    tagline: "AI copilots for indie game studios",
    members: [me, users[0], users[1]],
    openRoles: ["Backend Engineer", "Gameplay Dev"],
    stack: ["Next.js", "FastAPI", "OpenAI", "Postgres"], stage: "building",
  },
  {
    id: "t2", name: "Mesh Finance",
    tagline: "Open-source ledger for solo founders",
    members: [users[4], users[2]],
    openRoles: ["Designer", "Full-stack"],
    stack: ["Node", "React", "Stripe"], stage: "idea",
  },
];

export const ideas: StartupIdea[] = [
  {
    id: "i1", title: "Async standup, but the AI writes it",
    pitch: "Connects to GitHub + Linear, drafts a daily standup per engineer, posts to Slack. Removes the most-hated meeting.",
    author: users[4], lookingFor: ["Full-stack", "ML Engineer"],
    tags: ["devtools", "ai", "b2b"], upvotes: 214, comments: 38,
  },
  {
    id: "i2", title: "RAG over your company's tribal knowledge",
    pitch: "Index Notion, Slack, and Google Drive into a single answer engine that cites sources. Onboarding from weeks to hours.",
    author: users[1], lookingFor: ["Frontend", "Designer"],
    tags: ["rag", "search", "enterprise"], upvotes: 167, comments: 24,
  },
  {
    id: "i3", title: "Hackathon teammate finder (this app, meta)",
    pitch: "Real-time matching for hackathon weekends — find the missing skill on your team in under 60 seconds.",
    author: users[0], lookingFor: ["Backend", "Growth"],
    tags: ["community", "realtime"], upvotes: 98, comments: 12,
  },
];

export const tasks: Task[] = [
  { id: "k1", title: "Design onboarding flow", status: "in_progress", assignee: users[0], priority: "high" },
  { id: "k2", title: "Embeddings pipeline v2", status: "in_progress", assignee: users[1], priority: "high" },
  { id: "k3", title: "Stripe webhook hardening", status: "todo", assignee: me, priority: "med" },
  { id: "k4", title: "Socket reconnect logic", status: "review", assignee: users[4], priority: "med" },
  { id: "k5", title: "Landing page polish", status: "done", assignee: users[0], priority: "low" },
  { id: "k6", title: "Match scoring eval set", status: "todo", assignee: users[1], priority: "high" },
  { id: "k7", title: "Profile analytics charts", status: "done", assignee: me, priority: "low" },
];

// ---- Chat seed data (DM + team rooms) ----
export const rooms: ChatRoom[] = [
  { id: "dm-u1", kind: "dm", name: users[0].name, avatar: users[0].avatar, members: [users[0]], online: true, unread: 2, lastMessage: "Pushed the new hero — take a look 👀", ts: "2m" },
  { id: "dm-u2", kind: "dm", name: users[1].name, avatar: users[1].avatar, members: [users[1]], online: true, unread: 0, lastMessage: "Eval set is at 0.91 recall now", ts: "18m" },
  { id: "team-t1", kind: "team", name: "Synthwave Labs", members: teams[0].members, online: true, unread: 5, lastMessage: "Kofi: shipping the board today", ts: "32m" },
  { id: "dm-u4", kind: "dm", name: users[3].name, avatar: users[3].avatar, members: [users[3]], online: false, unread: 1, lastMessage: "Can we sync on pricing tiers?", ts: "1h" },
  { id: "team-t2", kind: "team", name: "Mesh Finance", members: teams[1].members, online: false, unread: 0, lastMessage: "Tomas: ledger schema v2 merged ✅", ts: "3h" },
];

export const seedMessages: Record<string, ChatMessage[]> = {
  "dm-u1": [
    { id: "m1", roomId: "dm-u1", senderId: "u1", fromMe: false, text: "Pushed the new hero — take a look 👀", ts: "10:02", seenBy: ["u0"], reactions: [{ emoji: "🔥", by: ["u0"] }] },
    { id: "m2", roomId: "dm-u1", senderId: "u0", fromMe: true, text: "On it. The gradient is 🔥", ts: "10:03", seenBy: ["u1"] },
    { id: "m3", roomId: "dm-u1", senderId: "u0", fromMe: true, text: "Can we make the CTA pulse on hover?", ts: "10:03", seenBy: ["u1"] },
    { id: "m4", roomId: "dm-u1", senderId: "u1", fromMe: false, text: "Already did — check the glow-border util", ts: "10:05", seenBy: ["u0"] },
  ],
  "dm-u2": [
    { id: "n1", roomId: "dm-u2", senderId: "u2", fromMe: false, text: "Eval set is at 0.91 recall now", ts: "09:40", seenBy: ["u0"] },
    { id: "n2", roomId: "dm-u2", senderId: "u0", fromMe: true, text: "Huge. Let's wire it into discover ranking", ts: "09:42", seenBy: ["u2"] },
  ],
  "team-t1": [
    { id: "g1", roomId: "team-t1", senderId: "u1", fromMe: false, text: "shipping the board today", ts: "09:10", seenBy: ["u0", "u2"] },
    { id: "g2", roomId: "team-t1", senderId: "u2", fromMe: false, text: "embeddings pipeline is green ✅", ts: "09:12", seenBy: ["u0"] },
    { id: "g3", roomId: "team-t1", senderId: "u0", fromMe: true, text: "🙌 let's demo at 5", ts: "09:13", seenBy: ["u1"] },
  ],
  "dm-u4": [
    { id: "p1", roomId: "dm-u4", senderId: "u4", fromMe: false, text: "Can we sync on pricing tiers?", ts: "Yesterday", seenBy: [] },
  ],
  "team-t2": [
    { id: "q1", roomId: "team-t2", senderId: "u5", fromMe: false, text: "ledger schema v2 merged ✅", ts: "Mon", seenBy: ["u0"] },
  ],
};

export const activity: ActivityPoint[] = [
  { day: "Mon", views: 120, matches: 4 },
  { day: "Tue", views: 198, matches: 6 },
  { day: "Wed", views: 240, matches: 5 },
  { day: "Thu", views: 310, matches: 9 },
  { day: "Fri", views: 280, matches: 7 },
  { day: "Sat", views: 360, matches: 12 },
  { day: "Sun", views: 420, matches: 14 },
];
