"use client";

import { useState } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { Sparkles, Zap } from "lucide-react";
import { Button } from "@/design-system/Button";
import { MatchRadarModal } from "@/components/match/MatchRadarModal";
import { useAsync } from "@/hooks/useAsync";
import { useAuth } from "@/context/AuthContext";
import { api } from "@/lib/api";
import type { MatchSuggestion } from "@/types";
import { StatBento } from "./StatBento";
import { EngagementChart } from "./EngagementChart";
import { TopMatches } from "./TopMatches";
import { Shortlisted } from "./Shortlisted";
import { TaskBoard } from "./TaskBoard";

function greeting() {
  const h = new Date().getHours();
  if (h < 5) return "Good night";
  if (h < 12) return "Good morning";
  if (h < 17) return "Good afternoon";
  if (h < 21) return "Good evening";
  return "Good night";
}

/** Orchestrator — fetches the data every widget needs, owns the one bit
 *  of cross-cutting state (which match's radar is open), and composes
 *  independently-testable feature components for everything else. */
export function DashboardPage() {
  const { user } = useAuth();
  const { data: activity, loading: aLoading } = useAsync(api.activity);
  const { data: matches, loading: mLoading } = useAsync(api.matches, []);
  const { data: teams } = useAsync(api.teams, []);
  const [radarMatch, setRadarMatch] = useState<MatchSuggestion | null>(null);

  return (
    <div className="space-y-6">
      <header className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <motion.p initial={{ opacity: 0, y: -4 }} animate={{ opacity: 1, y: 0 }} className="mb-1 text-[11px] font-medium uppercase tracking-widest text-neon-cyan/60">
            Dashboard
          </motion.p>
          <motion.h1 initial={{ opacity: 0, y: 4 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 }} className="font-display text-2xl font-bold text-white sm:text-3xl">
            {greeting()}, {user?.name?.split(" ")[0] ?? "there"} 👋
          </motion.h1>
          <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.1 }} className="text-sm text-slate-400">
            Here's how your mesh is performing.
          </motion.p>
        </div>
        <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: 0.15 }} className="flex flex-wrap gap-2">
          <Link href="/discover"><Button size="sm"><Sparkles className="h-4 w-4" /> Find teammates</Button></Link>
          <Link href="/startups"><Button size="sm" variant="outline"><Zap className="h-4 w-4" /> Startups</Button></Link>
        </motion.div>
      </header>

      <StatBento user={user} matchesCount={matches?.length ?? 0} teamsCount={teams?.length ?? 0} />

      <div className="grid gap-4 lg:grid-cols-3">
        <EngagementChart activity={activity} loading={aLoading} />
        <TopMatches matches={matches} loading={mLoading} onSelect={setRadarMatch} />
      </div>

      <Shortlisted />
      <TaskBoard teams={teams} />

      <MatchRadarModal match={radarMatch} onClose={() => setRadarMatch(null)} />
    </div>
  );
}
