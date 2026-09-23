"use client";

import { motion } from "framer-motion";
import { Check } from "lucide-react";
import { useRouter } from "next/navigation";
import { Panel } from "@/design-system/Panel";
import { Button } from "@/design-system/Button";
import { SectionHeading } from "./SectionHeading";
import { PLANS } from "./data";

export function Pricing() {
  const router = useRouter();
  return (
    <section id="pricing" className="mx-auto max-w-4xl scroll-mt-24 px-4 py-16 sm:px-6" aria-label="Pricing">
      <SectionHeading title="Simple, transparent pricing" subtitle="Start free. Upgrade only if you're forming more than one team or hiring." />
      <div className="grid gap-5 sm:grid-cols-3">
        {PLANS.map((p, i) => (
          <motion.div
            key={p.name}
            initial={{ opacity: 0, y: 16 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-60px" }}
            transition={{ delay: i * 0.06, duration: 0.5 }}
            className={p.highlighted ? "sm:-translate-y-2" : undefined}
          >
            <Panel
              accent={p.highlighted}
              className={`flex h-full flex-col ${p.highlighted ? "border-neon-cyan/30" : ""}`}
            >
              {p.highlighted && (
                <span className="absolute -top-3 right-4 rounded bg-neon-grad px-2.5 py-1 text-[10px] font-semibold uppercase tracking-wide text-ink-950">
                  Most popular
                </span>
              )}
              <h3 className="font-display text-base font-semibold text-white">{p.name}</h3>
              <p className="mt-1 text-xs text-white/40">{p.desc}</p>
              <p className="mt-4">
                <span className="font-display text-3xl font-bold text-white">{p.price}</span>
                {p.price !== "$0" && <span className="text-sm text-white/30">/mo</span>}
              </p>
              <ul className="mt-5 flex-1 space-y-2.5">
                {p.features.map((f) => (
                  <li key={f} className="flex items-start gap-2 text-sm text-white/60">
                    <Check className="mt-0.5 h-3.5 w-3.5 shrink-0 text-neon-cyan" aria-hidden />
                    {f}
                  </li>
                ))}
              </ul>
              <Button
                className="mt-6 w-full"
                variant={p.highlighted ? "solid" : "outline"}
                onClick={() => router.push("/signup")}
              >
                {p.price === "$0" ? "Get started free" : `Start ${p.name}`}
              </Button>
            </Panel>
          </motion.div>
        ))}
      </div>
    </section>
  );
}
