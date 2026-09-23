"use client";

import { motion, useReducedMotion, type Variants } from "framer-motion";
import { Sparkles, ArrowRight } from "lucide-react";
import { Button } from "@/design-system/Button";
import { STATS } from "./data";

const EASE: [number, number, number, number] = [0.16, 1, 0.3, 1];
const fadeUp: Variants = {
  hidden: { opacity: 0, y: 16 },
  show: (i = 0) => ({ opacity: 1, y: 0, transition: { delay: i * 0.06, duration: 0.5, ease: EASE } }),
};
const fadeOnly: Variants = {
  hidden: { opacity: 0 },
  show: (i = 0) => ({ opacity: 1, transition: { delay: i * 0.06, duration: 0.5, ease: EASE } }),
};

/** Left-aligned manifest header instead of a centered SaaS hero — the
 *  roster number ("0001") stands in for the usual eyebrow pill. */
export function Hero({ onDemo, demoLoading, onGetStarted }: {
  onDemo: () => void; demoLoading: boolean; onGetStarted: () => void;
}) {
  const reduceMotion = useReducedMotion();
  const fade = reduceMotion ? fadeOnly : fadeUp;

  return (
    <section className="relative mx-auto max-w-4xl px-4 pt-36 pb-14 sm:px-6">
      <motion.div initial="hidden" animate="show" variants={fade} className="flex items-center gap-2 text-xs font-medium uppercase tracking-[0.18em] text-neon-cyan/70">
        Skill-based matching, no keyword soup
      </motion.div>

      <motion.h1
        initial="hidden" animate="show" variants={fade} custom={1}
        className="mt-6 max-w-2xl font-display text-4xl font-bold leading-[1.08] tracking-tight text-white sm:text-6xl"
      >
        Find your dev team,
        <br />
        <span className="text-grad">not just a contact.</span>
      </motion.h1>

      <motion.p
        initial="hidden" animate="show" variants={fade} custom={2}
        className="mt-5 max-w-lg text-base leading-relaxed text-white/45"
      >
        SkillShare matches you with cofounders, hackathon teammates, and collaborators —
        then gives you chat, teams, and a Kanban board to actually build with them.
      </motion.p>

      <motion.div initial="hidden" animate="show" variants={fade} custom={3} className="mt-8 flex flex-wrap items-center gap-3">
        <Button size="lg" onClick={onGetStarted}>
          Get started <ArrowRight className="h-4 w-4" aria-hidden />
        </Button>
        <Button size="lg" variant="outline" loading={demoLoading} onClick={onDemo} aria-busy={demoLoading}>
          <Sparkles className="h-4 w-4" aria-hidden /> Try the demo account
        </Button>
      </motion.div>

      <motion.p initial="hidden" animate="show" variants={fade} custom={4} className="mt-4 text-xs text-white/25">
        No signup needed for the demo — logs you straight into a live account.
      </motion.p>

      <motion.div
        initial="hidden" animate="show" variants={fade} custom={5}
        className="glass mt-14 flex divide-x divide-white/[0.07]"
      >
        {STATS.map((s) => (
          <div key={s.label} className="flex-1 px-5 py-5 text-center sm:px-8">
            <p className="font-display text-xl font-bold text-white sm:text-2xl">{s.value}</p>
            <p className="mt-0.5 text-xs text-white/35">{s.label}</p>
          </div>
        ))}
      </motion.div>
    </section>
  );
}
