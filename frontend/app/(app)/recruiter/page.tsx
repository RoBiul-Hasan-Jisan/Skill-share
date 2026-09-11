"use client";

import { useMemo, useState, useEffect, useRef } from "react";
import { motion } from "framer-motion";
import { useRouter } from "next/navigation";
import {
  Bookmark, BookmarkCheck, MapPin, SlidersHorizontal,
  ArrowDownWideNarrow, UserPlus, MessageSquare, Clock, Check,
} from "lucide-react";
import { GlassCard } from "@/components/ui/GlassCard";
import { Avatar } from "@/components/ui/Avatar";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Skeleton } from "@/components/ui/Skeleton";
import { EmptyState } from "@/components/ui/EmptyState";
import { useAsync } from "@/hooks/useAsync";
import { api } from "@/lib/api";
import { trustTier, TRUST_LABELS } from "@/lib/trust";
import { useToast } from "@/components/ui/Toast";
import { cn } from "@/lib/utils";
import type { DevUser, TrustBreakdown, ConnectionStatus } from "@/types";

const thresholds = [0, 30, 70, 90];

type StatusMap = Record<string, { status: ConnectionStatus; connectionId?: string; loading: boolean }>;

export default function Recruiter() {
  const { data: users, loading } = useAsync(api.users);
  const toast = useToast();
  const navigate = useRouter();

  const [minScore, setMinScore] = useState(0);
  const [sortDesc, setSortDesc] = useState(true);
  const [statusMap, setStatusMap] = useState<StatusMap>({});

  // Persist shortlist in localStorage so it survives navigation
  const [shortlist, setShortlist] = useState<Set<string>>(() => {
    try {
      const saved = localStorage.getItem("recruiter_shortlist");
      return new Set(saved ? JSON.parse(saved) : []);
    } catch { return new Set(); }
  });
  // Keep a ref to current shortlist so toggle doesn't close over stale state
  const shortlistRef = useRef(shortlist);
  shortlistRef.current = shortlist;

  useEffect(() => {
    localStorage.setItem("recruiter_shortlist", JSON.stringify([...shortlist]));
  }, [shortlist]);

  // Load connection statuses once users are loaded
  useEffect(() => {
    if (!users?.length) return;
    const initial: StatusMap = {};
    users.forEach((u) => { initial[u.id] = { status: "none", loading: false }; });
    setStatusMap(initial);
    users.forEach(async (u) => {
      try {
        const res = await api.connectionStatus(u.id);
        setStatusMap((prev) => ({
          ...prev,
          [u.id]: { status: res.status as ConnectionStatus, connectionId: res.connectionId, loading: false },
        }));
      } catch {}
    });
  }, [users]);

  const rows = useMemo(() => {
    const list = (users ?? []).filter((u) => u.trustScore >= minScore);
    return list.sort((a, b) =>
      sortDesc ? b.trustScore - a.trustScore : a.trustScore - b.trustScore,
    );
  }, [users, minScore, sortDesc]);

  const toggle = (u: DevUser) => {
    const wasListed = shortlistRef.current.has(u.id);
    setShortlist((s) => {
      const next = new Set(s);
      if (next.has(u.id)) next.delete(u.id);
      else next.add(u.id);
      return next;
    });
    // Toast called outside the updater to avoid React StrictMode double-invoke
    if (!wasListed) toast(`${u.name} added to shortlist`);
  };

  const handleConnect = async (u: DevUser, e: React.MouseEvent) => {
    e.stopPropagation();
    const s = statusMap[u.id];
    if (!s || s.loading) return;
    setStatusMap((prev) => ({ ...prev, [u.id]: { ...prev[u.id], loading: true } }));
    try {
      if (s.status === "none") {
        await api.sendConnectionRequest(u.id);
        setStatusMap((prev) => ({ ...prev, [u.id]: { status: "pending_sent", loading: false } }));
        toast(`Request sent to ${u.name}`);
      } else if (s.status === "connected") {
        const room = await api.openDm(u.id);
        navigate.push(`/chat?roomId=${room.id}`);
      }
    } catch (err: any) {
      toast(err.message ?? "Action failed", "error");
      setStatusMap((prev) => ({ ...prev, [u.id]: { ...prev[u.id], loading: false } }));
    }
  };

  return (
    <div className="space-y-6">
      <header className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="font-display text-2xl font-bold text-white">Recruiter Dashboard</h1>
          <p className="text-sm text-slate-400">Trust-ranked talent, filtered by verified Trust Score.</p>
        </div>
        <Badge tone="lime">
          <BookmarkCheck className="h-3 w-3" /> {shortlist.size} shortlisted
        </Badge>
      </header>

      {/* Controls */}
      <GlassCard className="flex flex-wrap items-center gap-4">
        <div className="flex items-center gap-2 text-sm text-slate-400">
          <SlidersHorizontal className="h-4 w-4" /> Min trust
        </div>
        <div className="flex gap-1.5">
          {thresholds.map((t) => (
            <button
              key={t}
              onClick={() => setMinScore(t)}
              className={cn(
                "rounded-lg border px-3 py-1 text-xs transition",
                minScore === t
                  ? "border-neon-cyan/40 bg-neon-cyan/10 text-neon-cyan"
                  : "border-white/10 text-slate-400 hover:text-white",
              )}
            >
              {t === 0 ? "All" : `${t}+`}
            </button>
          ))}
        </div>
        <div className="flex-1" />
        <Button variant="outline" size="sm" onClick={() => setSortDesc((v) => !v)}>
          <ArrowDownWideNarrow className="h-4 w-4" />
          {sortDesc ? "Highest first" : "Lowest first"}
        </Button>
      </GlassCard>

      {loading ? (
        <div className="space-y-3">
          {Array.from({ length: 5 }).map((_, i) => <Skeleton key={i} className="h-28 w-full" />)}
        </div>
      ) : rows.length === 0 ? (
        <EmptyState title="No developers above this threshold" description="Lower the minimum trust score to see more candidates." />
      ) : (
        <div className="space-y-3">
          {rows.map((u, i) => {
            const tier = trustTier(u.trustScore);
            const listed = shortlist.has(u.id);
            const s = statusMap[u.id] ?? { status: "none", loading: false };
            return (
              <motion.div key={u.id} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.04 }}>
                <GlassCard
                  interactive
                  className="flex cursor-pointer flex-col gap-4 lg:flex-row lg:items-center"
                  onClick={() => navigate.push(`/profile/${u.id}`)}
                >
                  {/* identity */}
                  <div className="flex items-center gap-3 lg:w-64">
                    <Avatar src={u.avatar} name={u.name} size={48} status={u.availability} />
                    <div className="min-w-0">
                      <p className="truncate font-medium text-white">{u.name}</p>
                      <p className="truncate text-xs text-slate-400">{u.role}</p>
                      <p className="mt-0.5 flex items-center gap-1 text-[11px] text-slate-500">
                        <MapPin className="h-3 w-3" />{u.location || "Remote"}
                      </p>
                    </div>
                  </div>

                  {/* trust + breakdown bars */}
                  <div className="flex items-center gap-4 lg:flex-1">
                    <div className="text-center">
                      <p className="font-display text-2xl font-bold" style={{ color: tier.color }}>{u.trustScore}</p>
                      <span className="text-[10px]" style={{ color: tier.color }}>{tier.emoji} {tier.label}</span>
                    </div>
                    <div className="grid flex-1 grid-cols-5 gap-2">
                      {(Object.keys(u.trustBreakdown) as (keyof TrustBreakdown)[]).map((k) => (
                        <div key={k}>
                          <div className="mb-1 h-16 w-full overflow-hidden rounded-md bg-white/5">
                            <div
                              className="mt-auto w-full rounded-md bg-neon-grad"
                              style={{ height: `${u.trustBreakdown[k]}%`, marginTop: `${100 - u.trustBreakdown[k]}%` }}
                            />
                          </div>
                          <p className="truncate text-center text-[9px] text-slate-500">{TRUST_LABELS[k]}</p>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* actions */}
                  <div className="flex items-center gap-2 lg:w-48 lg:justify-end" onClick={(e) => e.stopPropagation()}>
                    <div className="flex flex-wrap gap-1">
                      {u.skills.slice(0, 2).map((sk) => <Badge key={sk.name}>{sk.name}</Badge>)}
                    </div>

                    {/* Connect / Message / Pending */}
                    {s.status === "connected" ? (
                      <Button size="sm" variant="subtle" loading={s.loading} onClick={(e) => handleConnect(u, e)} title="Message">
                        <MessageSquare className="h-4 w-4" />
                      </Button>
                    ) : s.status === "pending_sent" ? (
                      <Button size="sm" variant="subtle" disabled title="Request pending">
                        <Clock className="h-4 w-4 text-slate-400" />
                      </Button>
                    ) : s.status === "pending_received" ? (
                      <Button size="sm" variant="subtle" disabled title="They sent you a request — check Connections">
                        <Check className="h-4 w-4 text-neon-lime" />
                      </Button>
                    ) : (
                      <Button size="sm" variant="outline" loading={s.loading} onClick={(e) => handleConnect(u, e)} title="Connect">
                        <UserPlus className="h-4 w-4" />
                      </Button>
                    )}

                    {/* Shortlist */}
                    <Button
                      size="sm"
                      variant={listed ? "subtle" : "outline"}
                      onClick={() => toggle(u)}
                      title={listed ? "Remove from shortlist" : "Add to shortlist"}
                    >
                      {listed
                        ? <BookmarkCheck className="h-4 w-4 text-neon-lime" />
                        : <Bookmark className="h-4 w-4" />}
                    </Button>
                  </div>
                </GlassCard>
              </motion.div>
            );
          })}
        </div>
      )}
    </div>
  );
}
