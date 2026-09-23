"use client";

import { motion } from "framer-motion";
import { SectionHeading } from "./SectionHeading";
import { STEPS } from "./data";

export function HowItWorks() {
  return (
    <section id="how-it-works" className="mx-auto max-w-3xl scroll-mt-24 px-4 py-16 sm:px-6" aria-label="How it works">
      <SectionHeading title="How it works" />
      <ol className="section-line divide-y divide-white/[0.06] border-t">
        {STEPS.map((s, i) => (
          <motion.li
            key={s.title}
            initial={{ opacity: 0, y: 12 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-60px" }}
            transition={{ delay: i * 0.06, duration: 0.5 }}
            className="flex items-start gap-4 py-5"
          >
            <div>
              <h3 className="text-sm font-semibold text-white">{s.title}</h3>
              <p className="mt-1 text-sm text-white/40">{s.desc}</p>
            </div>
          </motion.li>
        ))}
      </ol>
    </section>
  );
}
