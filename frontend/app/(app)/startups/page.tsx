"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  ArrowBigUp, MessageCircle, Plus, Sparkles, Rocket, X, Tag,
  Users, Check, XCircle, ChevronDown, Trophy,
} from "lucide-react";
import { GlassCard } from "@/components/ui/GlassCard";
import { Badge } from "@/components/ui/Badge";
import { Avatar } from "@/components/ui/Avatar";
import { Button } from "@/components/ui/Button";
import { Skeleton } from "@/components/ui/Skeleton";
import { useAsync } from "@/hooks/useAsync";
import { api } from "@/lib/api";
import { useToast } from "@/components/ui/Toast";
import { fmt, cn } from "@/lib/utils";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import type { StartupIdea, IdeaApplication } from "@/types";

const ROLES = ["Frontend Dev","Backend Dev","Full-Stack Dev","Mobile Dev","UI/UX Designer","Data Scientist","DevOps","Product Manager","Marketer","Blockchain Dev"];

const COFOUNDER_ROLES = ["Cofounder","Co-Founder","Full-Stack Dev","Backend Dev","Frontend Dev","Product Manager"];
const HACKATHON_TAGS = ["hackathon","hack","hacking","hackatho","hacktahon","48h","24h","72h"];

type TabId = "all" | "cofounders" | "hackathons";

const TABS: { id: TabId; label: string; icon: React.ElementType }[] = [
  { id: "all",       label: "All Ideas",   icon: Rocket },
  { id: "cofounders", label: "Cofounders", icon: Users },
  { id: "hackathons", label: "Hackathons", icon: Trophy },
];

export default function Startups() {
  const { data: ideas, loading, setData: setIdeas } = useAsync(api.ideas);
  const toast = useToast();
  const navigate = useRouter();
  const { user } = useAuth();

  const [activeTab, setActiveTab] = useState<TabId>("all");
  const [voted, setVoted] = useState<Record<string, boolean>>({});
  const [applied, setApplied] = useState<Set<string>>(new Set());
  const [generating, setGenerating] = useState(false);
  const [showPost, setShowPost] = useState(false);
  const [showApply, setShowApply] = useState<StartupIdea | null>(null);
  const [showApplications, setShowApplications] = useState<{ idea: StartupIdea; list: IdeaApplication[] } | null>(null);
  const [loadingApps, setLoadingApps] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [updatingApp, setUpdatingApp] = useState<string | null>(null);

  // Post idea form
  const [title, setTitle] = useState("");
  const [pitch, setPitch] = useState("");
  const [tagInput, setTagInput] = useState("");
  const [tags, setTags] = useState<string[]>([]);
  const [lookingFor, setLookingFor] = useState<string[]>([]);

  // Apply form
  const [applyMessage, setApplyMessage] = useState("");
  const [applyRole, setApplyRole] = useState("");

  const vote = async (idea: StartupIdea) => {
    const wasVoted = voted[idea.id] ?? false;
    setVoted((v) => ({ ...v, [idea.id]: !wasVoted }));
    try {
      const res = await api.upvoteIdea(idea.id);
      setIdeas?.((prev) =>
        (prev ?? []).map((x) => x.id === idea.id ? { ...x, upvotes: res.upvotes } : x),
      );
    } catch {
      setVoted((v) => ({ ...v, [idea.id]: wasVoted }));
    }
  };

  const postIdea = async () => {
    if (!title.trim() || !pitch.trim()) { toast("Title and pitch are required", "error"); return; }
    setSubmitting(true);
    try {
      const idea = await api.createIdea({ title: title.trim(), pitch: pitch.trim(), tags, lookingFor });
      setIdeas?.((prev) => [idea, ...(prev ?? [])]);
      setShowPost(false);
      setTitle(""); setPitch(""); setTags([]); setLookingFor([]); setTagInput("");
      toast("Idea posted! 🚀");
    } catch (err: any) {
      toast(err.message ?? "Failed to post idea", "error");
    } finally {
      setSubmitting(false);
    }
  };

  const apply = async () => {
    if (!showApply) return;
    setSubmitting(true);
    try {
      await api.applyToIdea(showApply.id, { message: applyMessage, role: applyRole });
      setApplied((prev) => new Set([...prev, showApply.id]));
      setShowApply(null);
      setApplyMessage("");
      setApplyRole("");
      toast("Application sent! The founder will review it.");
    } catch (err: any) {
      toast(err.message ?? "Failed to apply", "error");
    } finally {
      setSubmitting(false);
    }
  };

  const openApplications = async (idea: StartupIdea) => {
    setLoadingApps(idea.id);
    try {
      const list = await api.ideaApplications(idea.id);
      setShowApplications({ idea, list });
    } catch (err: any) {
      toast(err.message ?? "Failed to load applications", "error");
    } finally {
      setLoadingApps(null);
    }
  };

  const handleUpdateApplication = async (appId: string, status: "accepted" | "rejected") => {
    if (!showApplications) return;
    setUpdatingApp(appId);
    try {
      await api.updateApplication(appId, status);
      setShowApplications((prev) =>
        prev
          ? { ...prev, list: prev.list.map((a) => a.id === appId ? { ...a, status } : a) }
          : prev,
      );
      toast(status === "accepted" ? "Application accepted!" : "Application declined.");
    } catch (err: any) {
      toast(err.message ?? "Failed to update", "error");
    } finally {
      setUpdatingApp(null);
    }
  };

  const generate = async () => {
    setGenerating(true);
    try {
      const idea = await api.createIdea({
        title: "Developer Collaboration Tool",
        pitch: "Connecting developers using compatibility scoring matched to your stack.",
        tags: ["Developer Tools","SaaS"],
        lookingFor: ["Full-Stack Dev","UI/UX Designer"],
      });
      setIdeas?.((prev) => [idea, ...(prev ?? [])]);
      toast("Drafted a startup idea based on your stack ✨");
    } catch (err: any) {
      toast(err.message ?? "Failed to generate idea", "error");
    } finally {
      setGenerating(false);
    }
  };

  const addTag = () => {
    const t = tagInput.trim();
    if (t && !tags.includes(t)) setTags([...tags, t]);
    setTagInput("");
  };

  // Filtered ideas based on active tab
  const filteredIdeas = (() => {
    if (!ideas) return [];
    if (activeTab === "cofounders") {
      return ideas.filter((idea) =>
        idea.lookingFor.some((r) =>
          COFOUNDER_ROLES.some((cr) => r.toLowerCase().includes(cr.toLowerCase())),
        ) || idea.tags.some((t) => ["cofounder","cofound","co-found","startup"].includes(t.toLowerCase())),
      );
    }
    if (activeTab === "hackathons") {
      return ideas.filter((idea) =>
        idea.tags.some((t) => HACKATHON_TAGS.some((ht) => t.toLowerCase().includes(ht))) ||
        idea.title.toLowerCase().includes("hackathon") ||
        idea.pitch.toLowerCase().includes("hackathon"),
      );
    }
    return ideas;
  })();

  return (
    <div className="space-y-6">
      <header className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="font-display text-2xl font-bold text-white">Startup Builder</h1>
          <p className="text-sm text-white/30">Post ideas, find cofounders, assemble hackathon teams.</p>
        </div>
        <div className="flex gap-2">
          <Button size="sm" variant="outline" loading={generating} onClick={generate}>
            <Sparkles className="h-4 w-4" /> Idea generator
          </Button>
          <Button size="sm" onClick={() => setShowPost(true)}>
            <Plus className="h-4 w-4" /> Post idea
          </Button>
        </div>
      </header>

      {/* ── Tabs ── */}
      <div className="flex gap-1 rounded-xl border border-white/[0.07] bg-white/[0.02] p-1 w-fit flex-wrap">
        {TABS.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={cn(
              "relative flex items-center gap-1.5 rounded-lg px-4 py-2 text-sm font-medium transition",
              activeTab === tab.id ? "text-white" : "text-white/35 hover:text-white/60",
            )}
          >
            {activeTab === tab.id && (
              <motion.span layoutId="startup-tab" className="absolute inset-0 rounded-lg bg-white/[0.07]" />
            )}
            <tab.icon className="relative h-3.5 w-3.5" />
            <span className="relative">{tab.label}</span>
            {tab.id !== "all" && (
              <span className={cn(
                "relative rounded-full px-1.5 py-0.5 text-[10px] font-semibold",
                activeTab === tab.id
                  ? "bg-neon-cyan/10 text-neon-cyan/70"
                  : "bg-white/[0.06] text-white/25",
              )}>
                {tab.id === "cofounders"
                  ? (ideas ?? []).filter((idea) =>
                      idea.lookingFor.some((r) =>
                        COFOUNDER_ROLES.some((cr) => r.toLowerCase().includes(cr.toLowerCase())),
                      )
                    ).length
                  : (ideas ?? []).filter((idea) =>
                      idea.tags.some((t) => HACKATHON_TAGS.some((ht) => t.toLowerCase().includes(ht))) ||
                      idea.title.toLowerCase().includes("hackathon")
                    ).length
                }
              </span>
            )}
          </button>
        ))}
      </div>

      {/* Tab descriptions */}
      {activeTab === "cofounders" && (
        <motion.div
          initial={{ opacity: 0, y: -8 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex items-center gap-3 rounded-xl border border-neon-cyan/10 bg-neon-cyan/[0.04] px-4 py-3"
        >
          <Users className="h-4 w-4 text-neon-cyan/60 shrink-0" />
          <p className="text-sm text-white/50">
            Ideas looking for cofounders or key team members. Apply to join and build together.
          </p>
        </motion.div>
      )}
      {activeTab === "hackathons" && (
        <motion.div
          initial={{ opacity: 0, y: -8 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex items-center gap-3 rounded-xl border border-[#6366f1]/10 bg-[#6366f1]/[0.04] px-4 py-3"
        >
          <Trophy className="h-4 w-4 text-[#6366f1]/60 shrink-0" />
          <p className="text-sm text-white/50">
            Hackathon projects looking for balanced teams. Fast-track assembly in under 60 seconds.
          </p>
          <Button size="sm" variant="outline" onClick={() => setShowPost(true)} className="ml-auto shrink-0">
            <Plus className="h-3 w-3" /> Post hackathon
          </Button>
        </motion.div>
      )}

      {/* Post Idea Modal */}
      <AnimatePresence>
        {showPost && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4"
            onClick={(e) => e.target === e.currentTarget && setShowPost(false)}
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="w-full max-w-lg"
            >
              <GlassCard className="space-y-4">
                <div className="flex items-center justify-between">
                  <h2 className="font-display text-xl font-bold text-white">Post a Startup Idea</h2>
                  <button onClick={() => setShowPost(false)} className="text-slate-400 hover:text-white"><X className="h-5 w-5" /></button>
                </div>
                <div className="space-y-3">
                  <input
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    placeholder="Idea title *"
                    className="w-full rounded-xl border border-white/10 bg-white/[0.03] px-3 py-2.5 text-sm text-white outline-none placeholder:text-slate-500 focus:border-neon-cyan/50"
                  />
                  <textarea
                    value={pitch}
                    onChange={(e) => setPitch(e.target.value)}
                    placeholder="Your pitch — what problem does it solve? *"
                    rows={4}
                    className="w-full resize-none rounded-xl border border-white/10 bg-white/[0.03] px-3 py-2.5 text-sm text-white outline-none placeholder:text-slate-500 focus:border-neon-cyan/50"
                  />
                  <div>
                    <label className="mb-1.5 block text-xs text-slate-400">Tags</label>
                    <div className="flex gap-2">
                      <input
                        value={tagInput}
                        onChange={(e) => setTagInput(e.target.value)}
                        onKeyDown={(e) => e.key === "Enter" && addTag()}
                        placeholder="Add tag (press Enter)"
                        className="flex-1 rounded-xl border border-white/10 bg-white/[0.03] px-3 py-2 text-sm text-white outline-none placeholder:text-slate-500 focus:border-neon-cyan/50"
                      />
                      <Button size="sm" variant="outline" onClick={addTag}><Tag className="h-4 w-4" /></Button>
                    </div>
                    {tags.length > 0 && (
                      <div className="mt-2 flex flex-wrap gap-1.5">
                        {tags.map((t) => (
                          <span key={t} className="flex items-center gap-1 rounded-lg bg-white/10 px-2 py-0.5 text-xs text-slate-300">
                            #{t}
                            <button onClick={() => setTags(tags.filter((x) => x !== t))}><X className="h-3 w-3" /></button>
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                  <div>
                    <label className="mb-1.5 block text-xs text-slate-400">Looking for</label>
                    <div className="flex flex-wrap gap-1.5">
                      {ROLES.map((r) => (
                        <button
                          key={r}
                          onClick={() => setLookingFor((l) => l.includes(r) ? l.filter((x) => x !== r) : [...l, r])}
                          className={`rounded-lg border px-2.5 py-1 text-xs transition ${lookingFor.includes(r) ? "border-neon-magenta bg-neon-magenta/10 text-neon-magenta" : "border-white/10 text-slate-400 hover:text-white"}`}
                        >
                          {r}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
                <div className="flex gap-2 pt-1">
                  <Button className="flex-1" onClick={postIdea} loading={submitting} disabled={!title.trim() || !pitch.trim()}>
                    <Rocket className="h-4 w-4" /> Post idea
                  </Button>
                  <Button variant="ghost" onClick={() => setShowPost(false)}>Cancel</Button>
                </div>
              </GlassCard>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Apply Modal */}
      <AnimatePresence>
        {showApply && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4"
            onClick={(e) => e.target === e.currentTarget && setShowApply(null)}
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="w-full max-w-md"
            >
              <GlassCard className="space-y-4">
                <div className="flex items-center justify-between">
                  <h2 className="font-display text-xl font-bold text-white">Apply to join</h2>
                  <button onClick={() => setShowApply(null)} className="text-slate-400 hover:text-white"><X className="h-5 w-5" /></button>
                </div>
                <div className="rounded-xl border border-white/10 bg-white/[0.02] p-3">
                  <p className="font-semibold text-white">{showApply.title}</p>
                  <p className="mt-1 text-xs text-slate-400">by {showApply.author.name}</p>
                </div>
                <div>
                  <label className="mb-1.5 block text-sm text-slate-400">Role you're applying for</label>
                  <select
                    value={applyRole}
                    onChange={(e) => setApplyRole(e.target.value)}
                    className="w-full rounded-xl border border-white/10 bg-ink-800 px-3 py-2 text-sm text-white outline-none focus:border-neon-cyan/50"
                  >
                    <option value="">Select a role…</option>
                    {ROLES.map((r) => <option key={r} value={r}>{r}</option>)}
                  </select>
                </div>
                <div>
                  <label className="mb-1.5 block text-sm text-slate-400">Message to the founder</label>
                  <textarea
                    value={applyMessage}
                    onChange={(e) => setApplyMessage(e.target.value)}
                    placeholder="Why you want to join, what you bring to the table..."
                    rows={4}
                    className="w-full resize-none rounded-xl border border-white/10 bg-white/[0.03] px-3 py-2 text-sm text-white outline-none placeholder:text-slate-500 focus:border-neon-cyan/50"
                  />
                </div>
                <div className="flex gap-2">
                  <Button className="flex-1" loading={submitting} onClick={apply} disabled={!applyMessage.trim()}>
                    Send application
                  </Button>
                  <Button variant="ghost" onClick={() => setShowApply(null)}>Cancel</Button>
                </div>
              </GlassCard>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Applications Modal (for idea author) */}
      <AnimatePresence>
        {showApplications && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4"
            onClick={(e) => e.target === e.currentTarget && setShowApplications(null)}
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="w-full max-w-lg max-h-[85vh] flex flex-col"
            >
              <GlassCard className="flex flex-col gap-4 overflow-hidden">
                <div className="flex items-center justify-between shrink-0">
                  <div>
                    <h2 className="font-display text-xl font-bold text-white">Applications</h2>
                    <p className="text-xs text-slate-400">{showApplications.idea.title}</p>
                  </div>
                  <button onClick={() => setShowApplications(null)} className="text-slate-400 hover:text-white"><X className="h-5 w-5" /></button>
                </div>

                {showApplications.list.length === 0 ? (
                  <div className="py-10 text-center">
                    <Users className="mx-auto h-8 w-8 text-slate-600 mb-2" />
                    <p className="text-sm text-slate-500">No applications yet.</p>
                  </div>
                ) : (
                  <div className="overflow-y-auto space-y-3 pr-1">
                    {showApplications.list.map((app) => (
                      <div key={app.id} className="rounded-xl border border-white/10 bg-white/[0.02] p-4 space-y-3">
                        <div className="flex items-start gap-3">
                          <button onClick={() => { navigate.push(`/profile/${app.applicant.id}`); setShowApplications(null); }}>
                            <Avatar src={app.applicant.avatar} name={app.applicant.name} status={app.applicant.availability} size={40} />
                          </button>
                          <div className="min-w-0 flex-1">
                            <div className="flex items-center gap-2 flex-wrap">
                              <button
                                onClick={() => { navigate.push(`/profile/${app.applicant.id}`); setShowApplications(null); }}
                                className="font-medium text-white hover:text-neon-cyan transition"
                              >
                                {app.applicant.name}
                              </button>
                              <span className="text-xs text-slate-500">{app.applicant.role}</span>
                              {app.role && <Badge tone="magenta">{app.role}</Badge>}
                            </div>
                            <div className="mt-1 flex items-center gap-2">
                              <span className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[11px] font-medium ${
                                app.status === "accepted" ? "bg-neon-lime/10 text-neon-lime" :
                                app.status === "rejected" ? "bg-neon-magenta/10 text-neon-magenta" :
                                "bg-white/10 text-slate-400"
                              }`}>
                                {app.status === "accepted" && <Check className="h-3 w-3" />}
                                {app.status === "rejected" && <XCircle className="h-3 w-3" />}
                                {app.status}
                              </span>
                              <span className="text-[11px] text-slate-600">
                                {new Date(app.createdAt).toLocaleDateString()}
                              </span>
                            </div>
                          </div>
                        </div>

                        {app.message && (
                          <p className="text-sm text-slate-300 leading-relaxed bg-white/[0.02] rounded-lg p-3 border border-white/5">
                            {app.message}
                          </p>
                        )}

                        {app.status === "pending" && (
                          <div className="flex gap-2">
                            <Button
                              size="sm"
                              loading={updatingApp === app.id}
                              onClick={() => handleUpdateApplication(app.id, "accepted")}
                              className="flex-1"
                            >
                              <Check className="h-3.5 w-3.5" /> Accept
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              loading={updatingApp === app.id}
                              onClick={() => handleUpdateApplication(app.id, "rejected")}
                              className="flex-1"
                            >
                              <XCircle className="h-3.5 w-3.5" /> Decline
                            </Button>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </GlassCard>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Ideas list */}
      {loading || !ideas ? (
        <div className="space-y-4">
          {Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-40 w-full" />)}
        </div>
      ) : filteredIdeas.length === 0 ? (
        <GlassCard className="py-16 text-center">
          {activeTab === "hackathons" ? (
            <>
              <Trophy className="mx-auto mb-4 h-10 w-10 text-[#6366f1] opacity-50" />
              <p className="text-white/40 mb-2">No hackathon ideas yet.</p>
              <p className="text-sm text-white/25 mb-4">Post an idea and tag it with "hackathon" to show here.</p>
            </>
          ) : activeTab === "cofounders" ? (
            <>
              <Users className="mx-auto mb-4 h-10 w-10 text-neon-cyan opacity-50" />
              <p className="text-white/40 mb-2">No cofounder opportunities yet.</p>
              <p className="text-sm text-white/25 mb-4">Post an idea and specify the roles you're looking for.</p>
            </>
          ) : (
            <>
              <Rocket className="mx-auto mb-4 h-10 w-10 text-neon-cyan opacity-50" />
              <p className="text-white/40">No startup ideas yet. Be the first to post one!</p>
            </>
          )}
          <Button className="mt-4" onClick={() => setShowPost(true)}>
            <Plus className="h-4 w-4" /> Post first idea
          </Button>
        </GlassCard>
      ) : (
        <div className="space-y-4">
          {filteredIdeas.map((idea, i) => {
            const isVoted = voted[idea.id] ?? false;
            const isOwner = user?.id === idea.author.id;
            const hasApplied = applied.has(idea.id);

            return (
              <motion.div key={idea.id} initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.06 }}>
                <GlassCard interactive className="flex gap-3 sm:gap-4">
                  <button
                    onClick={() => vote(idea)}
                    className={`flex h-fit flex-col items-center rounded-xl border px-2.5 py-2 transition sm:px-3 ${isVoted ? "border-neon-cyan/40 bg-neon-cyan/10 text-neon-cyan" : "border-white/10 text-slate-400 hover:text-white"}`}
                  >
                    <ArrowBigUp className="h-5 w-5" />
                    <span className="text-sm font-semibold">{fmt(idea.upvotes)}</span>
                  </button>

                  <div className="min-w-0 flex-1">
                    <div className="flex items-start justify-between gap-3">
                      <h3 className="font-display text-base font-semibold text-white sm:text-lg">{idea.title}</h3>
                      <Rocket className="h-4 w-4 shrink-0 text-neon-magenta mt-1" />
                    </div>
                    <p className="mt-1 text-sm text-slate-400 line-clamp-2">{idea.pitch}</p>

                    <div className="mt-3 flex flex-wrap items-center gap-1.5">
                      {idea.tags.map((t) => <Badge key={t}>#{t}</Badge>)}
                    </div>

                    <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
                      <div className="flex items-center gap-2">
                        <button onClick={() => navigate.push(`/profile/${idea.author.id}`)}>
                          <Avatar src={idea.author.avatar} name={idea.author.name} size={28} />
                        </button>
                        <span className="text-xs text-slate-500">by {idea.author.name}</span>
                        <span className="flex items-center gap-1 text-xs text-slate-500">
                          <MessageCircle className="h-3 w-3" />{idea.comments}
                        </span>
                      </div>
                      <div className="flex flex-wrap items-center gap-2">
                        {idea.lookingFor.map((r) => <Badge key={r} tone="magenta">{r}</Badge>)}

                        {isOwner ? (
                          <Button
                            size="sm"
                            variant="outline"
                            loading={loadingApps === idea.id}
                            onClick={() => openApplications(idea)}
                          >
                            <Users className="h-3.5 w-3.5" />
                            Applications
                            <ChevronDown className="h-3 w-3" />
                          </Button>
                        ) : hasApplied ? (
                          <span className="flex items-center gap-1 rounded-xl border border-neon-lime/30 bg-neon-lime/10 px-3 py-1.5 text-xs font-medium text-neon-lime">
                            <Check className="h-3.5 w-3.5" /> Applied
                          </span>
                        ) : (
                          <Button size="sm" variant="outline" onClick={() => setShowApply(idea)}>Apply</Button>
                        )}
                      </div>
                    </div>
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
