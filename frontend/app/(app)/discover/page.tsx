"use client";

import { useState, useMemo, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useRouter } from "next/navigation";
import { Sparkles, Check, Plus, MapPin, Filter, MessageSquare, User, Clock, Radar as RadarIcon, Crown } from "lucide-react";
import { GlassCard } from "@/components/ui/GlassCard";
import { Badge } from "@/components/ui/Badge";
import { Avatar } from "@/components/ui/Avatar";
import { ScoreRing } from "@/components/ui/ScoreRing";
import { Button } from "@/components/ui/Button";
import { Skeleton } from "@/components/ui/Skeleton";
import { EmptyState } from "@/components/ui/EmptyState";
import { MatchRadarModal } from "@/components/match/MatchRadarModal";
import { useAsync } from "@/hooks/useAsync";
import { api } from "@/lib/api";
import { useToast } from "@/components/ui/Toast";
import { cn } from "@/lib/utils";
import { trustTier } from "@/lib/trust";
import type { Availability, ConnectionStatus, MatchSuggestion } from "@/types";

const modes = ["Collaborators", "Cofounders", "Hackathon"] as const;
const modeToApi: Record<(typeof modes)[number], "Collaborator" | "Cofounder" | "Hackathon"> = {
  Collaborators: "Collaborator",
  Cofounders: "Cofounder",
  Hackathon: "Hackathon",
};
const availFilters: { key: Availability | "all"; label: string }[] = [
  { key: "all", label: "Any availability" },
  { key: "available", label: "Available now" },
  { key: "open", label: "Open to offers" },
];

type StatusMap = Record<string, { status: ConnectionStatus; connectionId?: string; loading: boolean }>;

export default function Discover() {
  const [mode, setMode] = useState<(typeof modes)[number]>("Collaborators");
  const { data: matches, loading } = useAsync(() => api.matches(modeToApi[mode]), [mode]);
  const toast = useToast();
  const navigate = useRouter();
  const [avail, setAvail] = useState<Availability | "all">("all");
  const [statusMap, setStatusMap] = useState<StatusMap>({});
  const [radarMatch, setRadarMatch] = useState<MatchSuggestion | null>(null);

  const filtered = useMemo(
    () => (matches ?? []).filter((m) => avail === "all" || m.user.availability === avail).slice(),
    [matches, avail],
  );

  // Top match spotlighted separately once, rest shown as the grid below it.
  const [spotlight, ...rest] = filtered;

  useEffect(() => {
    if (!matches?.length) return;
    const initial: StatusMap = {};
    matches.forEach((m) => { initial[m.user.id] = { status: "none", loading: false }; });
    setStatusMap(initial);

    matches.forEach(async (m) => {
      try {
        const res = await api.connectionStatus(m.user.id);
        setStatusMap((prev) => ({
          ...prev,
          [m.user.id]: { status: res.status as ConnectionStatus, connectionId: res.connectionId, loading: false },
        }));
      } catch {}
    });
  }, [matches]);

  const setLoading = (id: string, loading: boolean) =>
    setStatusMap((prev) => ({ ...prev, [id]: { ...prev[id], loading } }));

  const handleConnect = async (userId: string, name: string) => {
    const current = statusMap[userId];
    if (!current || current.loading) return;
    setLoading(userId, true);

    try {
      if (current.status === "none") {
        await api.sendConnectionRequest(userId);
        setStatusMap((prev) => ({ ...prev, [userId]: { status: "pending_sent", loading: false } }));
        toast(`Connection request sent to ${name}`);
      } else if (current.status === "pending_received" && current.connectionId) {
        const { conversationId } = await api.acceptConnection(current.connectionId);
        setStatusMap((prev) => ({ ...prev, [userId]: { status: "connected", connectionId: current.connectionId, loading: false } }));
        toast(`Now connected with ${name}!`);
        if (conversationId) navigate.push("/chat");
      }
    } catch (err: any) {
      toast(err.message ?? "Action failed", "error");
      setLoading(userId, false);
    }
  };

  const openChat = async (userId: string) => {
    try {
      await api.openDm(userId);
      navigate.push("/chat");
    } catch (err: any) {
      toast(err.message ?? "Could not open chat", "error");
    }
  };

  const connectButton = (m: MatchSuggestion, size: "sm" | "md" = "sm") => {
    const s = statusMap[m.user.id] ?? { status: "none", loading: false };
    if (s.status === "connected")
      return <Button size={size} className="flex-1" onClick={() => openChat(m.user.id)}><MessageSquare className="h-4 w-4" /> Message</Button>;
    if (s.status === "pending_sent")
      return <Button size={size} variant="subtle" className="flex-1" disabled><Clock className="h-4 w-4" /> Pending</Button>;
    if (s.status === "pending_received")
      return <Button size={size} className="flex-1" loading={s.loading} onClick={() => handleConnect(m.user.id, m.user.name)}><Check className="h-4 w-4" /> Accept</Button>;
    return <Button size={size} className="flex-1" loading={s.loading} onClick={() => handleConnect(m.user.id, m.user.name)}><Plus className="h-4 w-4" /> Connect</Button>;
  };

  return (
    <div className="space-y-6">
      <header>
        <div className="flex items-center gap-2">
          <Sparkles className="h-5 w-5 text-neon-magenta" />
          <h1 className="font-display text-2xl font-bold text-white">Smart Matchmaking</h1>
        </div>
        <p className="mt-1 text-sm text-slate-400">
          Ranked by compatibility across stack, complementary skills, and goals — weighted by verified Trust Score.
        </p>
      </header>

      {/* Controls */}
      <GlassCard className="flex flex-wrap items-center gap-3">
        <div className="flex rounded-xl border border-white/10 bg-white/[0.02] p-1">
          {modes.map((m) => (
            <button
              key={m}
              onClick={() => setMode(m)}
              className={cn("relative rounded-lg px-3 py-1.5 text-sm transition", mode === m ? "text-white" : "text-slate-400 hover:text-slate-200")}
            >
              {mode === m && <motion.span layoutId="mode-pill" className="absolute inset-0 rounded-lg bg-neon-grad opacity-90" />}
              <span className="relative">{m}</span>
            </button>
          ))}
        </div>
        <div className="flex flex-wrap items-center gap-2 text-sm text-slate-400">
          <Filter className="h-4 w-4" />
          {availFilters.map((f) => (
            <button
              key={f.key}
              onClick={() => setAvail(f.key)}
              className={cn("rounded-lg border px-2.5 py-1 text-xs transition", avail === f.key ? "border-neon-cyan/40 bg-neon-cyan/10 text-neon-cyan" : "border-white/10 text-slate-400 hover:text-white")}
            >
              {f.label}
            </button>
          ))}
        </div>
      </GlassCard>

      {loading ? (
        <div className="space-y-4">
          <Skeleton className="h-40 w-full" />
          <div className="grid gap-4 md:grid-cols-2">
            {Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-48 w-full" />)}
          </div>
        </div>
      ) : filtered.length === 0 ? (
       <EmptyState
  icon={Sparkles}
  title="No matches with these filters"
  description="Try widening availability or switching modes."
  action={
    <Button variant="outline" onClick={() => setAvail("all")}>
      Reset filters
    </Button>
  }
/>
      ) : (
        <>
          {/* Top Match spotlight — the single best result gets a hero treatment */}
          {spotlight && (
            <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}>
              <GlassCard glow className="relative overflow-hidden">
                <div className="pointer-events-none absolute -right-16 -top-16 h-56 w-56 rounded-full bg-neon-grad opacity-[0.08] blur-3xl" />
                <div className="mb-3 flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-neon-cyan">
                  <Crown className="h-3.5 w-3.5" /> Top match this week
                </div>
                <div className="flex flex-col gap-5 sm:flex-row sm:items-center">
                  <button onClick={() => navigate.push(`/profile/${spotlight.user.id}`)} className="shrink-0">
                    <Avatar src={spotlight.user.avatar} name={spotlight.user.name} status={spotlight.user.availability} size={72} />
                  </button>
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <button
                        onClick={() => navigate.push(`/profile/${spotlight.user.id}`)}
                        className="font-display text-xl font-bold text-white hover:text-neon-cyan transition"
                      >
                        {spotlight.user.name}
                      </button>
                      {spotlight.user.tier !== "free" && <Badge tone="blue">{spotlight.user.tier}</Badge>}
                      <span
                        className="inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[10px]"
                        style={{ borderColor: `${trustTier(spotlight.user.trustScore).color}55`, color: trustTier(spotlight.user.trustScore).color }}
                      >
                        {trustTier(spotlight.user.trustScore).emoji} {spotlight.user.trustScore}
                      </span>
                    </div>
                    <p className="text-sm text-slate-400">{spotlight.user.role} · <MapPin className="inline h-3 w-3" /> {spotlight.user.location || "Remote"}</p>
                    <div className="mt-2 flex flex-wrap gap-1.5">
                      {spotlight.sharedStack.slice(0, 4).map((s) => <Badge key={s} tone="cyan">{s}</Badge>)}
                      {spotlight.complementary.slice(0, 2).map((s) => <Badge key={s} tone="magenta">+ {s}</Badge>)}
                    </div>
                  </div>
                  <div className="flex shrink-0 items-center gap-4">
                    <ScoreRing value={spotlight.score} size={72} label="match" />
                    <div className="flex flex-col gap-2">
                      <Button size="sm" variant="outline" onClick={() => setRadarMatch(spotlight)}>
                        <RadarIcon className="h-4 w-4" /> Why we match
                      </Button>
                      <div className="flex gap-2">{connectButton(spotlight)}</div>
                    </div>
                  </div>
                </div>
              </GlassCard>
            </motion.div>
          )}

          {/* Everyone else */}
          <div className="grid gap-4 md:grid-cols-2">
            <AnimatePresence mode="popLayout">
              {rest.map((m, i) => {
                return (
                  <motion.div
                    key={m.user.id}
                    layout
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.96 }}
                    transition={{ delay: i * 0.04 }}
                  >
                    <GlassCard className="h-full">
                      <div className="flex items-start gap-4">
                        <button onClick={() => navigate.push(`/profile/${m.user.id}`)}>
                          <Avatar src={m.user.avatar} name={m.user.name} status={m.user.availability} size={52} />
                        </button>
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-2">
                            <button
                              onClick={() => navigate.push(`/profile/${m.user.id}`)}
                              className="truncate font-display font-semibold text-white hover:text-neon-cyan transition"
                            >
                              {m.user.name}
                            </button>
                            {m.user.tier !== "free" && <Badge tone="blue">{m.user.tier}</Badge>}
                            <span
                              className="ml-auto inline-flex shrink-0 items-center gap-1 rounded-full border px-2 py-0.5 text-[10px]"
                              style={{ borderColor: `${trustTier(m.user.trustScore).color}55`, color: trustTier(m.user.trustScore).color }}
                            >
                              {trustTier(m.user.trustScore).emoji} {m.user.trustScore}
                            </span>
                          </div>
                          <p className="truncate text-sm text-slate-400">{m.user.role}</p>
                          <p className="mt-0.5 flex items-center gap-1 text-xs text-slate-500">
                            <MapPin className="h-3 w-3" /> {m.user.location || "Remote"}
                          </p>
                        </div>
                        <button onClick={() => setRadarMatch(m)} title="Why we match">
                          <ScoreRing value={m.score} label="match" />
                        </button>
                      </div>

                      <div className="mt-4 space-y-1.5">
                        {m.reasons.map((r) => (
                          <p key={r} className="flex items-start gap-2 text-xs text-slate-300">
                            <Check className="mt-0.5 h-3.5 w-3.5 shrink-0 text-neon-lime" /> {r}
                          </p>
                        ))}
                      </div>

                      <div className="mt-4 flex flex-wrap gap-1.5">
                        {m.sharedStack.map((s) => <Badge key={s} tone="cyan">{s}</Badge>)}
                        {m.complementary.map((s) => <Badge key={s} tone="magenta">+ {s}</Badge>)}
                      </div>

                      <div className="mt-5 flex flex-wrap gap-2">
                        {connectButton(m)}
                        <Button size="sm" variant="outline" onClick={() => setRadarMatch(m)}>
                          <RadarIcon className="h-4 w-4" />
                        </Button>
                        <Button size="sm" variant="outline" onClick={() => navigate.push(`/profile/${m.user.id}`)}>
                          <User className="h-4 w-4" /> Profile
                        </Button>
                      </div>
                    </GlassCard>
                  </motion.div>
                );
              })}
            </AnimatePresence>
          </div>
        </>
      )}

      <MatchRadarModal match={radarMatch} onClose={() => setRadarMatch(null)} />
    </div>
  );
}
