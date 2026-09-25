"use client";

import { useState, useEffect, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Github, Globe, Twitter, MapPin, Pencil, Sparkles, Lightbulb,
  Award, FolderGit2, Plus, X, ExternalLink, Save, Camera,
  Activity, GitCommit,
} from "lucide-react";
import { BarChart, Bar, XAxis, YAxis, ResponsiveContainer, Cell, Tooltip } from "recharts";
import { GlassCard } from "@/components/ui/GlassCard";
import { Endorsements } from "@/components/profile/Endorsements";
import { Badge } from "@/components/ui/Badge";
import { Avatar } from "@/components/ui/Avatar";
import { Button } from "@/components/ui/Button";
import { Skeleton } from "@/components/ui/Skeleton";
import { TrustMeter } from "@/components/ui/TrustMeter";
import { useAsync } from "@/hooks/useAsync";
import { useToast } from "@/components/ui/Toast";
import { useAuth } from "@/context/AuthContext";
import { api } from "@/lib/api";
import { fmt } from "@/lib/utils";
import { TRUST_LABELS, trustSuggestions, trustTier } from "@/lib/trust";
import type { TrustBreakdown, Project, Certificate } from "@/types";

/* ─── Shared sub-components ─────────────────────────────────────── */
function EmptyState({ icon: Icon, title, subtitle }: { icon: React.ElementType; title: string; subtitle: string }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35 }}
      className="flex flex-col items-center py-8 text-center"
    >
      <div className="relative mb-4">
        <motion.div
          animate={{ scale: [1, 1.08, 1] }}
          transition={{ duration: 2.5, repeat: Infinity, ease: "easeInOut" }}
          className="grid h-12 w-12 place-items-center rounded-2xl border border-white/[0.07] bg-white/[0.03]"
        >
          <Icon className="h-5 w-5 text-white/20" />
        </motion.div>
        <motion.div
          animate={{ opacity: [0.2, 0.5, 0.2], scale: [1, 1.18, 1] }}
          transition={{ duration: 2.5, repeat: Infinity, ease: "easeInOut" }}
          className="absolute inset-0 rounded-2xl"
          style={{ boxShadow: "0 0 18px rgba(59,130,246,0.06)" }}
        />
      </div>
      <p className="text-sm font-medium text-white/30">{title}</p>
      <p className="mt-0.5 text-xs text-white/15">{subtitle}</p>
      <div className="mt-4 flex flex-col items-center gap-1.5 w-full max-w-[160px]">
        {[90, 65, 45].map((w, i) => (
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

function ActivityGrid() {
  const weeks = 24;
  const days = 7;
  const grid = useMemo(() => Array.from({ length: weeks }, (_, wi) =>
    Array.from({ length: days }, (_, di) => {
      const seed = (wi * 7 + di + 7) * 2654435761;
      const pseudo = ((seed ^ (seed >> 16)) >>> 0) / 0xffffffff;
      const burst = wi > 8 && wi < 18 ? 0.45 : 0;
      return Math.max(0, Math.min(4, Math.round((pseudo + burst) * 4)));
    })
  ), []);

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
                transition={{ delay: (wi * 7 + di) * 0.002, duration: 0.2 }}
                className={`h-[10px] w-[10px] rounded-[2px] border ${levelColor(val)}`}
              />
            ))}
          </div>
        ))}
      </div>
      <div className="mt-2 flex items-center gap-1.5 justify-end">
        <span className="text-[10px] text-white/20">Less</span>
        {[0, 1, 2, 3, 4].map((v) => (
          <div key={v} className={`h-[10px] w-[10px] rounded-[2px] border ${levelColor(v)}`} />
        ))}
        <span className="text-[10px] text-white/20">More</span>
      </div>
    </div>
  );
}

const TECH_STACK = [
  "React","Next.js","Vue","TypeScript","JavaScript","Node.js","Express","Python",
  "Django","FastAPI","Go","Rust","Java","PHP","PostgreSQL","MongoDB","Redis",
  "GraphQL","Docker","Kubernetes","AWS","Firebase","TailwindCSS","React Native","Flutter",
];

export default function Profile() {
  const { refreshUser } = useAuth();
  const { data: me, loading } = useAsync(api.me);
  const toast = useToast();

  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);

  // Edit state
  const [name, setName] = useState("");
  const [bio, setBio] = useState("");
  const [location, setLocation] = useState("");
  const [role, setRole] = useState("");
  const [availability, setAvailability] = useState<"available" | "open" | "busy">("open");
  const [lookingFor, setLookingFor] = useState<string[]>([]);
  const [stack, setStack] = useState<string[]>([]);
  const [github, setGithub] = useState("");
  const [website, setWebsite] = useState("");
  const [twitter, setTwitter] = useState("");
  const [skills, setSkills] = useState<{ name: string; level: number }[]>([]);
  const [newSkillName, setNewSkillName] = useState("");
  const [newSkillLevel, setNewSkillLevel] = useState(50);
  const [avatarUrl, setAvatarUrl] = useState("");
  const [showAvatarInput, setShowAvatarInput] = useState(false);

  // Projects & Certs
  const [projects, setProjects] = useState<Project[]>([]);
  const [certs, setCerts] = useState<Certificate[]>([]);
  const [loadingExtras, setLoadingExtras] = useState(true);
  const [showProjForm, setShowProjForm] = useState(false);
  const [showCertForm, setShowCertForm] = useState(false);
  const [proj, setProj] = useState({ title: "", description: "", stack: [] as string[], repoUrl: "", liveUrl: "" });
  const [cert, setCert] = useState({ name: "", issuer: "", year: "", credentialUrl: "" });

  useEffect(() => {
    if (me) {
      setName(me.name);
      setBio(me.bio ?? "");
      setLocation(me.location ?? "");
      setRole(me.role ?? "");
      setAvailability((me.availability as any) ?? "open");
      setLookingFor(me.lookingFor ?? []);
      setStack(me.stack ?? []);
      setGithub(me.github ?? "");
      setWebsite(me.website ?? "");
      setTwitter(me.twitter ?? "");
      setSkills(me.skills ?? []);
    }
  }, [me]);

  useEffect(() => {
    Promise.all([api.myProjects(), api.me()])
      .then(([projs, user]) => {
        setProjects(projs);
        // Certs are embedded in user response
        setCerts((user as any).certificatesList ?? []);
      })
      .finally(() => setLoadingExtras(false));
  }, []);

  const saveProfile = async () => {
    setSaving(true);
    try {
      await api.updateProfile({ name, bio, location, role, availability, lookingFor, stack, github, website, twitter, skills });
      await refreshUser();
      toast("Profile updated ✓");
      setEditing(false);
    } catch (err: any) {
      toast(err.message ?? "Failed to save", "error");
    } finally {
      setSaving(false);
    }
  };

  const saveAvatar = async () => {
    if (!avatarUrl.trim()) return;
    try {
      await api.updateAvatar(avatarUrl.trim());
      await refreshUser();
      setShowAvatarInput(false);
      setAvatarUrl("");
      toast("Avatar updated ✓");
    } catch (err: any) {
      toast(err.message ?? "Failed to update avatar", "error");
    }
  };

  const addProject = async () => {
    if (!proj.title.trim()) return;
    try {
      const p = await api.createProject(proj);
      setProjects([...projects, p]);
      setProj({ title: "", description: "", stack: [], repoUrl: "", liveUrl: "" });
      setShowProjForm(false);
      toast("Project added ✓");
    } catch (err: any) {
      toast(err.message ?? "Failed to add project", "error");
    }
  };

  const deleteProject = async (id: string) => {
    try {
      await api.deleteProject(id);
      setProjects(projects.filter((p) => p.id !== id));
      toast("Project removed");
    } catch {
      toast("Failed to remove project", "error");
    }
  };

  const addCert = async () => {
    if (!cert.name.trim() || !cert.issuer.trim()) return;
    try {
      const c = await api.addCertificate({
        name: cert.name, issuer: cert.issuer,
        year: cert.year ? Number(cert.year) : undefined,
        credentialUrl: cert.credentialUrl || undefined,
      });
      setCerts([...certs, { id: String(c._id), name: c.name, issuer: c.issuer, year: c.year, credentialUrl: c.credentialUrl }]);
      setCert({ name: "", issuer: "", year: "", credentialUrl: "" });
      setShowCertForm(false);
      toast("Certificate added ✓");
    } catch (err: any) {
      toast(err.message ?? "Failed to add certificate", "error");
    }
  };

  const deleteCert = async (certId: string) => {
    try {
      await api.deleteCertificate(certId);
      setCerts(certs.filter((c) => c.id !== certId));
      toast("Certificate removed");
    } catch {
      toast("Failed to remove certificate", "error");
    }
  };

  if (loading || !me) return (
    <div className="space-y-4">
      <Skeleton className="h-40 w-full" />
      <div className="grid gap-4 md:grid-cols-3">
        <Skeleton className="h-64 md:col-span-2" />
        <Skeleton className="h-64" />
      </div>
    </div>
  );

  return (
    <div className="space-y-6">
      {/* Banner */}
      <GlassCard glow className="relative overflow-hidden p-0">
        <div className="h-24 bg-neon-soft sm:h-28" />
        <div className="flex flex-col gap-4 px-4 pb-5 sm:flex-row sm:items-end sm:justify-between sm:px-6 sm:pb-6">
          <div className="flex items-end gap-4">
            <div className="-mt-10 sm:-mt-12 relative group">
              <Avatar src={me.avatar} name={me.name} size={80} status={me.availability} className="ring-4 ring-ink-950" />
              <button
                onClick={() => setShowAvatarInput(!showAvatarInput)}
                className="absolute inset-0 flex items-center justify-center rounded-full bg-black/50 opacity-0 group-hover:opacity-100 transition"
              >
                <Camera className="h-5 w-5 text-white" />
              </button>
            </div>
            <div className="pb-1">
              {editing ? (
                <input
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="rounded-lg border border-white/10 bg-white/[0.03] px-2 py-1 text-xl font-bold text-white outline-none focus:border-neon-cyan/50"
                />
              ) : (
                <div className="flex flex-wrap items-center gap-2">
                  <h1 className="font-display text-xl font-bold text-white sm:text-2xl">{me.name}</h1>
                  <Badge tone="blue">{me.tier}</Badge>
                </div>
              )}
              <p className="text-sm text-slate-400">@{me.handle}</p>
              {!editing && me.location && (
                <p className="mt-0.5 flex items-center gap-1 text-xs text-slate-500">
                  <MapPin className="h-3 w-3" /> {me.location}
                </p>
              )}
            </div>
          </div>
          <div className="flex gap-2">
            {editing ? (
              <>
                <Button size="sm" onClick={saveProfile} loading={saving}>
                  <Save className="h-3.5 w-3.5" /> Save
                </Button>
                <Button size="sm" variant="ghost" onClick={() => setEditing(false)}>Cancel</Button>
              </>
            ) : (
              <>
                <Button variant="outline" size="sm" onClick={() => setEditing(true)}>
                  <Pencil className="h-3.5 w-3.5" /> Edit
                </Button>
                <Button size="sm"><Sparkles className="h-3.5 w-3.5" /> Boost visibility</Button>
              </>
            )}
          </div>
        </div>
        {showAvatarInput && (
          <div className="border-t border-white/5 px-4 py-3 sm:px-6 flex gap-2">
            <input
              value={avatarUrl}
              onChange={(e) => setAvatarUrl(e.target.value)}
              placeholder="Paste avatar image URL..."
              className="flex-1 rounded-xl border border-white/10 bg-white/[0.03] px-3 py-2 text-sm text-white outline-none placeholder:text-slate-500 focus:border-neon-cyan/50"
            />
            <Button size="sm" onClick={saveAvatar}>Update</Button>
            <Button size="sm" variant="ghost" onClick={() => setShowAvatarInput(false)}>Cancel</Button>
          </div>
        )}
      </GlassCard>

      <div className="grid gap-4 lg:grid-cols-3">
        {/* Left */}
        <div className="space-y-4 lg:col-span-2">
          {/* About */}
          <GlassCard>
            <h3 className="font-display font-semibold text-white">About</h3>
            {editing ? (
              <div className="mt-3 space-y-3">
                <div>
                  <label className="mb-1 block text-xs text-slate-400">Role</label>
                  <input value={role} onChange={(e) => setRole(e.target.value)} placeholder="Your title..." className="w-full rounded-xl border border-white/10 bg-white/[0.03] px-3 py-2 text-sm text-white outline-none placeholder:text-slate-500 focus:border-neon-cyan/50" />
                </div>
                <div>
                  <label className="mb-1 block text-xs text-slate-400">Bio</label>
                  <textarea value={bio} onChange={(e) => setBio(e.target.value)} rows={3} placeholder="Tell others about yourself..." className="w-full resize-none rounded-xl border border-white/10 bg-white/[0.03] px-3 py-2 text-sm text-white outline-none placeholder:text-slate-500 focus:border-neon-cyan/50" />
                </div>
                <div>
                  <label className="mb-1 block text-xs text-slate-400">Location</label>
                  <input value={location} onChange={(e) => setLocation(e.target.value)} placeholder="City, Country" className="w-full rounded-xl border border-white/10 bg-white/[0.03] px-3 py-2 text-sm text-white outline-none placeholder:text-slate-500 focus:border-neon-cyan/50" />
                </div>
                <div>
                  <label className="mb-1.5 block text-xs text-slate-400">Availability</label>
                  <div className="flex gap-2">
                    {(["available","open","busy"] as const).map((a) => (
                      <button key={a} onClick={() => setAvailability(a)} className={`flex-1 rounded-xl border py-2 text-xs font-medium capitalize transition ${availability === a ? "border-neon-cyan bg-neon-cyan/10 text-neon-cyan" : "border-white/10 text-slate-500 hover:text-white"}`}>
                        {a}
                      </button>
                    ))}
                  </div>
                </div>
                <div>
                  <label className="mb-1.5 block text-xs text-slate-400">Looking for</label>
                  <div className="flex gap-2">
                    {(["Collaborator", "Cofounder", "Hackathon"] as const).map((opt) => (
                      <button
                        key={opt}
                        type="button"
                        onClick={() => setLookingFor((prev) => prev.includes(opt) ? prev.filter((x) => x !== opt) : [...prev, opt])}
                        className={`flex-1 rounded-xl border py-2 text-xs font-medium transition ${lookingFor.includes(opt) ? "border-neon-cyan bg-neon-cyan/10 text-neon-cyan" : "border-white/10 text-slate-500 hover:text-white"}`}
                      >
                        {opt}
                      </button>
                    ))}
                  </div>
                </div>
                <div>
                  <label className="mb-1.5 block text-xs text-slate-400">Tech stack</label>
                  <div className="flex flex-wrap gap-1.5 mb-2">
                    {TECH_STACK.map((t) => (
                      <button key={t} onClick={() => setStack((s) => s.includes(t) ? s.filter((x) => x !== t) : [...s, t])} className={`rounded-lg border px-2.5 py-1 text-xs transition ${stack.includes(t) ? "border-neon-cyan bg-neon-cyan/10 text-neon-cyan" : "border-white/10 text-slate-400 hover:text-white"}`}>
                        {t}
                      </button>
                    ))}
                  </div>
                </div>
                <div>
                  <label className="mb-1.5 block text-xs text-slate-400">Social links</label>
                  <div className="space-y-2">
                    <div className="flex items-center gap-2 rounded-xl border border-white/10 bg-white/[0.03] px-3 py-2">
                      <Github className="h-4 w-4 text-slate-500 shrink-0" />
                      <span className="text-sm text-slate-500">github.com/</span>
                      <input value={github} onChange={(e) => setGithub(e.target.value)} placeholder="username" className="flex-1 bg-transparent text-sm text-white outline-none" />
                    </div>
                    <div className="flex items-center gap-2 rounded-xl border border-white/10 bg-white/[0.03] px-3 py-2">
                      <Globe className="h-4 w-4 text-slate-500 shrink-0" />
                      <input value={website} onChange={(e) => setWebsite(e.target.value)} placeholder="https://yoursite.com" className="flex-1 bg-transparent text-sm text-white outline-none" />
                    </div>
                    <div className="flex items-center gap-2 rounded-xl border border-white/10 bg-white/[0.03] px-3 py-2">
                      <Twitter className="h-4 w-4 text-slate-500 shrink-0" />
                      <span className="text-sm text-slate-500">@</span>
                      <input value={twitter} onChange={(e) => setTwitter(e.target.value)} placeholder="handle" className="flex-1 bg-transparent text-sm text-white outline-none" />
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              <>
                <p className="mt-2 text-sm leading-relaxed text-slate-300">{me.bio || <span className="text-slate-600 italic">No bio yet — click Edit to add one.</span>}</p>
                {me.lookingFor && me.lookingFor.length > 0 && (
                  <div className="mt-3">
                    <p className="mb-1.5 text-xs text-slate-500">Looking for</p>
                    <div className="flex flex-wrap gap-2">
                      {me.lookingFor.map((lf) => (
                        <span key={lf} className="rounded-xl border border-neon-cyan/30 bg-neon-cyan/10 px-3 py-1 text-xs font-medium text-neon-cyan">{lf}</span>
                      ))}
                    </div>
                  </div>
                )}
                {me.stack.length > 0 && <div className="mt-4 flex flex-wrap gap-2">{me.stack.map((s) => <Badge key={s} tone="cyan">{s}</Badge>)}</div>}
                {(me.github || me.website || me.twitter) && (
                  <div className="mt-4 flex flex-wrap gap-3 text-sm">
                    {me.github && <a href={`https://github.com/${me.github}`} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1 text-slate-400 hover:text-neon-cyan"><Github className="h-4 w-4" />{me.github}</a>}
                    {me.website && <a href={me.website} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1 text-slate-400 hover:text-neon-cyan"><Globe className="h-4 w-4" />{me.website}</a>}
                    {me.twitter && <a href={`https://twitter.com/${me.twitter}`} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1 text-slate-400 hover:text-neon-cyan"><Twitter className="h-4 w-4" />@{me.twitter}</a>}
                  </div>
                )}
              </>
            )}
          </GlassCard>

          {/* Skills */}
          <GlassCard>
            <div className="flex items-center justify-between">
              <h3 className="font-display font-semibold text-white">Skills</h3>
            </div>
            {editing && (
              <div className="mt-3 flex gap-2 mb-3">
                <input value={newSkillName} onChange={(e) => setNewSkillName(e.target.value)} onKeyDown={(e) => { if (e.key === "Enter" && newSkillName.trim()) { setSkills([...skills, { name: newSkillName.trim(), level: newSkillLevel }]); setNewSkillName(""); }}} placeholder="Skill name" className="flex-1 rounded-xl border border-white/10 bg-white/[0.03] px-3 py-2 text-sm text-white outline-none placeholder:text-slate-500 focus:border-neon-cyan/50" />
                <input type="range" min={1} max={100} value={newSkillLevel} onChange={(e) => setNewSkillLevel(Number(e.target.value))} className="w-24 accent-neon-cyan" />
                <Button size="sm" onClick={() => { if (newSkillName.trim()) { setSkills([...skills, { name: newSkillName.trim(), level: newSkillLevel }]); setNewSkillName(""); }}} disabled={!newSkillName.trim()}><Plus className="h-4 w-4" /></Button>
              </div>
            )}
            <div className="mt-4 space-y-3">
              {(editing ? skills : me.skills).map((s, i) => (
                <div key={s.name} className="flex items-center gap-3">
                  <div className="flex-1">
                    <div className="mb-1 flex justify-between text-sm">
                      <span className="text-slate-200">{s.name}</span>
                      <span className="text-slate-500">{s.level}%</span>
                    </div>
                    <div className="h-2 overflow-hidden rounded-full bg-white/5">
                      <motion.div initial={{ width: 0 }} animate={{ width: `${s.level}%` }} transition={{ delay: i * 0.07, duration: 0.8, ease: "easeOut" }} className="h-full rounded-full bg-neon-grad" />
                    </div>
                  </div>
                  {editing && <button onClick={() => setSkills(skills.filter((x) => x.name !== s.name))} className="text-slate-600 hover:text-neon-magenta"><X className="h-4 w-4" /></button>}
                </div>
              ))}
              {me.skills.length === 0 && !editing && (
                <EmptyState
                  icon={Sparkles}
                  title="No skills added yet"
                  subtitle="Click Edit to showcase your expertise"
                />
              )}
            </div>
          </GlassCard>

          <Endorsements userId={me.id} skills={me.skills} canEndorse={false} />

          {/* Projects */}
          <GlassCard>
            <div className="flex items-center justify-between">
              <h3 className="font-display font-semibold text-white">Projects</h3>
              <Button size="sm" variant="outline" onClick={() => setShowProjForm(true)}>
                <Plus className="h-3.5 w-3.5" /> Add
              </Button>
            </div>
            {showProjForm && (
              <div className="mt-3 space-y-2 rounded-xl border border-white/10 bg-white/[0.02] p-4">
                <input value={proj.title} onChange={(e) => setProj({ ...proj, title: e.target.value })} placeholder="Project title *" className="w-full rounded-xl border border-white/10 bg-transparent px-3 py-2 text-sm text-white outline-none placeholder:text-slate-500 focus:border-neon-cyan/50" />
                <textarea value={proj.description} onChange={(e) => setProj({ ...proj, description: e.target.value })} placeholder="Description" rows={2} className="w-full resize-none rounded-xl border border-white/10 bg-transparent px-3 py-2 text-sm text-white outline-none placeholder:text-slate-500 focus:border-neon-cyan/50" />
                <input value={proj.repoUrl} onChange={(e) => setProj({ ...proj, repoUrl: e.target.value })} placeholder="GitHub / repo URL" className="w-full rounded-xl border border-white/10 bg-transparent px-3 py-2 text-sm text-white outline-none placeholder:text-slate-500 focus:border-neon-cyan/50" />
                <input value={proj.liveUrl} onChange={(e) => setProj({ ...proj, liveUrl: e.target.value })} placeholder="Live URL" className="w-full rounded-xl border border-white/10 bg-transparent px-3 py-2 text-sm text-white outline-none placeholder:text-slate-500 focus:border-neon-cyan/50" />
                <div className="flex gap-2">
                  <Button size="sm" onClick={addProject} disabled={!proj.title.trim()}>Save project</Button>
                  <Button size="sm" variant="ghost" onClick={() => setShowProjForm(false)}>Cancel</Button>
                </div>
              </div>
            )}
            {loadingExtras ? <Skeleton className="mt-3 h-20 w-full" /> : (
              <AnimatePresence mode="wait">
                {projects.length === 0 && !showProjForm ? (
                  <EmptyState
                    key="no-projects"
                    icon={FolderGit2}
                    title="No projects yet"
                    subtitle="Click Add to showcase your work"
                  />
                ) : (
                  <motion.div
                    key="projects-grid"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="mt-3 grid gap-3 sm:grid-cols-2"
                  >
                    {projects.map((p, i) => (
                      <motion.div
                        key={p.id}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: i * 0.06 }}
                        className="relative rounded-xl border border-white/10 bg-white/[0.02] p-4 hover:border-white/[0.14] transition"
                      >
                        <button onClick={() => deleteProject(p.id)} className="absolute right-3 top-3 text-slate-600 hover:text-neon-magenta"><X className="h-4 w-4" /></button>
                        <FolderGit2 className="h-4 w-4 text-neon-cyan mb-2" />
                        <p className="font-medium text-white pr-6">{p.title}</p>
                        {p.description && <p className="text-xs text-slate-400 mt-0.5 line-clamp-2">{p.description}</p>}
                        <div className="mt-2 flex gap-2">
                          {p.repoUrl && <a href={p.repoUrl} target="_blank" rel="noopener noreferrer"><Button size="sm" variant="outline"><Github className="h-3.5 w-3.5" /></Button></a>}
                          {p.liveUrl && <a href={p.liveUrl} target="_blank" rel="noopener noreferrer"><Button size="sm" variant="outline"><ExternalLink className="h-3.5 w-3.5" /></Button></a>}
                        </div>
                      </motion.div>
                    ))}
                  </motion.div>
                )}
              </AnimatePresence>
            )}
          </GlassCard>

          {/* Certificates */}
          <GlassCard>
            <div className="flex items-center justify-between">
              <h3 className="font-display font-semibold text-white">Certifications</h3>
              <Button size="sm" variant="outline" onClick={() => setShowCertForm(true)}>
                <Plus className="h-3.5 w-3.5" /> Add
              </Button>
            </div>
            {showCertForm && (
              <div className="mt-3 space-y-2 rounded-xl border border-white/10 bg-white/[0.02] p-4">
                <input value={cert.name} onChange={(e) => setCert({ ...cert, name: e.target.value })} placeholder="Certificate name *" className="w-full rounded-xl border border-white/10 bg-transparent px-3 py-2 text-sm text-white outline-none placeholder:text-slate-500 focus:border-neon-cyan/50" />
                <input value={cert.issuer} onChange={(e) => setCert({ ...cert, issuer: e.target.value })} placeholder="Issuing organization *" className="w-full rounded-xl border border-white/10 bg-transparent px-3 py-2 text-sm text-white outline-none placeholder:text-slate-500 focus:border-neon-cyan/50" />
                <div className="flex gap-2">
                  <input value={cert.year} onChange={(e) => setCert({ ...cert, year: e.target.value })} placeholder="Year" type="number" className="w-28 rounded-xl border border-white/10 bg-transparent px-3 py-2 text-sm text-white outline-none placeholder:text-slate-500 focus:border-neon-cyan/50" />
                  <input value={cert.credentialUrl} onChange={(e) => setCert({ ...cert, credentialUrl: e.target.value })} placeholder="Credential URL" className="flex-1 rounded-xl border border-white/10 bg-transparent px-3 py-2 text-sm text-white outline-none placeholder:text-slate-500 focus:border-neon-cyan/50" />
                </div>
                <div className="flex gap-2">
                  <Button size="sm" onClick={addCert} disabled={!cert.name.trim() || !cert.issuer.trim()}>Save certificate</Button>
                  <Button size="sm" variant="ghost" onClick={() => setShowCertForm(false)}>Cancel</Button>
                </div>
              </div>
            )}
            {loadingExtras ? <Skeleton className="mt-3 h-20 w-full" /> : (
              <AnimatePresence mode="wait">
                {certs.length === 0 && !showCertForm ? (
                  <EmptyState
                    key="no-certs"
                    icon={Award}
                    title="No certifications yet"
                    subtitle="Click Add to showcase your credentials"
                  />
                ) : (
                  <motion.div
                    key="certs-grid"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="mt-3 grid gap-3 sm:grid-cols-2"
                  >
                    {certs.map((c, i) => (
                      <motion.div
                        key={c.id}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: i * 0.06 }}
                        className="relative flex items-start gap-3 rounded-xl border border-white/10 bg-white/[0.02] p-3 hover:border-white/[0.14] transition"
                      >
                        <button onClick={() => deleteCert(c.id)} className="absolute right-3 top-3 text-slate-600 hover:text-neon-magenta"><X className="h-4 w-4" /></button>
                        <Award className="mt-0.5 h-5 w-5 shrink-0 text-neon-lime" />
                        <div className="min-w-0 pr-6">
                          <p className="font-medium text-white">{c.name}</p>
                          <p className="text-xs text-slate-400">{c.issuer}{c.year ? ` · ${c.year}` : ""}</p>
                          {c.credentialUrl && <a href={c.credentialUrl} target="_blank" rel="noopener noreferrer" className="mt-1 flex items-center gap-1 text-xs text-neon-cyan hover:underline"><ExternalLink className="h-3 w-3" />View credential</a>}
                        </div>
                      </motion.div>
                    ))}
                  </motion.div>
                )}
              </AnimatePresence>
            )}
          </GlassCard>
          {/* Activity */}
          <GlassCard>
            <div className="flex items-center gap-2 mb-4">
              <Activity className="h-4 w-4 text-white/40" />
              <h3 className="font-display font-semibold text-white">Activity</h3>
              <span className="ml-auto text-[11px] text-white/20">Last 24 weeks</span>
            </div>
            <ActivityGrid />
            <div className="mt-4 grid grid-cols-3 gap-2">
              {[
                { label: "Profile views", value: fmt(me.followers * 3 + 12) },
                { label: "Matches", value: fmt(me.rep) },
                { label: "Connections", value: fmt(me.followers) },
              ].map((s) => (
                <div key={s.label} className="rounded-xl border border-white/[0.06] bg-white/[0.02] py-2.5 text-center">
                  <p className="font-display text-lg font-bold text-grad">{s.value}</p>
                  <p className="text-[10px] text-white/25">{s.label}</p>
                </div>
              ))}
            </div>
          </GlassCard>

          {/* GitHub */}
          {me.github && (
            <GlassCard>
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <Github className="h-4 w-4 text-white/50" />
                  <h3 className="font-display font-semibold text-white">GitHub</h3>
                </div>
                <a
                  href={`https://github.com/${me.github}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-1 text-xs text-neon-cyan hover:underline"
                >
                  @{me.github} <ExternalLink className="h-3 w-3" />
                </a>
              </div>
              <p className="text-[11px] font-medium text-white/25 mb-2 flex items-center gap-1.5">
                <GitCommit className="h-3 w-3" /> Contribution activity
              </p>
              <ActivityGrid />
            </GlassCard>
          )}
        </div>

        {/* Right */}
        <div className="space-y-4">
          <TrustCard score={me.trustScore} breakdown={me.trustBreakdown} suggestions={trustSuggestions(me)} />

          <GlassCard>
            <h3 className="font-display font-semibold text-white">Stats</h3>
            <div className="mt-4 grid grid-cols-3 gap-3 text-center">
              {[
                { k: "Followers", v: fmt(me.followers) },
                { k: "Projects", v: me.projects },
                { k: "Rep", v: fmt(me.rep) },
              ].map((x) => (
                <div key={x.k} className="rounded-xl border border-white/10 bg-white/[0.02] py-3">
                  <p className="font-display text-xl font-bold text-grad">{x.v}</p>
                  <p className="text-[11px] text-slate-500">{x.k}</p>
                </div>
              ))}
            </div>
          </GlassCard>
        </div>
      </div>
    </div>
  );
}

function TrustCard({ score, breakdown, suggestions }: { score: number; breakdown: TrustBreakdown; suggestions: string[] }) {
  const tier = trustTier(score);
  const data = (Object.keys(breakdown) as (keyof TrustBreakdown)[]).map((k) => ({ name: TRUST_LABELS[k], value: breakdown[k] }));
  const barColor = (v: number) => v >= 80 ? "#55805F" : v >= 50 ? "#C8862E" : "#A8503D";

  return (
    <GlassCard glow>
      <div className="flex items-center justify-between">
        <h3 className="font-display font-semibold text-white">Developer Trust Score</h3>
        <Badge tone={tier.tone}>{tier.emoji} {tier.label}</Badge>
      </div>
      <div className="mt-4 flex justify-center">
        <TrustMeter score={score} size={128} showTier={false} />
      </div>
      <div className="mt-4 h-36">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data} layout="vertical" margin={{ left: -10, right: 10 }}>
            <XAxis type="number" domain={[0, 100]} hide />
            <YAxis type="category" dataKey="name" width={78} stroke="#64748b" fontSize={11} tickLine={false} axisLine={false} />
            <Tooltip cursor={{ fill: "rgba(255,255,255,0.03)" }} contentStyle={{ background: "rgba(10,12,20,0.9)", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 10 }} />
            <Bar dataKey="value" radius={[0, 6, 6, 0]} barSize={12}>
              {data.map((d) => <Cell key={d.name} fill={barColor(d.value)} />)}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>
      <div className="mt-2 rounded-xl border border-white/10 bg-white/[0.02] p-3">
        <p className="mb-2 flex items-center gap-1.5 text-xs font-medium text-neon-cyan">
          <Lightbulb className="h-3.5 w-3.5" /> Suggestions to improve
        </p>
        <ul className="space-y-1.5">
          {suggestions.map((s) => (
            <li key={s} className="flex items-start gap-2 text-xs text-slate-300">
              <span className="mt-1 h-1 w-1 shrink-0 rounded-full bg-neon-cyan" /> {s}
            </li>
          ))}
        </ul>
      </div>
    </GlassCard>
  );
}
