"use client";

import { useEffect, useState, useMemo } from "react";
import { useParams, useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import {
  Github, Globe, Twitter, MapPin, MessageSquare,
  UserPlus, UserCheck, Clock, Award, FolderGit2,
  ExternalLink, Lightbulb, Activity, GitCommit,
  Star, GitFork, BookOpen,
} from "lucide-react";
import { BarChart, Bar, XAxis, YAxis, ResponsiveContainer, Cell, Tooltip } from "recharts";
import { GlassCard } from "@/components/ui/GlassCard";
import { Endorsements } from "@/components/profile/Endorsements";
import { Badge } from "@/components/ui/Badge";
import { Avatar } from "@/components/ui/Avatar";
import { Button } from "@/components/ui/Button";
import { Skeleton } from "@/components/ui/Skeleton";
import { TrustMeter } from "@/components/ui/TrustMeter";
import { ScoreRing } from "@/components/ui/ScoreRing";
import { useToast } from "@/components/ui/Toast";
import { api } from "@/lib/api";
import { fmt } from "@/lib/utils";
import { TRUST_LABELS, trustTier, trustSuggestions } from "@/lib/trust";
import { useAuth } from "@/context/AuthContext";
import type { DevUser, Project, Certificate, ConnectionStatus } from "@/types";

type ProfileUser = DevUser & { certificatesList: Certificate[] };

/* ─── Animated empty state ──────────────────────────────────────── */
function EmptyState({
  icon: Icon,
  title,
  subtitle,
}: {
  icon: React.ElementType;
  title: string;
  subtitle: string;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      className="flex flex-col items-center justify-center py-10 text-center"
    >
      <div className="relative mb-4">
        <motion.div
          animate={{ scale: [1, 1.08, 1] }}
          transition={{ duration: 2.5, repeat: Infinity, ease: "easeInOut" }}
          className="grid h-14 w-14 place-items-center rounded-2xl border border-white/[0.07] bg-white/[0.03]"
        >
          <Icon className="h-6 w-6 text-white/20" />
        </motion.div>
        {/* Glow ring */}
        <motion.div
          animate={{ opacity: [0.3, 0.7, 0.3], scale: [1, 1.15, 1] }}
          transition={{ duration: 2.5, repeat: Infinity, ease: "easeInOut" }}
          className="absolute inset-0 rounded-2xl"
          style={{ boxShadow: "0 0 20px rgba(59,130,246,0.06)" }}
        />
      </div>
      <p className="text-sm font-medium text-white/30">{title}</p>
      <p className="mt-1 text-xs text-white/15">{subtitle}</p>
      {/* Dashed shimmer lines */}
      <div className="mt-5 flex flex-col items-center gap-2 w-full max-w-[200px]">
        {[100, 75, 55].map((w, i) => (
          <motion.div
            key={i}
            className="h-1.5 rounded-full bg-white/[0.04]"
            style={{ width: `${w}%` }}
            animate={{ opacity: [0.4, 0.8, 0.4] }}
            transition={{ duration: 1.8, repeat: Infinity, delay: i * 0.2 }}
          />
        ))}
      </div>
    </motion.div>
  );
}

/* ─── Activity grid ─────────────────────────────────────────────── */
function ActivityGrid() {
  const weeks = 24;
  const days = 7;

  const grid = useMemo(() => {
    return Array.from({ length: weeks }, (_, wi) =>
      Array.from({ length: days }, (_, di) => {
        // Simulate some activity with a natural-looking pattern
        const seed = (wi * 7 + di + 13) * 2654435761;
        const pseudo = ((seed ^ (seed >> 16)) >>> 0) / 0xffffffff;
        const burst = wi > 10 && wi < 16 ? 0.4 : 0; // active period
        const val = Math.max(0, Math.min(4, Math.round((pseudo + burst) * 4)));
        return val;
      })
    );
  }, []);

  const levelColor = (v: number) => {
    if (v === 0) return "bg-white/[0.04] border-white/[0.04]";
    if (v === 1) return "bg-[#C8862E]/[0.12] border-[#C8862E]/[0.08]";
    if (v === 2) return "bg-[#C8862E]/[0.25] border-[#C8862E]/[0.15]";
    if (v === 3) return "bg-[#C8862E]/[0.45] border-[#C8862E]/[0.3]";
    return "bg-[#C8862E]/[0.7] border-[#C8862E]/[0.5]";
  };

  return (
    <div className="overflow-x-auto">
      <div className="flex gap-[3px] min-w-fit">
        {grid.map((week, wi) => (
          <div key={wi} className="flex flex-col gap-[3px]">
            {week.map((val, di) => (
              <motion.div
                key={di}
                initial={{ opacity: 0, scale: 0.5 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: (wi * 7 + di) * 0.002, duration: 0.25 }}
                className={`h-[10px] w-[10px] rounded-[2px] border ${levelColor(val)}`}
                title={val === 0 ? "No activity" : `${val} contribution${val > 1 ? "s" : ""}`}
              />
            ))}
          </div>
        ))}
      </div>
      <div className="mt-2.5 flex items-center gap-1.5 justify-end">
        <span className="text-[10px] text-white/20">Less</span>
        {[0, 1, 2, 3, 4].map((v) => (
          <div key={v} className={`h-[10px] w-[10px] rounded-[2px] border ${levelColor(v)}`} />
        ))}
        <span className="text-[10px] text-white/20">More</span>
      </div>
    </div>
  );
}

/* ─── GitHub section ────────────────────────────────────────────── */
function GitHubCard({ handle }: { handle?: string }) {
  if (!handle) {
    return (
      <GlassCard>
        <div className="flex items-center gap-2 mb-4">
          <Github className="h-4 w-4 text-white/30" />
          <h3 className="font-display font-semibold text-white">GitHub</h3>
        </div>
        <EmptyState
          icon={Github}
          title="No GitHub connected"
          subtitle="This developer hasn't linked their GitHub"
        />
      </GlassCard>
    );
  }

  return (
    <GlassCard>
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Github className="h-4 w-4 text-white/60" />
          <h3 className="font-display font-semibold text-white">GitHub</h3>
        </div>
        <a
          href={`https://github.com/${handle}`}
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center gap-1 text-xs text-neon-cyan hover:underline"
        >
          @{handle} <ExternalLink className="h-3 w-3" />
        </a>
      </div>
      {/* Fake stats row */}
      <div className="grid grid-cols-3 gap-2 mb-4">
        {[
          { icon: BookOpen, label: "Repos", value: "—" },
          { icon: Star, label: "Stars", value: "—" },
          { icon: GitFork, label: "Forks", value: "—" },
        ].map((s) => (
          <div key={s.label} className="flex flex-col items-center rounded-xl border border-white/[0.06] bg-white/[0.02] py-2.5 gap-1">
            <s.icon className="h-3.5 w-3.5 text-white/20" />
            <p className="font-display text-base font-bold text-white/40">{s.value}</p>
            <p className="text-[10px] text-white/20">{s.label}</p>
          </div>
        ))}
      </div>
      <p className="text-[11px] font-medium text-white/25 mb-2 flex items-center gap-1.5">
        <GitCommit className="h-3 w-3" /> Contribution activity
      </p>
      <ActivityGrid />
    </GlassCard>
  );
}

export default function UserProfile() {
  const { id } = useParams<{ id: string }>();
  const { user: me } = useAuth();
  const navigate = useRouter();
  const toast = useToast();

  const [profile, setProfile] = useState<ProfileUser | null>(null);
  const [projects, setProjects] = useState<Project[]>([]);
  const [connStatus, setConnStatus] = useState<{ status: ConnectionStatus; connectionId?: string }>({ status: "none" });
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);

  const isMe = id === me?.id;

  useEffect(() => {
    if (!id) return;
    if (isMe) { navigate.replace("/profile"); return; }

    setLoading(true);
    Promise.all([
      api.user(id),
      api.userProjects(id),
      api.connectionStatus(id),
    ]).then(([u, projs, status]) => {
      if (u) setProfile(u);
      setProjects(projs);
      setConnStatus({ status: status.status as ConnectionStatus, connectionId: status.connectionId });
    }).catch(() => toast("Failed to load profile", "error"))
      .finally(() => setLoading(false));
  }, [id, isMe, navigate, toast]);

  const handleConnect = async () => {
    if (!profile) return;
    setActionLoading(true);
    try {
      if (connStatus.status === "none") {
        await api.sendConnectionRequest(profile.id);
        setConnStatus({ status: "pending_sent" });
        toast(`Connection request sent to ${profile.name}`);
      } else if (connStatus.status === "pending_received" && connStatus.connectionId) {
        const { conversationId } = await api.acceptConnection(connStatus.connectionId);
        setConnStatus({ status: "connected" });
        toast(`You're now connected with ${profile.name}!`);
        if (conversationId) navigate.push(`/chat`);
      } else if (connStatus.status === "connected") {
        if (!connStatus.connectionId) return;
        await api.removeConnection(profile.id);
        setConnStatus({ status: "none" });
        toast("Connection removed");
      }
    } catch (err: any) {
      toast(err.message ?? "Action failed", "error");
    } finally {
      setActionLoading(false);
    }
  };

  const handleMessage = async () => {
    if (!profile) return;
    try {
      await api.openDm(profile.id);
      navigate.push("/chat");
    } catch (err: any) {
      toast(err.message ?? "Could not open chat", "error");
    }
  };

  if (loading) return (
    <div className="space-y-4">
      <Skeleton className="h-40 w-full" />
      <div className="grid gap-4 md:grid-cols-3">
        <Skeleton className="h-64 md:col-span-2" />
        <Skeleton className="h-64" />
      </div>
    </div>
  );

  if (!profile) return (
    <div className="flex flex-col items-center justify-center py-24 text-slate-400">
      <p className="text-lg font-semibold">User not found</p>
      <Button variant="outline" className="mt-4" onClick={() => navigate.back()}>Go back</Button>
    </div>
  );

  const tier = trustTier(profile.trustScore);
  const breakdownData = profile.trustBreakdown
    ? (Object.keys(profile.trustBreakdown) as (keyof typeof profile.trustBreakdown)[]).map((k) => ({
        name: TRUST_LABELS[k],
        value: profile.trustBreakdown[k],
      }))
    : [];
  const barColor = (v: number) => v >= 80 ? "#55805F" : v >= 50 ? "#C8862E" : "#A8503D";

  return (
    <div className="space-y-6">
      {/* Banner */}
      <GlassCard glow className="relative overflow-hidden p-0">
        <div className="h-24 bg-neon-soft sm:h-28" />
        <div className="flex flex-col gap-4 px-4 pb-5 sm:flex-row sm:items-end sm:justify-between sm:px-6 sm:pb-6">
          <div className="flex items-end gap-4">
            <div className="-mt-10 sm:-mt-12">
              <Avatar
                src={profile.avatar}
                name={profile.name}
                size={80}
                status={profile.availability}
                className="ring-4 ring-ink-950 sm:h-[92px] sm:w-[92px]"
              />
            </div>
            <div className="pb-1">
              <div className="flex flex-wrap items-center gap-2">
                <h1 className="font-display text-xl font-bold text-white sm:text-2xl">{profile.name}</h1>
                <Badge tone="blue">{profile.tier}</Badge>
                {profile.userType === "recruiter" && <Badge tone="magenta">Recruiter</Badge>}
              </div>
              <p className="text-sm text-slate-400">@{profile.handle} · {profile.role}</p>
              {profile.location && (
                <p className="mt-0.5 flex items-center gap-1 text-xs text-slate-500">
                  <MapPin className="h-3 w-3" /> {profile.location}
                </p>
              )}
            </div>
          </div>
          <div className="flex flex-wrap gap-2">
            {connStatus.status === "connected" ? (
              <>
                <Button size="sm" onClick={handleMessage}>
                  <MessageSquare className="h-3.5 w-3.5" /> Message
                </Button>
                <Button size="sm" variant="subtle" loading={actionLoading} onClick={handleConnect}>
                  <UserCheck className="h-3.5 w-3.5" /> Connected
                </Button>
              </>
            ) : connStatus.status === "pending_sent" ? (
              <Button size="sm" variant="subtle" disabled>
                <Clock className="h-3.5 w-3.5" /> Request sent
              </Button>
            ) : connStatus.status === "pending_received" ? (
              <Button size="sm" loading={actionLoading} onClick={handleConnect}>
                <UserCheck className="h-3.5 w-3.5" /> Accept request
              </Button>
            ) : (
              <Button size="sm" loading={actionLoading} onClick={handleConnect}>
                <UserPlus className="h-3.5 w-3.5" /> Connect
              </Button>
            )}
          </div>
        </div>
      </GlassCard>

      <div className="grid gap-4 lg:grid-cols-3">
        {/* Left column */}
        <div className="space-y-4 lg:col-span-2">
          {/* Bio + Stack */}
          <GlassCard>
            <h3 className="font-display font-semibold text-white">About</h3>
            <p className="mt-2 text-sm leading-relaxed text-slate-300">{profile.bio || "No bio yet."}</p>
            {profile.stack.length > 0 && (
              <div className="mt-4 flex flex-wrap gap-2">
                {profile.stack.map((s) => <Badge key={s} tone="cyan">{s}</Badge>)}
              </div>
            )}
          </GlassCard>

          {/* Skills */}
          {profile.skills.length > 0 && (
            <GlassCard>
              <h3 className="font-display font-semibold text-white">Skills</h3>
              <div className="mt-4 space-y-3">
                {profile.skills.map((s, i) => (
                  <div key={s.name}>
                    <div className="mb-1 flex justify-between text-sm">
                      <span className="text-slate-200">{s.name}</span>
                      <span className="text-slate-500">{s.level}%</span>
                    </div>
                    <div className="h-2 overflow-hidden rounded-full bg-white/5">
                      <motion.div
                        initial={{ width: 0 }}
                        animate={{ width: `${s.level}%` }}
                        transition={{ delay: i * 0.06, duration: 0.7, ease: "easeOut" }}
                        className="h-full rounded-full bg-neon-grad"
                      />
                    </div>
                  </div>
                ))}
              </div>
            </GlassCard>
          )}

          <Endorsements userId={profile.id} skills={profile.skills} canEndorse={connStatus.status === "connected"} />

          {/* Projects — always visible */}
          <GlassCard>
            <h3 className="font-display font-semibold text-white">Projects</h3>
            <AnimatePresence mode="wait">
              {projects.length === 0 ? (
                <EmptyState
                  key="no-projects"
                  icon={FolderGit2}
                  title="No projects yet"
                  subtitle="This developer hasn't added any projects"
                />
              ) : (
                <motion.div
                  key="projects-grid"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="mt-4 grid gap-3 sm:grid-cols-2"
                >
                  {projects.map((p, i) => (
                    <motion.div
                      key={p.id}
                      initial={{ opacity: 0, y: 12 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: i * 0.07 }}
                      className="rounded-xl border border-white/10 bg-white/[0.02] p-4 hover:border-white/[0.14] hover:bg-white/[0.035] transition"
                    >
                      <div className="flex items-start gap-2">
                        <FolderGit2 className="mt-0.5 h-4 w-4 shrink-0 text-neon-cyan" />
                        <div className="min-w-0 flex-1">
                          <p className="font-medium text-white">{p.title}</p>
                          {p.description && <p className="mt-0.5 text-xs text-slate-400 line-clamp-2">{p.description}</p>}
                          <div className="mt-2 flex flex-wrap gap-1">
                            {p.stack.slice(0, 3).map((s) => <Badge key={s}>{s}</Badge>)}
                          </div>
                        </div>
                      </div>
                      <div className="mt-3 flex gap-2">
                        {p.repoUrl && (
                          <a href={p.repoUrl} target="_blank" rel="noopener noreferrer">
                            <Button size="sm" variant="outline">
                              <Github className="h-3.5 w-3.5" /> Repo
                            </Button>
                          </a>
                        )}
                        {p.liveUrl && (
                          <a href={p.liveUrl} target="_blank" rel="noopener noreferrer">
                            <Button size="sm" variant="outline">
                              <ExternalLink className="h-3.5 w-3.5" /> Live
                            </Button>
                          </a>
                        )}
                      </div>
                    </motion.div>
                  ))}
                </motion.div>
              )}
            </AnimatePresence>
          </GlassCard>

          {/* Certifications — always visible */}
          <GlassCard>
            <h3 className="font-display font-semibold text-white">Certifications</h3>
            <AnimatePresence mode="wait">
              {!profile.certificatesList?.length ? (
                <EmptyState
                  key="no-certs"
                  icon={Award}
                  title="No certifications yet"
                  subtitle="This developer hasn't added any credentials"
                />
              ) : (
                <motion.div
                  key="certs-grid"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="mt-4 grid gap-3 sm:grid-cols-2"
                >
                  {profile.certificatesList.map((c, i) => (
                    <motion.div
                      key={c.id}
                      initial={{ opacity: 0, y: 12 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: i * 0.07 }}
                      className="flex items-start gap-3 rounded-xl border border-white/10 bg-white/[0.02] p-3 hover:border-white/[0.14] transition"
                    >
                      <Award className="mt-0.5 h-5 w-5 shrink-0 text-neon-lime" />
                      <div className="min-w-0">
                        <p className="font-medium text-white">{c.name}</p>
                        <p className="text-xs text-slate-400">{c.issuer}{c.year ? ` · ${c.year}` : ""}</p>
                        {c.credentialUrl && (
                          <a href={c.credentialUrl} target="_blank" rel="noopener noreferrer" className="mt-1 text-xs text-neon-cyan hover:underline flex items-center gap-1">
                            <ExternalLink className="h-3 w-3" /> Verify
                          </a>
                        )}
                      </div>
                    </motion.div>
                  ))}
                </motion.div>
              )}
            </AnimatePresence>
          </GlassCard>

          {/* GitHub — always visible */}
          <GitHubCard handle={profile.github} />

          {/* Activity — always visible */}
          <GlassCard>
            <div className="flex items-center gap-2 mb-4">
              <Activity className="h-4 w-4 text-white/40" />
              <h3 className="font-display font-semibold text-white">Activity</h3>
              <span className="ml-auto text-[11px] text-white/20">Last 24 weeks</span>
            </div>
            <ActivityGrid />
            <div className="mt-4 grid grid-cols-3 gap-2">
              {[
                { label: "Profile views", value: fmt(profile.followers * 3 + 12) },
                { label: "Matches made", value: fmt(profile.rep) },
                { label: "Connections", value: fmt(profile.followers) },
              ].map((s) => (
                <div key={s.label} className="rounded-xl border border-white/[0.06] bg-white/[0.02] py-2.5 text-center">
                  <p className="font-display text-lg font-bold text-grad">{s.value}</p>
                  <p className="text-[10px] text-white/25">{s.label}</p>
                </div>
              ))}
            </div>
          </GlassCard>
        </div>

        {/* Right column */}
        <div className="space-y-4">
          {/* Trust score */}
          <GlassCard glow>
            <div className="flex items-center justify-between">
              <h3 className="font-display font-semibold text-white">Trust Score</h3>
              <Badge tone={tier.tone}>{tier.emoji} {tier.label}</Badge>
            </div>
            <div className="mt-4 flex justify-center">
              <TrustMeter score={profile.trustScore} size={120} showTier={false} />
            </div>
            {breakdownData.length > 0 && (
              <div className="mt-4 h-32">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={breakdownData} layout="vertical" margin={{ left: -10, right: 10 }}>
                    <XAxis type="number" domain={[0, 100]} hide />
                    <YAxis type="category" dataKey="name" width={78} stroke="#64748b" fontSize={11} tickLine={false} axisLine={false} />
                    <Tooltip cursor={{ fill: "rgba(255,255,255,0.03)" }} contentStyle={{ background: "rgba(10,12,20,0.9)", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 10 }} />
                    <Bar dataKey="value" radius={[0, 6, 6, 0]} barSize={10}>
                      {breakdownData.map((d) => <Cell key={d.name} fill={barColor(d.value)} />)}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            )}
          </GlassCard>

          {/* Stats */}
          <GlassCard>
            <h3 className="font-display font-semibold text-white">Stats</h3>
            <div className="mt-4 grid grid-cols-3 gap-3 text-center">
              {[
                { k: "Followers", v: fmt(profile.followers) },
                { k: "Projects", v: profile.projects },
                { k: "Rep", v: fmt(profile.rep) },
              ].map((x) => (
                <div key={x.k} className="rounded-xl border border-white/10 bg-white/[0.02] py-3">
                  <p className="font-display text-xl font-bold text-grad">{x.v}</p>
                  <p className="text-[11px] text-slate-500">{x.k}</p>
                </div>
              ))}
            </div>
          </GlassCard>

          {/* Match score */}
          <GlassCard>
            <h3 className="font-display font-semibold text-white">Match Score</h3>
            <div className="mt-4 flex items-center gap-4">
              <ScoreRing value={profile.trustScore} size={64} label="compat" />
              <div>
                <p className="text-sm text-slate-300">with you</p>
                <p className="text-xs text-slate-500 mt-1">Based on shared stack & skills</p>
              </div>
            </div>
          </GlassCard>

          {/* Links */}
          {(profile.github || profile.website || profile.twitter) && (
            <GlassCard>
              <h3 className="font-display font-semibold text-white">Links</h3>
              <div className="mt-3 space-y-2 text-sm">
                {profile.github && (
                  <a href={`https://github.com/${profile.github}`} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 rounded-lg px-2 py-1.5 text-slate-300 transition hover:bg-white/5 hover:text-neon-cyan">
                    <Github className="h-4 w-4" /> github.com/{profile.github}
                  </a>
                )}
                {profile.website && (
                  <a href={profile.website} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 rounded-lg px-2 py-1.5 text-slate-300 transition hover:bg-white/5 hover:text-neon-cyan">
                    <Globe className="h-4 w-4" /> {profile.website}
                  </a>
                )}
                {profile.twitter && (
                  <a href={`https://twitter.com/${profile.twitter}`} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 rounded-lg px-2 py-1.5 text-slate-300 transition hover:bg-white/5 hover:text-neon-cyan">
                    <Twitter className="h-4 w-4" /> @{profile.twitter}
                  </a>
                )}
              </div>
            </GlassCard>
          )}

          {/* Suggestions */}
          {profile.trustBreakdown && (
            <GlassCard>
              <p className="flex items-center gap-1.5 text-xs font-medium text-neon-cyan">
                <Lightbulb className="h-3.5 w-3.5" /> How to improve trust score
              </p>
              <ul className="mt-2 space-y-1.5">
                {trustSuggestions(profile).map((s) => (
                  <li key={s} className="flex items-start gap-2 text-xs text-slate-300">
                    <span className="mt-1 h-1 w-1 shrink-0 rounded-full bg-neon-cyan" />{s}
                  </li>
                ))}
              </ul>
            </GlassCard>
          )}
        </div>
      </div>
    </div>
  );
}
