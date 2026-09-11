"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  motion,
  AnimatePresence,
  useReducedMotion,
  type Variants,
} from "framer-motion";
import {
  Sparkles, ArrowRight, MessageSquare, Rocket, Shield,
  Search, Kanban, Check, Github, ChevronDown,
} from "lucide-react";
import { MarketingNav } from "@/components/layout/MarketingNav";
import { Button } from "@/components/ui/Button";
import { GlassCard } from "@/components/ui/GlassCard";
import { Logo } from "@/components/ui/Logo";
import { useAuth } from "@/context/AuthContext";
import { useToast } from "@/components/ui/Toast";
import { DEMO_EMAIL, DEMO_PASSWORD } from "@/lib/demo";

const EASE: [number, number, number, number] = [0.16, 1, 0.3, 1];

const fadeUp: Variants = {
  hidden: { opacity: 0, y: 16 },
  show: (i = 0) => ({
    opacity: 1,
    y: 0,
    transition: { delay: i * 0.06, duration: 0.5, ease: EASE },
  }),
};

const fadeOnly: Variants = {
  hidden: { opacity: 0 },
  show: (i = 0) => ({
    opacity: 1,
    transition: { delay: i * 0.06, duration: 0.5, ease: EASE },
  }),
};

const FEATURES = [
  { icon: Sparkles, title: "Smart matching", desc: "Ranked by skills, stack, and what you're looking for — cofounder, hackathon, or collaborator." },
  { icon: Search, title: "Developer search", desc: "Find people by name, role, skill, or stack in seconds." },
  { icon: MessageSquare, title: "Real-time chat", desc: "DMs and team rooms with typing indicators and read receipts." },
  { icon: Kanban, title: "Teams + Kanban", desc: "Spin up a team, invite people, and track work on a shared board." },
  { icon: Shield, title: "Trust Score", desc: "A transparent, composite score from profile, projects, and activity." },
  { icon: Rocket, title: "Startups board", desc: "Post an idea, find people who want to build it with you." },
];

const STEPS = [
  { n: "01", title: "Build your profile", desc: "Skills, stack, projects, and what you're looking for." },
  { n: "02", title: "Get matched", desc: "See ranked teammates and cofounders — with the reasons why you match." },
  { n: "03", title: "Connect and build", desc: "Message, form a team, and track work together on one board." },
];

const STATS = [
  { value: "3.2k+", label: "Builders" },
  { value: "480", label: "Teams formed" },
  { value: "12k", label: "Matches made" },
];

const PLANS = [
  { name: "Free", price: "$0", desc: "Everything you need to find a team.", features: ["Full matching + search", "Unlimited connections", "1 active team"] },
  { name: "Pro", price: "$9", desc: "For builders shipping seriously.", features: ["Everything in Free", "Unlimited teams", "Priority in recruiter search"], highlighted: true },
  { name: "Startup", price: "$29", desc: "For small teams hiring.", features: ["Everything in Pro", "Recruiter dashboard", "Candidate shortlisting"] },
];

const FAQS = [
  { q: "Is the demo really free?", a: "Yes. The demo button logs you into a pre-seeded live account — real matches, a connection, and a chat — with no signup and no card." },
  { q: "How does matching actually work?", a: "We score you against other builders using skills, stack overlap, experience level, and the intent you pick (cofounder, hackathon, collaborator). Every match shows the reasons behind it, so you're never guessing." },
  { q: "Can I use it just for a hackathon?", a: "Absolutely. A lot of teams form for a weekend and stay together afterwards. You can archive a team and start a new one whenever you like." },
  { q: "Can I cancel Pro anytime?", a: "Yes — plans are month-to-month and you can downgrade to Free whenever. You keep your profile, matches, and connections." },
];

function SectionHeading({
  eyebrow,
  title,
  subtitle,
}: {
  eyebrow: string;
  title: string;
  subtitle?: string;
}) {
  return (
    <motion.div
      initial="hidden"
      whileInView="show"
      viewport={{ once: true, margin: "-80px" }}
      variants={fadeUp}
      className="mx-auto mb-10 max-w-xl text-center"
    >
      <span className="text-xs font-semibold uppercase tracking-[0.18em] text-neon-cyan/70">
        {eyebrow}
      </span>
      <h2 className="mt-3 font-display text-2xl font-bold tracking-tight text-white sm:text-3xl">
        {title}
      </h2>
      {subtitle && (
        <p className="mt-3 text-sm leading-relaxed text-white/40">{subtitle}</p>
      )}
    </motion.div>
  );
}

export default function HomePage() {
  const router = useRouter();
  const { login } = useAuth();
  const toast = useToast();
  const [demoLoading, setDemoLoading] = useState(false);
  const [openFaq, setOpenFaq] = useState<number | null>(0);

  const reduceMotion = useReducedMotion();
  const fade = reduceMotion ? fadeOnly : fadeUp;

  const tryDemo = async () => {
    if (demoLoading) return;
    setDemoLoading(true);
    try {
      await login(DEMO_EMAIL, DEMO_PASSWORD);
      toast("Welcome to the demo — poke around freely");
      router.push("/dashboard");
    } catch (err) {
      toast(
        err instanceof Error ? err.message : "Demo account is unavailable right now",
        "error"
      );
    } finally {
      setDemoLoading(false);
    }
  };

  return (
    <div className="relative min-h-screen overflow-hidden bg-ink-950">
      <div className="pointer-events-none absolute inset-0 bg-neon-soft" aria-hidden />
      <MarketingNav />

      {/* ── Hero ───────────────────────────────────────────── */}
      <section className="relative mx-auto max-w-3xl px-4 pt-40 pb-16 text-center sm:px-6">
        <motion.span
          initial="hidden"
          animate="show"
          variants={fade}
          className="mb-5 inline-flex items-center gap-1.5 rounded-full border border-neon-cyan/20 bg-neon-cyan/[0.06] px-3 py-1 text-xs font-medium text-neon-cyan"
        >
          <Sparkles className="h-3 w-3" aria-hidden />
          Skill-based matching, no keyword soup
        </motion.span>

        <motion.h1
          initial="hidden"
          animate="show"
          variants={fade}
          custom={1}
          className="font-display text-4xl font-bold leading-tight tracking-tight text-white sm:text-5xl"
        >
          Find your dev team,
          <br />
          <span className="text-grad">not just a contact</span>
        </motion.h1>

        <motion.p
          initial="hidden"
          animate="show"
          variants={fade}
          custom={2}
          className="mx-auto mt-5 max-w-xl text-base leading-relaxed text-white/45"
        >
          SkillShare matches you with cofounders, hackathon teammates, and collaborators —
          then gives you chat, teams, and a Kanban board to actually build with them.
        </motion.p>

        <motion.div
          initial="hidden"
          animate="show"
          variants={fade}
          custom={3}
          className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row"
        >
          <Button size="lg" onClick={() => router.push("/signup")}>
            Get started <ArrowRight className="h-4 w-4" aria-hidden />
          </Button>
          <Button
            size="lg"
            variant="outline"
            loading={demoLoading}
            onClick={tryDemo}
            aria-busy={demoLoading}
          >
            Try the demo account
          </Button>
        </motion.div>

        <motion.p
          initial="hidden"
          animate="show"
          variants={fade}
          custom={4}
          className="mt-4 text-xs text-white/25"
        >
          No signup needed for the demo — logs you straight into a live account.
        </motion.p>
      </section>


      {/* ── How it works ───────────────────────────────────── */}
      <section
        id="how-it-works"
        className="mx-auto max-w-3xl scroll-mt-24 px-4 py-16 sm:px-6"
        aria-label="How it works"
      >
        <SectionHeading eyebrow="Process" title="How it works" />

        <ol className="space-y-6">
          {STEPS.map((s, i) => (
            <motion.li
              key={s.n}
              initial="hidden"
              whileInView="show"
              viewport={{ once: true, margin: "-60px" }}
              custom={i}
              variants={fade}
              className="flex items-start gap-4"
            >
              <span
                className="mt-0.5 font-mono text-xs font-semibold text-neon-cyan/60"
                aria-hidden
              >
                {s.n}
              </span>
              <div>
                <h3 className="text-sm font-semibold text-white">{s.title}</h3>
                <p className="mt-1 text-sm text-white/40">{s.desc}</p>
              </div>
            </motion.li>
          ))}
        </ol>
      </section>

      {/* ── Matching anchor ────────────────────────────────── */}
      <section
        id="matching"
        className="mx-auto max-w-3xl scroll-mt-24 px-4 py-16 text-center sm:px-6"
      >
        <motion.div
          initial="hidden"
          whileInView="show"
          viewport={{ once: true, margin: "-60px" }}
          variants={fade}
        >
          <GlassCard glow className="mx-auto max-w-lg py-10">
            <Sparkles className="mx-auto mb-4 h-6 w-6 text-neon-cyan" aria-hidden />
            <h3 className="font-display text-lg font-bold text-white">
              See real matches in the demo
            </h3>
            <p className="mx-auto mt-2 max-w-sm text-sm leading-relaxed text-white/40">
              The demo account is pre-loaded with real matches, a connection, and a live chat —
              the fastest way to see how matching actually feels.
            </p>
            <Button className="mt-5" loading={demoLoading} onClick={tryDemo}>
              Try the demo account <ArrowRight className="h-4 w-4" aria-hidden />
            </Button>
          </GlassCard>
        </motion.div>
      </section>



      {/* ── FAQ ────────────────────────────────────────────── */}
      <section
        id="faq"
        className="mx-auto max-w-2xl scroll-mt-24 px-4 py-16 sm:px-6"
        aria-label="Frequently asked questions"
      >
        <SectionHeading eyebrow="FAQ" title="Questions, answered" />

        <div className="divide-y divide-white/[0.06] rounded-2xl border border-white/[0.06] bg-white/[0.02]">
          {FAQS.map((f, i) => {
            const isOpen = openFaq === i;
            return (
              <div key={f.q}>
                <h3>
                  <button
                    type="button"
                    onClick={() => setOpenFaq(isOpen ? null : i)}
                    aria-expanded={isOpen}
                    aria-controls={`faq-panel-${i}`}
                    className="flex w-full items-center justify-between gap-4 px-5 py-4 text-left text-sm font-medium text-white/80 transition-colors hover:text-white"
                  >
                    {f.q}
                    <ChevronDown
                      className={`h-4 w-4 shrink-0 text-white/30 transition-transform duration-200 ${
                        isOpen ? "rotate-180" : ""
                      }`}
                      aria-hidden
                    />
                  </button>
                </h3>

                <AnimatePresence initial={false}>
                  {isOpen && (
                    <motion.div
                      id={`faq-panel-${i}`}
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: "auto", opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.25, ease: EASE }}
                      className="overflow-hidden"
                    >
                      <p className="px-5 pb-4 text-sm leading-relaxed text-white/40">
                        {f.a}
                      </p>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            );
          })}
        </div>
      </section>

    

      {/* ── Footer ─────────────────────────────────────────── */}
      <footer className="border-t border-white/[0.05]">
        <div className="mx-auto flex max-w-4xl flex-col items-center justify-between gap-6 px-4 py-10 text-center sm:flex-row sm:items-start sm:px-6 sm:text-left">
          <div>
            <Logo />
            <p className="mt-2 text-xs text-white/25">Skill-based developer collaboration.</p>
          </div>

          <nav aria-label="Footer" className="flex flex-wrap justify-center gap-x-6 gap-y-2">
            {[
              { href: "#features", label: "Features" },
              { href: "#how-it-works", label: "How it works" },
              { href: "#pricing", label: "Pricing" },
              { href: "#faq", label: "FAQ" },
            ].map((l) => (
              <a
                key={l.href}
                href={l.href}
                className="text-xs text-white/30 transition-colors hover:text-white/60"
              >
                {l.label}
              </a>
            ))}
          </nav>

          <div className="flex items-center gap-4">
            <a
              href="https://github.com/RoBiul-Hasan-Jisan"
              target="_blank"
              rel="noopener noreferrer"
              className="grid h-8 w-8 place-items-center rounded-xl border border-white/[0.07] bg-white/[0.03] text-white/30 transition-colors hover:text-white/60"
              aria-label="GitHub"
            >
              <Github className="h-4 w-4" aria-hidden />
            </a>
            <p className="text-xs text-white/20">© {new Date().getFullYear()} SkillShare</p>
          </div>
        </div>
      </footer>
    </div>
  );
}