"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import {
  Code2, Briefcase, ArrowRight, ArrowLeft, Check,
  Plus, X, Github, Globe, Twitter, Award, FolderGit2,
  SkipForward,
} from "lucide-react";
import { Button } from "@/components/ui/Button";
import { GlassCard } from "@/components/ui/GlassCard";
import { Logo } from "@/components/ui/Logo";
import { useAuth } from "@/context/AuthContext";
import { useToast } from "@/components/ui/Toast";
import { api } from "@/lib/api";
import { cn } from "@/lib/utils";

const TECH_STACK = [
  "React", "Next.js", "Vue", "Angular", "Svelte", "TypeScript", "JavaScript",
  "Node.js", "Express", "NestJS", "Python", "Django", "FastAPI", "Flask",
  "Go", "Rust", "Java", "Spring Boot", "Ruby", "Rails", "PHP", "Laravel",
  "PostgreSQL", "MongoDB", "MySQL", "Redis", "GraphQL", "REST", "Docker",
  "Kubernetes", "AWS", "GCP", "Azure", "Firebase", "Supabase", "Prisma",
  "TailwindCSS", "SASS", "Figma", "Swift", "Kotlin", "React Native", "Flutter",
];

const ROLES = [
  "Full-Stack Developer", "Frontend Developer", "Backend Developer", "Mobile Developer",
  "DevOps Engineer", "Data Scientist", "ML Engineer", "UI/UX Designer",
  "Product Manager", "Blockchain Developer", "Security Engineer", "QA Engineer",
];

// Default skill level applied to everything picked in the Stack step.
// Users can fine-tune individual levels later from profile settings —
// asking for a level per-technology during onboarding was the single
// biggest source of drop-off, so it's gone from this flow entirely.
const DEFAULT_SKILL_LEVEL = 50;

const slide = {
  enter: (dir: number) => ({ x: dir > 0 ? 60 : -60, opacity: 0 }),
  center: { x: 0, opacity: 1 },
  exit: (dir: number) => ({ x: dir < 0 ? 60 : -60, opacity: 0 }),
};

type ExtrasTab = "projects" | "certificates" | "links";

export default function Onboarding() {
  const { user, refreshUser, completeOnboarding } = useAuth();
  const navigate = useRouter();
  const toast = useToast();

  const [step, setStep] = useState(0);
  const [dir, setDir] = useState(1);
  const [saving, setSaving] = useState(false);

  // ---- Step 0: Profile (role type + basics, merged into one step) ----
  const [userType, setUserType] = useState<"developer" | "recruiter">("developer");
  const [role, setRole] = useState(user?.role ?? "");
  const [customRole, setCustomRole] = useState("");
  const [bio, setBio] = useState(user?.bio ?? "");
  const [location, setLocation] = useState(user?.location ?? "");
  const [availability, setAvailability] = useState<"available" | "open" | "busy">("open");

  // ---- Step 1: Stack (skills folded in — no separate level-setting step) ----
  const [stack, setStack] = useState<string[]>(user?.stack ?? []);
  const [customStack, setCustomStack] = useState("");

  // ---- Step 2 (developers only): Extras — Projects / Certificates / Links ----
  // Collapsed into one optional, skippable step instead of three forced ones.
  const [extrasTab, setExtrasTab] = useState<ExtrasTab>("projects");

  const [projects, setProjects] = useState<{ title: string; description: string; stack: string[]; repoUrl: string; liveUrl: string }[]>([]);
  const [proj, setProj] = useState({ title: "", description: "", stack: [] as string[], repoUrl: "", liveUrl: "" });
  const [showProjForm, setShowProjForm] = useState(false);

  const [certs, setCerts] = useState<{ name: string; issuer: string; year: string; credentialUrl: string }[]>([]);
  const [cert, setCert] = useState({ name: "", issuer: "", year: "", credentialUrl: "" });
  const [showCertForm, setShowCertForm] = useState(false);

  const [github, setGithub] = useState(user?.github ?? "");
  const [website, setWebsite] = useState(user?.website ?? "");
  const [twitter, setTwitter] = useState(user?.twitter ?? "");

  const isDev = userType === "developer";
  const totalSteps = isDev ? 3 : 2;

  const flushDrafts = () => {
    if (proj.title.trim()) {
      setProjects((prev) => [...prev, proj]);
      setProj({ title: "", description: "", stack: [], repoUrl: "", liveUrl: "" });
      setShowProjForm(false);
    }
    if (cert.name.trim() && cert.issuer.trim()) {
      setCerts((prev) => [...prev, cert]);
      setCert({ name: "", issuer: "", year: "", credentialUrl: "" });
      setShowCertForm(false);
    }
  };

  const go = (n: number) => {
    flushDrafts();
    setDir(n > step ? 1 : -1);
    setStep(n);
  };

  const addProject = () => {
    if (!proj.title.trim()) return;
    setProjects([...projects, proj]);
    setProj({ title: "", description: "", stack: [], repoUrl: "", liveUrl: "" });
    setShowProjForm(false);
  };

  const addCert = () => {
    if (!cert.name.trim() || !cert.issuer.trim()) return;
    setCerts([...certs, cert]);
    setCert({ name: "", issuer: "", year: "", credentialUrl: "" });
    setShowCertForm(false);
  };

  const finish = async () => {
    flushDrafts();
    setSaving(true);
    try {
      const finalRole = role === "other" ? customRole : role;
      const finalProjects = proj.title.trim() ? [...projects, proj] : projects;
      const finalCerts = cert.name.trim() && cert.issuer.trim() ? [...certs, cert] : certs;

      // Every selected stack tag becomes a skill at the same default level —
      // no per-tag level picker to fill out.
      const skills = stack.map((name) => ({ name, level: DEFAULT_SKILL_LEVEL }));

      await completeOnboarding({
        userType, role: finalRole, bio, location, availability,
        skills, stack, github, website, twitter,
      });

      await Promise.all(finalProjects.map((p) => api.createProject(p).catch(() => {})));

      for (const c of finalCerts) {
        await api.addCertificate({
          name: c.name, issuer: c.issuer,
          year: c.year ? Number(c.year) : undefined,
          credentialUrl: c.credentialUrl || undefined,
        });
      }

      await refreshUser();
      toast("Profile setup complete! Welcome to SkillShare 🚀");
      navigate.replace("/dashboard");
    } catch (err: any) {
      toast(err.message ?? "Failed to save profile", "error");
    } finally {
      setSaving(false);
    }
  };

  const stepLabels = isDev ? ["Profile", "Stack", "Extras"] : ["Profile", "Links"];

  const canNext = () => {
    if (step === 0) return role !== "" && bio.trim().length > 10;
    return true;
  };

  const isLastStep = step === totalSteps - 1;
  // The last step is always optional (Links for recruiters, Extras for devs) —
  // it can be skipped straight to finish rather than forcing every field.
  const isOptionalStep = isLastStep;

  return (
    <div className="min-h-screen bg-ink-950 flex flex-col items-center justify-center px-4 py-10">
      <div className="mb-8 text-center">
        <Logo />
        <p className="mt-2 text-sm text-slate-400">
          Just {totalSteps} quick steps — most of it's optional
        </p>
      </div>

      {/* Progress: numbered nodes instead of a bare bar */}
      <div className="mb-8 w-full max-w-lg">
        <div className="flex items-center">
          {stepLabels.map((label, i) => (
            <div key={label} className="flex flex-1 items-center last:flex-none">
              <div className="flex flex-col items-center gap-1.5">
                <div
                  className={cn(
                    "grid h-8 w-8 place-items-center rounded-full border-2 text-xs font-semibold transition-all duration-300",
                    i < step
                      ? "border-neon-cyan bg-neon-cyan text-ink-950"
                      : i === step
                      ? "border-neon-cyan bg-neon-cyan/10 text-neon-cyan shadow-glow-sm"
                      : "border-white/10 text-slate-500",
                  )}
                >
                  {i < step ? <Check className="h-4 w-4" /> : i + 1}
                </div>
                <span className={cn("text-[11px]", i === step ? "text-white" : "text-slate-500")}>
                  {label}
                </span>
              </div>
              {i < stepLabels.length - 1 && (
                <div className="mx-2 h-0.5 flex-1 -translate-y-3 rounded-full bg-white/10 overflow-hidden">
                  <motion.div
                    className="h-full bg-neon-cyan"
                    initial={false}
                    animate={{ width: i < step ? "100%" : "0%" }}
                    transition={{ duration: 0.3 }}
                  />
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      <div className="w-full max-w-lg">
        <AnimatePresence mode="wait" custom={dir}>
          <motion.div
            key={step}
            custom={dir}
            variants={slide}
            initial="enter"
            animate="center"
            exit="exit"
            transition={{ duration: 0.3, ease: [0.2, 0.8, 0.2, 1] }}
          >
            {/* STEP 0: Profile — who you are + the basics, one screen */}
            {step === 0 && (
              <GlassCard className="space-y-6">
                <div>
                  <h2 className="font-display text-2xl font-bold text-white">Let's set up your profile</h2>
                  <p className="mt-1 text-sm text-slate-400">Tell the community who you are.</p>
                </div>

                <div className="grid gap-3 sm:grid-cols-2">
                  <button
                    onClick={() => setUserType("developer")}
                    className={cn(
                      "flex items-center gap-3 rounded-2xl border-2 p-4 text-left transition-all",
                      userType === "developer"
                        ? "border-neon-cyan bg-neon-cyan/10 text-white"
                        : "border-white/10 text-slate-400 hover:border-white/30 hover:text-white",
                    )}
                  >
                    <div className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-neon-cyan/20">
                      <Code2 className="h-5 w-5 text-neon-cyan" />
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-white">Developer</p>
                      <p className="text-xs text-slate-400">Looking for teammates & cofounders</p>
                    </div>
                  </button>
                  <button
                    onClick={() => setUserType("recruiter")}
                    className={cn(
                      "flex items-center gap-3 rounded-2xl border-2 p-4 text-left transition-all",
                      userType === "recruiter"
                        ? "border-neon-magenta bg-neon-magenta/10 text-white"
                        : "border-white/10 text-slate-400 hover:border-white/30 hover:text-white",
                    )}
                  >
                    <div className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-neon-magenta/20">
                      <Briefcase className="h-5 w-5 text-neon-magenta" />
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-white">Recruiter</p>
                      <p className="text-xs text-slate-400">Hiring or scouting developers</p>
                    </div>
                  </button>
                </div>

                <div className="space-y-4">
                  <div>
                    <label className="mb-1.5 block text-sm font-medium text-slate-300">Role / Title</label>
                    <div className="flex flex-wrap gap-2">
                      {ROLES.map((r) => (
                        <button
                          key={r}
                          onClick={() => setRole(r)}
                          className={cn(
                            "rounded-lg border px-3 py-1.5 text-xs transition",
                            role === r
                              ? "border-neon-cyan bg-neon-cyan/10 text-neon-cyan"
                              : "border-white/10 text-slate-400 hover:text-white",
                          )}
                        >
                          {r}
                        </button>
                      ))}
                      <button
                        onClick={() => setRole("other")}
                        className={cn(
                          "rounded-lg border px-3 py-1.5 text-xs transition",
                          role === "other"
                            ? "border-neon-cyan bg-neon-cyan/10 text-neon-cyan"
                            : "border-white/10 text-slate-400 hover:text-white",
                        )}
                      >
                        Other
                      </button>
                    </div>
                    {role === "other" && (
                      <input
                        value={customRole}
                        onChange={(e) => setCustomRole(e.target.value)}
                        placeholder="Your title..."
                        className="mt-2 w-full rounded-xl border border-white/10 bg-white/[0.03] px-3 py-2 text-sm text-white outline-none placeholder:text-slate-500 focus:border-neon-cyan/50"
                      />
                    )}
                  </div>

                  <div>
                    <label className="mb-1.5 block text-sm font-medium text-slate-300">
                      Bio <span className="text-slate-500">(min. 10 chars)</span>
                    </label>
                    <textarea
                      value={bio}
                      onChange={(e) => setBio(e.target.value)}
                      rows={3}
                      placeholder="Tell others what you're building and what you're looking for..."
                      className="w-full rounded-xl border border-white/10 bg-white/[0.03] px-3 py-2 text-sm text-white outline-none placeholder:text-slate-500 focus:border-neon-cyan/50 resize-none"
                    />
                    <p className="mt-1 text-xs text-slate-600">{bio.length} chars</p>
                  </div>

                  <div className="grid gap-4 sm:grid-cols-2">
                    <div>
                      <label className="mb-1.5 block text-sm font-medium text-slate-300">Location</label>
                      <input
                        value={location}
                        onChange={(e) => setLocation(e.target.value)}
                        placeholder="City, Country"
                        className="w-full rounded-xl border border-white/10 bg-white/[0.03] px-3 py-2 text-sm text-white outline-none placeholder:text-slate-500 focus:border-neon-cyan/50"
                      />
                    </div>
                    {isDev && (
                      <div>
                        <label className="mb-1.5 block text-sm font-medium text-slate-300">Availability</label>
                        <div className="flex gap-1.5">
                          {(["available", "open", "busy"] as const).map((a) => (
                            <button
                              key={a}
                              onClick={() => setAvailability(a)}
                              title={a}
                              className={cn(
                                "flex-1 rounded-xl border py-2 text-xs font-medium capitalize transition",
                                availability === a
                                  ? a === "available" ? "border-neon-lime bg-neon-lime/10 text-neon-lime"
                                    : a === "open" ? "border-neon-cyan bg-neon-cyan/10 text-neon-cyan"
                                    : "border-slate-500 bg-slate-500/10 text-slate-300"
                                  : "border-white/10 text-slate-500 hover:text-white",
                              )}
                            >
                              {a === "available" ? "🟢" : a === "open" ? "🟡" : "🔴"}
                            </button>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </GlassCard>
            )}

            {/* STEP 1: Stack (skills default in automatically — one less step) */}
            {step === 1 && isDev && (
              <GlassCard className="space-y-5">
                <div>
                  <h2 className="font-display text-2xl font-bold text-white">Your tech stack</h2>
                  <p className="mt-1 text-sm text-slate-400">
                    Select what you work with. You can fine-tune skill levels later in your profile.
                  </p>
                </div>
                <div className="flex flex-wrap gap-2">
                  {TECH_STACK.map((t) => (
                    <button
                      key={t}
                      onClick={() => setStack((s) => (s.includes(t) ? s.filter((x) => x !== t) : [...s, t]))}
                      className={cn(
                        "rounded-lg border px-3 py-1.5 text-xs transition",
                        stack.includes(t)
                          ? "border-neon-cyan bg-neon-cyan/10 text-neon-cyan"
                          : "border-white/10 text-slate-400 hover:text-white",
                      )}
                    >
                      {t}
                    </button>
                  ))}
                  {stack.filter((s) => !TECH_STACK.includes(s)).map((t) => (
                    <button
                      key={t}
                      onClick={() => setStack((s) => s.filter((x) => x !== t))}
                      className="flex items-center gap-1 rounded-lg border border-neon-cyan bg-neon-cyan/10 px-3 py-1.5 text-xs text-neon-cyan"
                    >
                      {t} <X className="h-3 w-3" />
                    </button>
                  ))}
                </div>
                <div className="flex gap-2">
                  <input
                    value={customStack}
                    onChange={(e) => setCustomStack(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter" && customStack.trim()) {
                        setStack((s) => (s.includes(customStack.trim()) ? s : [...s, customStack.trim()]));
                        setCustomStack("");
                      }
                    }}
                    placeholder="Add something not listed..."
                    className="flex-1 rounded-xl border border-white/10 bg-white/[0.03] px-3 py-2 text-sm text-white outline-none placeholder:text-slate-500 focus:border-neon-cyan/50"
                  />
                  <Button
                    variant="outline"
                    size="md"
                    onClick={() => {
                      if (!customStack.trim()) return;
                      setStack((s) => (s.includes(customStack.trim()) ? s : [...s, customStack.trim()]));
                      setCustomStack("");
                    }}
                  >
                    <Plus className="h-4 w-4" />
                  </Button>
                </div>
                {stack.length > 0 && (
                  <p className="text-xs text-slate-500">{stack.length} selected</p>
                )}
              </GlassCard>
            )}

            {/* STEP 2 (dev): Extras — Projects / Certificates / Links, all optional in one step */}
            {step === 2 && isDev && (
              <GlassCard className="space-y-5">
                <div>
                  <h2 className="font-display text-2xl font-bold text-white">Anything to add?</h2>
                  <p className="mt-1 text-sm text-slate-400">
                    Projects, certificates, and links are all optional — add now or later.
                  </p>
                </div>

                <div className="flex gap-1 rounded-xl border border-white/10 bg-white/[0.02] p-1">
                  {([
                    ["projects", "Projects", FolderGit2, projects.length],
                    ["certificates", "Certificates", Award, certs.length],
                    ["links", "Links", Globe, [github, website, twitter].filter(Boolean).length],
                  ] as const).map(([key, label, Icon, count]) => (
                    <button
                      key={key}
                      onClick={() => setExtrasTab(key)}
                      className={cn(
                        "flex flex-1 items-center justify-center gap-1.5 rounded-lg py-2 text-xs font-medium transition",
                        extrasTab === key ? "bg-white/10 text-white" : "text-slate-500 hover:text-white",
                      )}
                    >
                      <Icon className="h-3.5 w-3.5" />
                      {label}
                      {count > 0 && <span className="text-neon-cyan">({count})</span>}
                    </button>
                  ))}
                </div>

                {extrasTab === "projects" && (
                  <div className="space-y-3">
                    {!showProjForm ? (
                      <Button variant="outline" size="sm" onClick={() => setShowProjForm(true)}>
                        <Plus className="h-4 w-4" /> Add a project
                      </Button>
                    ) : (
                      <div className="space-y-3 rounded-xl border border-white/10 bg-white/[0.02] p-4">
                        <input
                          value={proj.title}
                          onChange={(e) => setProj({ ...proj, title: e.target.value })}
                          placeholder="Project title *"
                          className="w-full rounded-xl border border-white/10 bg-transparent px-3 py-2 text-sm text-white outline-none placeholder:text-slate-500 focus:border-neon-cyan/50"
                        />
                        <textarea
                          value={proj.description}
                          onChange={(e) => setProj({ ...proj, description: e.target.value })}
                          rows={2}
                          placeholder="What does it do?"
                          className="w-full rounded-xl border border-white/10 bg-transparent px-3 py-2 text-sm text-white outline-none placeholder:text-slate-500 focus:border-neon-cyan/50 resize-none"
                        />
                        <input
                          value={proj.repoUrl}
                          onChange={(e) => setProj({ ...proj, repoUrl: e.target.value })}
                          placeholder="Repo URL"
                          className="w-full rounded-xl border border-white/10 bg-transparent px-3 py-2 text-sm text-white outline-none placeholder:text-slate-500 focus:border-neon-cyan/50"
                        />
                        <input
                          value={proj.liveUrl}
                          onChange={(e) => setProj({ ...proj, liveUrl: e.target.value })}
                          placeholder="Live URL"
                          className="w-full rounded-xl border border-white/10 bg-transparent px-3 py-2 text-sm text-white outline-none placeholder:text-slate-500 focus:border-neon-cyan/50"
                        />
                        <div className="flex gap-2">
                          <Button size="sm" onClick={addProject} disabled={!proj.title.trim()}>Save</Button>
                          <Button size="sm" variant="ghost" onClick={() => setShowProjForm(false)}>Cancel</Button>
                        </div>
                      </div>
                    )}
                    <div className="space-y-2 max-h-48 overflow-y-auto">
                      {projects.map((p, i) => (
                        <div key={i} className="flex items-start gap-3 rounded-xl border border-white/10 bg-white/[0.02] p-3">
                          <FolderGit2 className="mt-0.5 h-4 w-4 shrink-0 text-neon-cyan" />
                          <div className="min-w-0 flex-1">
                            <p className="font-medium text-white">{p.title}</p>
                            {p.description && <p className="text-xs text-slate-400 truncate">{p.description}</p>}
                          </div>
                          <button onClick={() => setProjects(projects.filter((_, j) => j !== i))} className="text-slate-600 hover:text-neon-magenta">
                            <X className="h-4 w-4" />
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {extrasTab === "certificates" && (
                  <div className="space-y-3">
                    {!showCertForm ? (
                      <Button variant="outline" size="sm" onClick={() => setShowCertForm(true)}>
                        <Plus className="h-4 w-4" /> Add a certificate
                      </Button>
                    ) : (
                      <div className="space-y-3 rounded-xl border border-white/10 bg-white/[0.02] p-4">
                        <input
                          value={cert.name}
                          onChange={(e) => setCert({ ...cert, name: e.target.value })}
                          placeholder="Certificate name *"
                          className="w-full rounded-xl border border-white/10 bg-transparent px-3 py-2 text-sm text-white outline-none placeholder:text-slate-500 focus:border-neon-cyan/50"
                        />
                        <input
                          value={cert.issuer}
                          onChange={(e) => setCert({ ...cert, issuer: e.target.value })}
                          placeholder="Issuing organization *"
                          className="w-full rounded-xl border border-white/10 bg-transparent px-3 py-2 text-sm text-white outline-none placeholder:text-slate-500 focus:border-neon-cyan/50"
                        />
                        <div className="flex gap-2">
                          <input
                            value={cert.year}
                            onChange={(e) => setCert({ ...cert, year: e.target.value })}
                            placeholder="Year"
                            type="number"
                            className="w-28 rounded-xl border border-white/10 bg-transparent px-3 py-2 text-sm text-white outline-none placeholder:text-slate-500 focus:border-neon-cyan/50"
                          />
                          <input
                            value={cert.credentialUrl}
                            onChange={(e) => setCert({ ...cert, credentialUrl: e.target.value })}
                            placeholder="Credential URL"
                            className="flex-1 rounded-xl border border-white/10 bg-transparent px-3 py-2 text-sm text-white outline-none placeholder:text-slate-500 focus:border-neon-cyan/50"
                          />
                        </div>
                        <div className="flex gap-2">
                          <Button size="sm" onClick={addCert} disabled={!cert.name.trim() || !cert.issuer.trim()}>Save</Button>
                          <Button size="sm" variant="ghost" onClick={() => setShowCertForm(false)}>Cancel</Button>
                        </div>
                      </div>
                    )}
                    <div className="space-y-2 max-h-48 overflow-y-auto">
                      {certs.map((c, i) => (
                        <div key={i} className="flex items-start gap-3 rounded-xl border border-white/10 bg-white/[0.02] p-3">
                          <Award className="mt-0.5 h-4 w-4 shrink-0 text-neon-lime" />
                          <div className="min-w-0 flex-1">
                            <p className="font-medium text-white">{c.name}</p>
                            <p className="text-xs text-slate-400">{c.issuer}{c.year ? ` · ${c.year}` : ""}</p>
                          </div>
                          <button onClick={() => setCerts(certs.filter((_, j) => j !== i))} className="text-slate-600 hover:text-neon-magenta">
                            <X className="h-4 w-4" />
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {extrasTab === "links" && (
                  <div className="space-y-3">
                    <div className="flex items-center gap-3 rounded-xl border border-white/10 bg-white/[0.03] px-3 py-2">
                      <Github className="h-4 w-4 text-slate-400 shrink-0" />
                      <span className="text-sm text-slate-500">github.com/</span>
                      <input
                        value={github}
                        onChange={(e) => setGithub(e.target.value)}
                        placeholder="username"
                        className="flex-1 bg-transparent text-sm text-white outline-none placeholder:text-slate-600"
                      />
                    </div>
                    <div className="flex items-center gap-3 rounded-xl border border-white/10 bg-white/[0.03] px-3 py-2">
                      <Globe className="h-4 w-4 text-slate-400 shrink-0" />
                      <input
                        value={website}
                        onChange={(e) => setWebsite(e.target.value)}
                        placeholder="https://yoursite.com"
                        className="flex-1 bg-transparent text-sm text-white outline-none placeholder:text-slate-600"
                      />
                    </div>
                    <div className="flex items-center gap-3 rounded-xl border border-white/10 bg-white/[0.03] px-3 py-2">
                      <Twitter className="h-4 w-4 text-slate-400 shrink-0" />
                      <span className="text-sm text-slate-500">@</span>
                      <input
                        value={twitter}
                        onChange={(e) => setTwitter(e.target.value)}
                        placeholder="twitterhandle"
                        className="flex-1 bg-transparent text-sm text-white outline-none placeholder:text-slate-600"
                      />
                    </div>
                  </div>
                )}
              </GlassCard>
            )}

            {/* STEP 1 (recruiter): Links — the only other step, and it's optional */}
            {step === 1 && !isDev && (
              <GlassCard className="space-y-5">
                <div>
                  <h2 className="font-display text-2xl font-bold text-white">Social links</h2>
                  <p className="mt-1 text-sm text-slate-400">Optional — helps developers trust your profile.</p>
                </div>
                <div className="space-y-3">
                  <div className="flex items-center gap-3 rounded-xl border border-white/10 bg-white/[0.03] px-3 py-2">
                    <Github className="h-4 w-4 text-slate-400 shrink-0" />
                    <span className="text-sm text-slate-500">github.com/</span>
                    <input
                      value={github}
                      onChange={(e) => setGithub(e.target.value)}
                      placeholder="username"
                      className="flex-1 bg-transparent text-sm text-white outline-none placeholder:text-slate-600"
                    />
                  </div>
                  <div className="flex items-center gap-3 rounded-xl border border-white/10 bg-white/[0.03] px-3 py-2">
                    <Globe className="h-4 w-4 text-slate-400 shrink-0" />
                    <input
                      value={website}
                      onChange={(e) => setWebsite(e.target.value)}
                      placeholder="https://yourcompany.com"
                      className="flex-1 bg-transparent text-sm text-white outline-none placeholder:text-slate-600"
                    />
                  </div>
                  <div className="flex items-center gap-3 rounded-xl border border-white/10 bg-white/[0.03] px-3 py-2">
                    <Twitter className="h-4 w-4 text-slate-400 shrink-0" />
                    <span className="text-sm text-slate-500">@</span>
                    <input
                      value={twitter}
                      onChange={(e) => setTwitter(e.target.value)}
                      placeholder="twitterhandle"
                      className="flex-1 bg-transparent text-sm text-white outline-none placeholder:text-slate-600"
                    />
                  </div>
                </div>
              </GlassCard>
            )}
          </motion.div>
        </AnimatePresence>

        {/* Navigation */}
        <div className="mt-6 flex items-center justify-between gap-3">
          {step > 0 ? (
            <Button variant="outline" onClick={() => go(step - 1)}>
              <ArrowLeft className="h-4 w-4" /> Back
            </Button>
          ) : (
            <div />
          )}

          <div className="flex items-center gap-3">
            {isOptionalStep && (
              <button
                onClick={finish}
                disabled={saving}
                className="flex items-center gap-1.5 text-xs font-medium text-slate-500 hover:text-white transition disabled:opacity-40"
              >
                Skip for now <SkipForward className="h-3.5 w-3.5" />
              </button>
            )}
            {!isLastStep ? (
              <Button onClick={() => go(step + 1)} disabled={!canNext()}>
                Next <ArrowRight className="h-4 w-4" />
              </Button>
            ) : (
              <Button onClick={finish} loading={saving}>
                <Check className="h-4 w-4" /> Finish setup
              </Button>
            )}
          </div>
        </div>

        <p className="mt-4 text-center text-xs text-slate-600">
          You can update everything later in your profile settings
        </p>
      </div>
    </div>
  );
}
