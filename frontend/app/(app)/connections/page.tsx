"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useRouter } from "next/navigation";
import { Users, UserCheck, UserX, MessageSquare, Search, UserPlus } from "lucide-react";
import { GlassCard } from "@/components/ui/GlassCard";
import { Avatar } from "@/components/ui/Avatar";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { Skeleton } from "@/components/ui/Skeleton";
import { useAsync } from "@/hooks/useAsync";
import { api } from "@/lib/api";
import { useToast } from "@/components/ui/Toast";
import { cn } from "@/lib/utils";
import type { ConnectionItem, PendingRequest } from "@/types";

export default function Connections() {
  const { data: connections, loading } = useAsync(api.connections);
  const { data: pending, loading: pendingLoading, setData: setPending } = useAsync(api.pendingRequests);
  const [tab, setTab] = useState<"connections" | "pending">("connections");
  const [search, setSearch] = useState("");
  const [accepting, setAccepting] = useState<string | null>(null);
  const [rejecting, setRejecting] = useState<string | null>(null);
  const toast = useToast();
  const navigate = useRouter();

  const filteredConnections = (connections ?? []).filter((c) =>
    c.user.name.toLowerCase().includes(search.toLowerCase()) ||
    (c.user.role ?? "").toLowerCase().includes(search.toLowerCase()),
  );

  const pendingCount = pending?.length ?? 0;

  const accept = async (req: PendingRequest) => {
    setAccepting(String(req._id));
    try {
      const result = await api.acceptConnection(String(req._id));
      setPending((prev) => (prev ?? []).filter((p) => String(p._id) !== String(req._id)));
      toast(`Connected with ${(req.from as any)?.name ?? "user"}!`);
      if (result.conversationId) {
        navigate.push(`/chat?roomId=${result.conversationId}`);
      }
    } catch (err: any) {
      toast(err.message ?? "Failed to accept", "error");
    } finally {
      setAccepting(null);
    }
  };

  const reject = async (req: PendingRequest) => {
    setRejecting(String(req._id));
    try {
      await api.rejectConnection(String(req._id));
      setPending((prev) => (prev ?? []).filter((p) => String(p._id) !== String(req._id)));
      toast("Request declined");
    } catch (err: any) {
      toast(err.message ?? "Failed to reject", "error");
    } finally {
      setRejecting(null);
    }
  };

  const openDm = async (userId: string) => {
    try {
      await api.openDm(userId);
      navigate.push("/chat");
    } catch {
      navigate.push("/chat");
    }
  };

  return (
    <div className="space-y-6">
      <header className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="font-display text-2xl font-bold text-white">Connections</h1>
          <p className="text-sm text-slate-400">Your network of developers and collaborators.</p>
        </div>
        <Button size="sm" variant="outline" onClick={() => navigate.push("/discover")}>
          <UserPlus className="h-4 w-4" /> Find people
        </Button>
      </header>

      {/* Tabs */}
      <div className="flex gap-1 rounded-xl border border-white/10 bg-white/[0.02] p-1 w-fit">
        {([
          { key: "connections", label: "Connections", count: connections?.length },
          { key: "pending", label: "Pending", count: pendingCount },
        ] as const).map((t) => (
          <button
            key={t.key}
            onClick={() => setTab(t.key)}
            className={cn(
              "relative flex items-center gap-1.5 rounded-lg px-4 py-2 text-sm font-medium transition",
              tab === t.key ? "text-white" : "text-slate-400 hover:text-slate-200",
            )}
          >
            {tab === t.key && <motion.span layoutId="conn-tab" className="absolute inset-0 rounded-lg bg-white/[0.08]" />}
            <span className="relative">{t.label}</span>
            {(t.count ?? 0) > 0 && (
              <span className={cn(
                "relative grid h-5 min-w-5 place-items-center rounded-full px-1 text-[10px] font-bold",
                t.key === "pending" ? "bg-neon-grad text-ink-950" : "bg-white/10 text-slate-300",
              )}>
                {t.count}
              </span>
            )}
          </button>
        ))}
      </div>

      <AnimatePresence mode="wait">
        {tab === "connections" && (
          <motion.div key="connections" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="space-y-4">
            {/* Search */}
            <div className="flex items-center gap-2 rounded-xl border border-white/10 bg-white/[0.03] px-3 py-2.5 max-w-sm">
              <Search className="h-4 w-4 text-slate-500" />
              <input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search connections…"
                className="w-full bg-transparent text-sm outline-none placeholder:text-slate-500"
              />
            </div>

            {loading ? (
              <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                {Array.from({ length: 6 }).map((_, i) => <Skeleton key={i} className="h-40 w-full" />)}
              </div>
            ) : filteredConnections.length === 0 ? (
              <GlassCard className="py-16 text-center">
                <Users className="mx-auto mb-4 h-10 w-10 text-slate-600" />
                <p className="text-slate-400">{search ? "No connections match your search." : "No connections yet. Discover developers to connect with!"}</p>
                {!search && (
                  <Button className="mt-4" onClick={() => navigate.push("/discover")}>
                    <UserPlus className="h-4 w-4" /> Discover people
                  </Button>
                )}
              </GlassCard>
            ) : (
              <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                {filteredConnections.map((c, i) => (
                  <ConnectionCard key={c.connectionId} item={c} index={i} onMessage={openDm} onProfile={(id) => navigate.push(`/profile/${id}`)} />
                ))}
              </div>
            )}
          </motion.div>
        )}

        {tab === "pending" && (
          <motion.div key="pending" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="space-y-3">
            {pendingLoading ? (
              <div className="space-y-3">
                {Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-24 w-full" />)}
              </div>
            ) : !pending || pending.length === 0 ? (
              <GlassCard className="py-16 text-center">
                <UserCheck className="mx-auto mb-4 h-10 w-10 text-slate-600" />
                <p className="text-slate-400">No pending connection requests.</p>
              </GlassCard>
            ) : (
              pending.map((req, i) => {
                const from = req.from as any;
                return (
                  <motion.div key={String(req._id)} initial={{ opacity: 0, x: -16 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 16 }} transition={{ delay: i * 0.05 }}>
                    <GlassCard className="flex items-center gap-4">
                      <button onClick={() => navigate.push(`/profile/${from?._id ?? from?.id}`)}>
                        <Avatar src={from?.avatar} name={from?.name ?? "?"} size={48} status={from?.availability} className="shrink-0" />
                      </button>
                      <div className="min-w-0 flex-1">
                        <button onClick={() => navigate.push(`/profile/${from?._id ?? from?.id}`)} className="text-left">
                          <p className="font-medium text-white hover:text-neon-cyan transition">{from?.name ?? "Unknown"}</p>
                          <p className="text-xs text-slate-400 truncate">{from?.role ?? "Developer"}</p>
                        </button>
                        {from?.stack && from.stack.length > 0 && (
                          <div className="mt-1.5 flex flex-wrap gap-1">
                            {from.stack.slice(0, 3).map((s: string) => <Badge key={s} tone="cyan" className="text-[10px] px-1.5 py-0.5">{s}</Badge>)}
                          </div>
                        )}
                      </div>
                      <div className="flex gap-2 shrink-0">
                        <Button
                          size="sm"
                          loading={accepting === String(req._id)}
                          onClick={() => accept(req)}
                        >
                          <UserCheck className="h-3.5 w-3.5" /> Accept
                        </Button>
                        <Button
                          size="sm"
                          variant="ghost"
                          loading={rejecting === String(req._id)}
                          onClick={() => reject(req)}
                          className="text-slate-400 hover:text-neon-magenta"
                        >
                          <UserX className="h-3.5 w-3.5" />
                        </Button>
                      </div>
                    </GlassCard>
                  </motion.div>
                );
              })
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

function ConnectionCard({ item, index, onMessage, onProfile }: {
  item: ConnectionItem; index: number;
  onMessage: (id: string) => void;
  onProfile: (id: string) => void;
}) {
  const u = item.user as any;
  return (
    <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: index * 0.06 }}>
      <GlassCard interactive className="flex flex-col gap-3">
        <div className="flex items-start gap-3">
          <button onClick={() => onProfile(u._id ?? u.id)}>
            <Avatar src={u.avatar} name={u.name} size={48} status={u.availability} className="shrink-0" />
          </button>
          <div className="min-w-0 flex-1">
            <button onClick={() => onProfile(u._id ?? u.id)} className="text-left">
              <p className="font-medium text-white hover:text-neon-cyan transition truncate">{u.name}</p>
              <p className="text-xs text-slate-400 truncate">{u.role ?? "Developer"}</p>
            </button>
          </div>
        </div>
        {u.stack && u.stack.length > 0 && (
          <div className="flex flex-wrap gap-1">
            {u.stack.slice(0, 4).map((s: string) => <Badge key={s} tone="cyan">{s}</Badge>)}
          </div>
        )}
        <div className="flex gap-2 pt-1">
          <Button size="sm" className="flex-1" onClick={() => onMessage(u._id ?? u.id)}>
            <MessageSquare className="h-3.5 w-3.5" /> Message
          </Button>
          <Button size="sm" variant="outline" onClick={() => onProfile(u._id ?? u.id)}>
            View
          </Button>
        </div>
      </GlassCard>
    </motion.div>
  );
}
