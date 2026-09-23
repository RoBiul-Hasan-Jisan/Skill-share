import {
  LayoutDashboard, Sparkles, Users, MessageSquare, Rocket,
  CreditCard, Briefcase, UserPlus,
} from "lucide-react";

export const navItems = [
  { to: "/dashboard",   label: "Dashboard",     icon: LayoutDashboard },
  { to: "/discover",    label: "Smart Matching", icon: Sparkles },
  { to: "/connections", label: "Connections",   icon: UserPlus },
  { to: "/chat",        label: "Chat",          icon: MessageSquare },
  { to: "/teams",       label: "Teams",         icon: Users },
  { to: "/startups",    label: "Startups",      icon: Rocket },
  { to: "/recruiter",   label: "Recruiter",     icon: Briefcase },
  { to: "/billing",     label: "Billing",       icon: CreditCard },
];

export const mobileNavItems = [
  { to: "/dashboard",   label: "Home",    icon: LayoutDashboard },
  { to: "/discover",    label: "Match",   icon: Sparkles },
  { to: "/connections", label: "Network", icon: UserPlus },
  { to: "/chat",        label: "Chat",    icon: MessageSquare },
  { to: "/teams",       label: "Teams",   icon: Users },
];
