"use client";

import { motion } from "framer-motion";

export function SectionHeading({
  title, subtitle,
}: { title: string; subtitle?: string }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-80px" }}
      transition={{ duration: 0.5 }}
      className="mb-10"
    >
      <h2 className="font-display text-2xl font-bold tracking-tight text-white sm:text-3xl">{title}</h2>
      {subtitle && <p className="mt-2 max-w-lg text-sm leading-relaxed text-white/40">{subtitle}</p>}
    </motion.div>
  );
}
