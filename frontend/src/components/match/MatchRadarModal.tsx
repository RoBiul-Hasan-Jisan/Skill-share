"use client";

import { AnimatePresence, motion } from "framer-motion";
import {
  Radar, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, ResponsiveContainer,
} from "recharts";
import { X, Layers, GitCompareArrows, Sparkles, Users, ShieldCheck } from "lucide-react";
import { Avatar } from "@/components/ui/Avatar";
import { Badge } from "@/components/ui/Badge";
import { trustTier } from "@/lib/trust";
import { cn } from "@/lib/utils";
import type { MatchSuggestion } from "@/types";

interface Props {
  match: MatchSuggestion | null;
  onClose: () => void;
}

const AXES: { key: keyof MatchSuggestion["breakdown"]; label: string; hint: string; icon: typeof Layers }[] = [
  { key: "stackOverlap", label: "Stack overlap", hint: "Shared tools you can build with day one", icon: Layers },
  { key: "skillOverlap", label: "Skill overlap", hint: "Shared skills — easy to collaborate on the same code", icon: GitCompareArrows },
  { key: "complementary", label: "Complementary", hint: "Skills they bring that you don't have yet", icon: Sparkles },
  { key: "roleFit", label: "Role fit", hint: "How different your job roles are — different roles fill team gaps", icon: Users },
  { key: "trust", label: "Trust score", hint: "Verified profile strength: GitHub, projects, certificates, activity", icon: ShieldCheck },
];

/** "Why we match" — a radar breakdown of the five signals behind a match score. */
export function MatchRadarModal({ match, onClose }: Props) {
  return (
    <AnimatePresence>
      {match && (
        <motion.div
          className="fixed inset-0 z-50 grid place-items-center bg-black/70 backdrop-blur-sm p-4"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
        >
          <motion.div
            className="glass w-full max-w-lg p-6"
            initial={{ opacity: 0, y: 16, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 8, scale: 0.98 }}
            transition={{ duration: 0.2, ease: [0.2, 0.8, 0.2, 1] }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-start justify-between gap-3">
              <div className="flex items-center gap-3">
                <Avatar src={match.user.avatar} name={match.user.name} size={44} status={match.user.availability} />
                <div>
                  <p className="font-display font-semibold text-white">Why you match with {match.user.name.split(" ")[0]}</p>
                  <p className="text-xs text-slate-400">{match.user.role || "Developer"}</p>
                </div>
              </div>
              <button onClick={onClose} className="rounded-lg p-1.5 text-slate-500 hover:bg-white/5 hover:text-white transition">
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="mt-4 flex items-center justify-center">
              <div className="relative h-64 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <RadarChart
                    data={AXES.map((a) => ({ axis: a.label, value: match.breakdown[a.key] }))}
                    outerRadius="75%"
                  >
                    <PolarGrid stroke="rgba(255,255,255,0.08)" />
                    <PolarAngleAxis
                      dataKey="axis"
                      tick={{ fill: "rgba(226,232,240,0.7)", fontSize: 11 }}
                    />
                    <PolarRadiusAxis domain={[0, 100]} tick={false} axisLine={false} />
                    <Radar
                      dataKey="value"
                      stroke="#C8862E"
                      fill="#A66A22"
                      fillOpacity={0.32}
                      strokeWidth={2}
                    />
                  </RadarChart>
                </ResponsiveContainer>
                <div className="pointer-events-none absolute inset-0 grid place-items-center">
                  <div className="text-center">
                    <p className="font-display text-3xl font-bold text-white">{match.score}</p>
                    <p className="text-[10px] uppercase tracking-wide text-slate-500">match score</p>
                  </div>
                </div>
              </div>
            </div>

            <div className="mt-2 space-y-2.5">
              {AXES.map((a) => {
                const value = match.breakdown[a.key];
                const Icon = a.icon;
                return (
                  <div key={a.key} className="flex items-center gap-3">
                    <Icon className="h-3.5 w-3.5 shrink-0 text-slate-500" />
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center justify-between text-xs">
                        <span className="text-slate-300">{a.label}</span>
                        <span className="font-medium text-white">{value}%</span>
                      </div>
                      <div className="mt-1 h-1.5 w-full overflow-hidden rounded-full bg-white/10">
                        <motion.div
                          className="h-full rounded-full bg-neon-grad"
                          initial={{ width: 0 }}
                          animate={{ width: `${value}%` }}
                          transition={{ duration: 0.5, ease: "easeOut" }}
                        />
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            <div className="mt-5 flex flex-wrap items-center gap-1.5 border-t border-white/5 pt-4">
              <span
                className="inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[10px]"
                style={{ borderColor: `${trustTier(match.user.trustScore).color}55`, color: trustTier(match.user.trustScore).color }}
              >
                {trustTier(match.user.trustScore).emoji} Trust {match.user.trustScore}
              </span>
              {match.sharedStack.slice(0, 4).map((s) => <Badge key={s} tone="cyan">{s}</Badge>)}
              {match.complementary.slice(0, 3).map((s) => <Badge key={s} tone="magenta">+ {s}</Badge>)}
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
