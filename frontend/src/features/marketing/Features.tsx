"use client";

import { motion } from "framer-motion";
import { Panel } from "@/design-system/Panel";
import { SectionHeading } from "./SectionHeading";
import { FEATURES } from "./data";

export function Features() {
  return (
    <section id="features" className="mx-auto max-w-5xl scroll-mt-24 px-4 py-16 sm:px-6" aria-label="Features">
      <SectionHeading
        title="Everything you need to ship with someone"
        subtitle="Not just a directory of profiles — the whole loop from finding people to actually building with them."
      />
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {FEATURES.map((f, i) => (
          <motion.div
            key={f.title}
            initial={{ opacity: 0, y: 16 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-60px" }}
            transition={{ delay: i * 0.05, duration: 0.5 }}
          >
            <Panel className="h-full">
              <div className="grid h-10 w-10 place-items-center rounded border border-neon-cyan/25 bg-neon-cyan/[0.08]">
                <f.icon className="h-5 w-5 text-neon-cyan" aria-hidden />
              </div>
              <h3 className="mt-4 font-display text-base font-semibold text-white">{f.title}</h3>
              <p className="mt-1.5 text-sm leading-relaxed text-white/40">{f.desc}</p>
            </Panel>
          </motion.div>
        ))}
      </div>
    </section>
  );
}
