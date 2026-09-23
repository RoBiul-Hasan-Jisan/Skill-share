"use client";

import { motion } from "framer-motion";
import { Eye, Sparkles, Users, TrendingUp, ArrowUpRight } from "lucide-react";
import { Panel } from "@/design-system/Panel";
import { Badge } from "@/components/ui/Badge";
import { CountUp } from "./CountUp";
import type { DevUser } from "@/types";

const stagger = {
  hidden: { opacity: 0, y: 16 },
  show: (i: number) => ({ opacity: 1, y: 0, transition: { delay: i * 0.06, duration: 0.4, ease: [0.22, 1, 0.36, 1] as const } }),
};

export function StatBento({ user, matchesCount, teamsCount }: { user?: DevUser | null; matchesCount: number; teamsCount: number }) {
  const stats = [
    { label: "Followers", value: user?.followers ?? 0, delta: "followers", icon: Eye, tone: "cyan" as const },
    { label: "Matches", value: matchesCount, delta: "suggested", icon: Sparkles, tone: "magenta" as const },
    { label: "Teams", value: teamsCount, delta: "workspaces", icon: Users, tone: "lime" as const },
    { label: "Reputation", value: (user as any)?.rep ?? 0, delta: "rep score", icon: TrendingUp, tone: "blue" as const },
  ];
  return (
    <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
      {stats.map((s, i) => (
        <motion.div key={s.label} variants={stagger} initial="hidden" animate="show" custom={i}>
          <Panel className="group relative cursor-default overflow-hidden">
            <s.icon className="absolute -right-2 -top-2 h-14 w-14 text-white/[0.04] transition-colors group-hover:text-white/[0.07]" />
            <p className="relative text-xs font-medium uppercase tracking-wider text-slate-500">{s.label}</p>
            <p className="relative mt-2 font-display text-3xl font-bold text-white">
              <CountUp to={s.value} />
            </p>
            <Badge tone={s.tone} className="relative mt-3">
              <ArrowUpRight className="h-3 w-3" /> {s.delta}
            </Badge>
          </Panel>
        </motion.div>
      ))}
    </div>
  );
}
