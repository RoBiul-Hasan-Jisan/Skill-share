"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { Sparkles, ArrowUpRight } from "lucide-react";
import { Panel } from "@/design-system/Panel";
import { Avatar } from "@/components/ui/Avatar";
import { ScoreRing } from "@/components/ui/ScoreRing";
import { Skeleton } from "@/components/ui/Skeleton";
import type { MatchSuggestion } from "@/types";

export function TopMatches({
  matches, loading, onSelect,
}: { matches: MatchSuggestion[] | null | undefined; loading: boolean; onSelect: (m: MatchSuggestion) => void }) {
  return (
    <Panel>
      <div className="mb-4 flex items-center justify-between">
        <div>
          <h3 className="font-display font-semibold text-white">Top matches</h3>
          <p className="mt-0.5 text-[11px] text-slate-500">Scored by stack, skills & ambition</p>
        </div>
        <Link href="/discover" className="flex items-center gap-1 text-xs text-neon-cyan hover:underline">
          View all <ArrowUpRight className="h-3 w-3" />
        </Link>
      </div>
      <div className="space-y-2">
        {loading || !matches ? (
          Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-16 w-full" />)
        ) : matches.length === 0 ? (
          <div className="flex flex-col items-center py-6 text-center">
            <Sparkles className="mb-2 h-8 w-8 text-white/10" />
            <p className="text-xs text-slate-500">Complete your profile to get ranked matches.</p>
            <Link href="/profile" className="mt-3 text-xs text-neon-cyan hover:underline">Set up profile →</Link>
          </div>
        ) : (
          matches.slice(0, 4).map((m, i) => (
            <motion.div key={m.user.id} initial={{ opacity: 0, x: -8 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.3 + i * 0.07 }}>
              <div className="group flex items-center gap-3 rounded border border-white/[0.08] bg-white/[0.02] p-2.5 transition hover:border-neon-cyan/25 hover:bg-neon-cyan/[0.03]">
                <Link href={`/profile/${m.user.id}`} className="flex min-w-0 flex-1 items-center gap-3">
                  <Avatar src={m.user.avatar} name={m.user.name} status={m.user.availability} size={36} />
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium text-white transition-colors group-hover:text-neon-cyan">{m.user.name}</p>
                    <p className="truncate text-xs text-slate-500">{m.user.role || "Developer"}</p>
                  </div>
                </Link>
                <button onClick={() => onSelect(m)} title="Why we match">
                  <ScoreRing value={m.score} size={40} />
                </button>
              </div>
            </motion.div>
          ))
        )}
      </div>
    </Panel>
  );
}
