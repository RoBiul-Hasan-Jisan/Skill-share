import { Sparkles, MessageSquare, Rocket, Shield, Search, Kanban } from "lucide-react";

export const FEATURES = [
  { icon: Sparkles, title: "Smart matching", desc: "Ranked by skills, stack, and what you're looking for — cofounder, hackathon, or collaborator." },
  { icon: Search, title: "Developer search", desc: "Find people by name, role, skill, or stack in seconds." },
  { icon: MessageSquare, title: "Real-time chat", desc: "DMs and team rooms with typing indicators and read receipts." },
  { icon: Kanban, title: "Teams + Kanban", desc: "Spin up a team, invite people, and track work on a shared board." },
  { icon: Shield, title: "Trust Score", desc: "A transparent, composite score from profile, projects, and activity." },
  { icon: Rocket, title: "Startups board", desc: "Post an idea, find people who want to build it with you." },
];

export const STEPS = [
  { title: "Build your profile", desc: "Skills, stack, projects, and what you're looking for." },
  { title: "Get matched", desc: "See ranked teammates and cofounders — with the reasons why you match." },
  { title: "Connect and build", desc: "Message, form a team, and track work together on one board." },
];

export const STATS = [
  { value: "3.2k+", label: "Builders" },
  { value: "480", label: "Teams formed" },
  { value: "12k", label: "Matches made" },
];

export const PLANS = [
  { name: "Free", price: "$0", desc: "Everything you need to find a team.", features: ["Full matching + search", "Unlimited connections", "1 active team"] },
  { name: "Pro", price: "$9", desc: "For builders shipping seriously.", features: ["Everything in Free", "Unlimited teams", "Priority in recruiter search"], highlighted: true },
  { name: "Startup", price: "$29", desc: "For small teams hiring.", features: ["Everything in Pro", "Recruiter dashboard", "Candidate shortlisting"] },
];

export const FAQS = [
  { q: "Is the demo really free?", a: "Yes. The demo button logs you into a pre-seeded live account — real matches, a connection, and a chat — with no signup and no card." },
  { q: "How does matching actually work?", a: "We score you against other builders using skills, stack overlap, experience level, and the intent you pick (cofounder, hackathon, collaborator). Every match shows the reasons behind it, so you're never guessing." },
  { q: "Can I use it just for a hackathon?", a: "Absolutely. A lot of teams form for a weekend and stay together afterwards. You can archive a team and start a new one whenever you like." },
  { q: "Can I cancel Pro anytime?", a: "Yes — plans are month-to-month and you can downgrade to Free whenever. You keep your profile, matches, and connections." },
];
