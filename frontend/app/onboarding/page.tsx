"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import {
  Code2, Briefcase, ArrowRight, ArrowLeft, Check,
  Plus, X, Github, Globe, Twitter, Award, FolderGit2,
} from "lucide-react";
import { Button } from "@/components/ui/Button";
import { GlassCard } from "@/components/ui/GlassCard";
import { Logo } from "@/components/ui/Logo";
import { useAuth } from "@/context/AuthContext";
import { useToast } from "@/components/ui/Toast";
import { api } from "@/lib/api";
import { cn } from "@/lib/utils";

const TECH_STACK = [
  "React","Next.js","Vue","Angular","Svelte","TypeScript","JavaScript",
  "Node.js","Express","NestJS","Python","Django","FastAPI","Flask",
  "Go","Rust","Java","Spring Boot","Ruby","Rails","PHP","Laravel",
  "PostgreSQL","MongoDB","MySQL","Redis","GraphQL","REST","Docker",
  "Kubernetes","AWS","GCP","Azure","Firebase","Supabase","Prisma",
  "TailwindCSS","SASS","Figma","Swift","Kotlin","React Native","Flutter",
];

const SKILL_LEVELS = [
  { value: 25, label: "Beginner" },
  { value: 50, label: "Intermediate" },
  { value: 75, label: "Advanced" },
  { value: 95, label: "Expert" },
];

const ROLES = [
  "Full-Stack Developer","Frontend Developer","Backend Developer","Mobile Developer",
  "DevOps Engineer","Data Scientist","ML Engineer","UI/UX Designer",
  "Product Manager","Blockchain Developer","Security Engineer","QA Engineer",
];

const slide = {
  enter: (dir: number) => ({ x: dir > 0 ? 60 : -60, opacity: 0 }),
  center: { x: 0, opacity: 1 },
  exit: (dir: number) => ({ x: dir < 0 ? 60 : -60, opacity: 0 }),
};

export default function Onboarding() {
  const { user, refreshUser, completeOnboarding } = useAuth();
  const navigate = useRouter();
  const toast = useToast();

  const [step, setStep] = useState(0);
  const [dir, setDir] = useState(1);
  const [saving, setSaving] = useState(false);

  // Step 1: Role selection
  const [userType, setUserType] = useState<"developer" | "recruiter">("developer");

  // Step 2: Basic profile
  const [role, setRole] = useState(user?.role ?? "");
  const [customRole, setCustomRole] = useState("");
  const [bio, setBio] = useState(user?.bio ?? "");
  const [location, setLocation] = useState(user?.location ?? "");
  const [availability, setAvailability] = useState<"available" | "open" | "busy">("open");

  // Step 3: Tech stack
  const [stack, setStack] = useState<string[]>(user?.stack ?? []);
  const [customStack, setCustomStack] = useState("");

  // Step 4: Skills (developer only)
  const [skills, setSkills] = useState<{ name: string; level: number }[]>(user?.skills ?? []);
  const [skillName, setSkillName] = useState("");
  const [skillLevel, setSkillLevel] = useState(50);

  // Step 5: Projects (developer only)
  const [projects, setProjects] = useState<{ title: string; description: string; stack: string[]; repoUrl: string; liveUrl: string }[]>([]);
  const [proj, setProj] = useState({ title: "", description: "", stack: [] as string[], repoUrl: "", liveUrl: "" });
  const [showProjForm, setShowProjForm] = useState(false);

  // Step 6: Certificates
  const [certs, setCerts] = useState<{ name: string; issuer: string; year: string; credentialUrl: string }[]>([]);
  const [cert, setCert] = useState({ name: "", issuer: "", year: "", credentialUrl: "" });
  const [showCertForm, setShowCertForm] = useState(false);

  // Step 7: Links
  const [github, setGithub] = useState(user?.github ?? "");
  const [website, setWebsite] = useState(user?.website ?? "");
  const [twitter, setTwitter] = useState(user?.twitter ?? "");

  const isDev = userType === "developer";
  const totalSteps = isDev ? 7 : 4;

  // Auto-flush any in-progress form data before moving steps
  const flushDrafts = () => {
    if (skillName.trim() && !skills.find((s) => s.name.toLowerCase() === skillName.toLowerCase())) {
      setSkills((prev) => [...prev, { name: skillName.trim(), level: skillLevel }]);
      setSkillName("");
    }
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

  const addSkill = () => {
    if (!skillName.trim()) return;
    if (skills.find((s) => s.name.toLowerCase() === skillName.toLowerCase())) return;
    setSkills([...skills, { name: skillName.trim(), level: skillLevel }]);
    setSkillName("");
    setSkillLevel(50);
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

      // Capture current state (flushDrafts uses setState which is async,
      // so we read the up-to-date values from the flush above synchronously)
      const finalSkills = skillName.trim() && !skills.find((s) => s.name.toLowerCase() === skillName.toLowerCase())
        ? [...skills, { name: skillName.trim(), level: skillLevel }]
        : skills;
      const finalCerts = cert.name.trim() && cert.issuer.trim()
        ? [...certs, cert]
        : certs;
      const finalProjects = proj.title.trim()
        ? [...projects, proj]
        : projects;

      await completeOnboarding({
        userType, role: finalRole, bio, location, availability,
        skills: finalSkills, stack, github, website, twitter,
      });

      // Submit projects in parallel for speed
      await Promise.all(finalProjects.map((p) => api.createProject(p).catch(() => {})));

      // Submit certificates sequentially (embedded subdoc)
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

  const stepLabels = isDev
    ? ["Role","Profile","Stack","Skills","Projects","Certificates","Links"]
    : ["Role","Profile","Stack","Links"];

  const canNext = () => {
    if (step === 0) return true;
    if (step === 1) return role !== "" && bio.length > 10;
    return true;
  };

  return (
    <div className="min-h-screen bg-ink-950 flex flex-col items-center justify-center px-4 py-10">
      {/* Header */}
      <div className="mb-8 text-center">
        <Logo />
        <p className="mt-2 text-sm text-slate-400">Let's set up your profile in {totalSteps} steps</p>
      </div>

      {/* Progress bar */}
      <div className="mb-8 w-full max-w-lg">
        <div className="flex items-center justify-between text-xs text-slate-500 mb-2">
          <span>{stepLabels[step]}</span>
          <span>{step + 1} / {totalSteps}</span>
        </div>
        <div className="h-1.5 w-full overflow-hidden rounded-full bg-white/10">
          <motion.div
            className="h-full rounded-full bg-neon-grad"
            initial={false}
            animate={{ width: `${((step + 1) / totalSteps) * 100}%` }}
            transition={{ duration: 0.4, ease: "easeOut" }}
          />
        </div>
        <div className="flex gap-1 mt-3">
          {Array.from({ length: totalSteps }).map((_, i) => (
            <div
              key={i}
              className={cn(
                "flex-1 h-0.5 rounded-full transition-colors duration-300",
                i <= step ? "bg-neon-cyan" : "bg-white/10",
              )}
            />
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
            {/* STEP 0: Role */}
            {step === 0 && (
              <GlassCard className="space-y-6">
                <div>
                  <h2 className="font-display text-2xl font-bold text-white">What brings you here?</h2>
                  <p className="mt-1 text-sm text-slate-400">This helps us tailor your experience.</p>
                </div>
                <div className="grid gap-4 sm:grid-cols-2">
                  <button
                    onClick={() => setUserType("developer")}
                    className={cn(
                      "flex flex-col items-center gap-3 rounded-2xl border-2 p-6 text-center transition-all",
                      userType === "developer"
                        ? "border-neon-cyan bg-neon-cyan/10 text-white shadow-glow"
                        : "border-white/10 text-slate-400 hover:border-white/30 hover:text-white",
                    )}
                  >
                    <div className="grid h-14 w-14 place-items-center rounded-2xl bg-neon-cyan/20">
                      <Code2 className="h-7 w-7 text-neon-cyan" />
                    </div>
                    <div>
                      <p className="font-semibold text-white">I'm a Developer</p>
                      <p className="mt-1 text-xs text-slate-400">Building products, looking for teammates & cofounders</p>
                    </div>
                    {userType === "developer" && (
                      <div className="flex h-5 w-5 items-center justify-center rounded-full bg-neon-cyan">
                        <Check className="h-3 w-3 text-ink-950" />
                      </div>
                    )}
                  </button>
                  <button
                    onClick={() => setUserType("recruiter")}
                    className={cn(
                      "flex flex-col items-center gap-3 rounded-2xl border-2 p-6 text-center transition-all",
                      userType === "recruiter"
                        ? "border-neon-magenta bg-neon-magenta/10 text-white shadow-glow"
                        : "border-white/10 text-slate-400 hover:border-white/30 hover:text-white",
                    )}
                  >
                    <div className="grid h-14 w-14 place-items-center rounded-2xl bg-neon-magenta/20">
                      <Briefcase className="h-7 w-7 text-neon-magenta" />
                    </div>
                    <div>
                      <p className="font-semibold text-white">I'm a Recruiter</p>
                      <p className="mt-1 text-xs text-slate-400">Looking for talented developers to hire or collaborate with</p>
                    </div>
                    {userType === "recruiter" && (
                      <div className="flex h-5 w-5 items-center justify-center rounded-full bg-neon-magenta">
                        <Check className="h-3 w-3 text-ink-950" />
                      </div>
                    )}
                  </button>
                </div>
              </GlassCard>
            )}

            {/* STEP 1: Profile basics */}
            {step === 1 && (
              <GlassCard className="space-y-5">
                <div>
                  <h2 className="font-display text-2xl font-bold text-white">Your profile</h2>
                  <p className="mt-1 text-sm text-slate-400">Tell the community about yourself.</p>
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
                    <label className="mb-1.5 block text-sm font-medium text-slate-300">Bio <span className="text-slate-500">(min. 10 chars)</span></label>
                    <textarea
                      value={bio}
                      onChange={(e) => setBio(e.target.value)}
                      rows={3}
                      placeholder="Tell others what you're building and what you're looking for..."
                      className="w-full rounded-xl border border-white/10 bg-white/[0.03] px-3 py-2 text-sm text-white outline-none placeholder:text-slate-500 focus:border-neon-cyan/50 resize-none"
                    />
                    <p className="mt-1 text-xs text-slate-600">{bio.length} chars</p>
                  </div>
                  <div>
                    <label className="mb-1.5 block text-sm font-medium text-slate-300">Location</label>
                    <input
                      value={location}
                      onChange={(e) => setLocation(e.target.value)}
                      placeholder="City, Country"
                      className="w-full rounded-xl border border-white/10 bg-white/[0.03] px-3 py-2 text-sm text-white outline-none placeholder:text-slate-500 focus:border-neon-cyan/50"
                    />
                  </div>
                  <div>
                    <label className="mb-1.5 block text-sm font-medium text-slate-300">Availability</label>
                    <div className="flex gap-2">
                      {(["available","open","busy"] as const).map((a) => (
                        <button
                          key={a}
                          onClick={() => setAvailability(a)}
                          className={cn(
                            "flex-1 rounded-xl border py-2 text-xs font-medium capitalize transition",
                            availability === a
                              ? a === "available" ? "border-neon-lime bg-neon-lime/10 text-neon-lime"
                                : a === "open" ? "border-neon-cyan bg-neon-cyan/10 text-neon-cyan"
                                : "border-slate-500 bg-slate-500/10 text-slate-300"
                              : "border-white/10 text-slate-500 hover:text-white",
                          )}
                        >
                          {a === "available" ? "🟢 Available" : a === "open" ? "🟡 Open" : "🔴 Busy"}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              </GlassCard>
            )}

            {/* STEP 2: Tech Stack */}
            {step === 2 && (
              <GlassCard className="space-y-5">
                <div>
                  <h2 className="font-display text-2xl font-bold text-white">Your tech stack</h2>
                  <p className="mt-1 text-sm text-slate-400">Select all technologies you work with.</p>
                </div>
                <div className="flex flex-wrap gap-2">
                  {TECH_STACK.map((t) => (
                    <button
                      key={t}
                      onClick={() =>
                        setStack((s) => s.includes(t) ? s.filter((x) => x !== t) : [...s, t])
                      }
                      className={cn(
                        "rounded-lg border px-3 py-1.5 text-xs transition",
                        stack.includes(t)
                          ? "border-neon-cyan bg-neon-cyan/10 text-neon-cyan"
                          : "border-white/10 text-slate-400 hover:text-white",
                      )}
                    >
                      {stack.includes(t) && <Check className="mr-1 inline h-3 w-3" />}
                      {t}
                    </button>
                  ))}
                </div>
                <div className="flex gap-2">
                  <input
                    value={customStack}
                    onChange={(e) => setCustomStack(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter" && customStack.trim()) {
                        setStack((s) => [...s, customStack.trim()]);
                        setCustomStack("");
                      }
                    }}
                    placeholder="Add custom tech..."
                    className="flex-1 rounded-xl border border-white/10 bg-white/[0.03] px-3 py-2 text-sm text-white outline-none placeholder:text-slate-500 focus:border-neon-cyan/50"
                  />
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => {
                      if (customStack.trim()) {
                        setStack((s) => [...s, customStack.trim()]);
                        setCustomStack("");
                      }
                    }}
                  >
                    Add
                  </Button>
                </div>
                {stack.length > 0 && (
                  <div className="flex flex-wrap gap-1.5">
                    {stack.map((t) => (
                      <span key={t} className="flex items-center gap-1 rounded-lg bg-neon-cyan/10 px-2.5 py-1 text-xs text-neon-cyan">
                        {t}
                        <button onClick={() => setStack((s) => s.filter((x) => x !== t))}>
                          <X className="h-3 w-3" />
                        </button>
                      </span>
                    ))}
                  </div>
                )}
              </GlassCard>
            )}

            {/* STEP 3: Skills (developers only) */}
            {step === 3 && isDev && (
              <GlassCard className="space-y-5">
                <div>
                  <h2 className="font-display text-2xl font-bold text-white">Your skills</h2>
                  <p className="mt-1 text-sm text-slate-400">Add skills with your proficiency level.</p>
                </div>
                <div className="flex gap-2">
                  <input
                    value={skillName}
                    onChange={(e) => setSkillName(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && addSkill()}
                    placeholder="Skill name (e.g. React, Python)"
                    className="flex-1 rounded-xl border border-white/10 bg-white/[0.03] px-3 py-2 text-sm text-white outline-none placeholder:text-slate-500 focus:border-neon-cyan/50"
                  />
                </div>
                <div>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-slate-400">Proficiency</span>
                    <div className="flex gap-2">
                      {SKILL_LEVELS.map((l) => (
                        <button
                          key={l.value}
                          onClick={() => setSkillLevel(l.value)}
                          className={cn(
                            "rounded-lg border px-2 py-1 text-xs transition",
                            skillLevel === l.value
                              ? "border-neon-cyan bg-neon-cyan/10 text-neon-cyan"
                              : "border-white/10 text-slate-500 hover:text-white",
                          )}
                        >
                          {l.label}
                        </button>
                      ))}
                    </div>
                  </div>
                  <input
                    type="range"
                    min={1}
                    max={100}
                    value={skillLevel}
                    onChange={(e) => setSkillLevel(Number(e.target.value))}
                    className="mt-2 w-full accent-neon-cyan"
                  />
                </div>
                <Button size="sm" onClick={addSkill} disabled={!skillName.trim()}>
                  <Plus className="h-4 w-4" /> Add skill
                </Button>
                <div className="space-y-2 max-h-56 overflow-y-auto">
                  {skills.map((s) => (
                    <div key={s.name} className="flex items-center gap-3 rounded-xl border border-white/10 bg-white/[0.02] p-3">
                      <div className="flex-1">
                        <div className="flex justify-between text-sm">
                          <span className="text-white">{s.name}</span>
                          <span className="text-slate-500">{s.level}%</span>
                        </div>
                        <div className="mt-1.5 h-1.5 overflow-hidden rounded-full bg-white/5">
                          <div className="h-full rounded-full bg-neon-grad" style={{ width: `${s.level}%` }} />
                        </div>
                      </div>
                      <button onClick={() => setSkills(skills.filter((x) => x.name !== s.name))} className="text-slate-600 hover:text-neon-magenta">
                        <X className="h-4 w-4" />
                      </button>
                    </div>
                  ))}
                  {skills.length === 0 && (
                    <p className="text-center text-sm text-slate-600 py-4">No skills added yet</p>
                  )}
                </div>
              </GlassCard>
            )}

            {/* STEP 4: Projects (developers only) */}
            {step === 4 && isDev && (
              <GlassCard className="space-y-5">
                <div>
                  <h2 className="font-display text-2xl font-bold text-white">Your projects</h2>
                  <p className="mt-1 text-sm text-slate-400">Showcase what you've built — optional but boosts your trust score.</p>
                </div>
                {!showProjForm ? (
                  <Button variant="outline" size="sm" onClick={() => setShowProjForm(true)}>
                    <FolderGit2 className="h-4 w-4" /> Add a project
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
                      placeholder="What does it do?"
                      rows={2}
                      className="w-full resize-none rounded-xl border border-white/10 bg-transparent px-3 py-2 text-sm text-white outline-none placeholder:text-slate-500 focus:border-neon-cyan/50"
                    />
                    <input
                      value={proj.repoUrl}
                      onChange={(e) => setProj({ ...proj, repoUrl: e.target.value })}
                      placeholder="GitHub / repo URL"
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
                <div className="space-y-2 max-h-56 overflow-y-auto">
                  {projects.map((p, i) => (
                    <div key={i} className="flex items-start gap-3 rounded-xl border border-white/10 bg-white/[0.02] p-3">
                      <FolderGit2 className="mt-0.5 h-4 w-4 shrink-0 text-neon-cyan" />
                      <div className="min-w-0 flex-1">
                        <p className="font-medium text-white">{p.title}</p>
                        {p.description && <p className="text-xs text-slate-400 truncate">{p.description}</p>}
                        {p.repoUrl && <p className="text-xs text-neon-cyan truncate">{p.repoUrl}</p>}
                      </div>
                      <button onClick={() => setProjects(projects.filter((_, j) => j !== i))} className="text-slate-600 hover:text-neon-magenta">
                        <X className="h-4 w-4" />
                      </button>
                    </div>
                  ))}
                  {projects.length === 0 && !showProjForm && (
                    <p className="text-center text-sm text-slate-600 py-2">No projects added yet</p>
                  )}
                </div>
              </GlassCard>
            )}

            {/* STEP 5: Certificates (developers only) */}
            {step === 5 && isDev && (
              <GlassCard className="space-y-5">
                <div>
                  <h2 className="font-display text-2xl font-bold text-white">Certifications</h2>
                  <p className="mt-1 text-sm text-slate-400">Add your certificates — each one boosts your trust score.</p>
                </div>
                {!showCertForm ? (
                  <Button variant="outline" size="sm" onClick={() => setShowCertForm(true)}>
                    <Award className="h-4 w-4" /> Add a certificate
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
                      placeholder="Issuing organization (e.g. AWS, Google, Coursera) *"
                      className="w-full rounded-xl border border-white/10 bg-transparent px-3 py-2 text-sm text-white outline-none placeholder:text-slate-500 focus:border-neon-cyan/50"
                    />
                    <div className="flex gap-2">
                      <input
                        value={cert.year}
                        onChange={(e) => setCert({ ...cert, year: e.target.value })}
                        placeholder="Year (e.g. 2024)"
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
                <div className="space-y-2 max-h-56 overflow-y-auto">
                  {certs.map((c, i) => (
                    <div key={i} className="flex items-start gap-3 rounded-xl border border-white/10 bg-white/[0.02] p-3">
                      <Award className="mt-0.5 h-4 w-4 shrink-0 text-neon-lime" />
                      <div className="min-w-0 flex-1">
                        <p className="font-medium text-white">{c.name}</p>
                        <p className="text-xs text-slate-400">{c.issuer}{c.year ? ` · ${c.year}` : ""}</p>
                        {c.credentialUrl && <a href={c.credentialUrl} target="_blank" rel="noopener noreferrer" className="text-xs text-neon-cyan hover:underline truncate block">View credential</a>}
                      </div>
                      <button onClick={() => setCerts(certs.filter((_, j) => j !== i))} className="text-slate-600 hover:text-neon-magenta">
                        <X className="h-4 w-4" />
                      </button>
                    </div>
                  ))}
                  {certs.length === 0 && !showCertForm && (
                    <p className="text-center text-sm text-slate-600 py-2">No certificates added yet</p>
                  )}
                </div>
              </GlassCard>
            )}

            {/* STEP 6 (dev) or 3 (recruiter): Links */}
            {((step === 6 && isDev) || (step === 3 && !isDev)) && (
              <GlassCard className="space-y-5">
                <div>
                  <h2 className="font-display text-2xl font-bold text-white">Social links</h2>
                  <p className="mt-1 text-sm text-slate-400">Connect your profiles — all optional.</p>
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

          {step < totalSteps - 1 ? (
            <Button onClick={() => go(step + 1)} disabled={!canNext()}>
              Next <ArrowRight className="h-4 w-4" />
            </Button>
          ) : (
            <Button onClick={finish} loading={saving}>
              <Check className="h-4 w-4" /> Finish setup
            </Button>
          )}
        </div>

        <p className="mt-4 text-center text-xs text-slate-600">
          You can update everything later in your profile settings
        </p>
      </div>
    </div>
  );
}
