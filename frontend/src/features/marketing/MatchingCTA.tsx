"use client";

import { motion } from "framer-motion";
import { Sparkles, ArrowRight } from "lucide-react";
import { Panel } from "@/design-system/Panel";
import { Button } from "@/design-system/Button";

export function MatchingCTA({ onDemo, demoLoading }: { onDemo: () => void; demoLoading: boolean }) {
  return (
    <section id="matching" className="mx-auto max-w-3xl scroll-mt-24 px-4 py-16 text-center sm:px-6">
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, margin: "-60px" }}
        transition={{ duration: 0.5 }}
      >
        <Panel accent className="mx-auto max-w-lg py-10">
          <Sparkles className="mx-auto mb-4 h-6 w-6 text-neon-cyan" aria-hidden />
          <h3 className="font-display text-lg font-bold text-white">See real matches in the demo</h3>
          <p className="mx-auto mt-2 max-w-sm text-sm leading-relaxed text-white/40">
            The demo account is pre-loaded with real matches, a connection, and a live chat —
            the fastest way to see how matching actually feels.
          </p>
          <Button className="mt-5" loading={demoLoading} onClick={onDemo}>
            Try the demo account <ArrowRight className="h-4 w-4" aria-hidden />
          </Button>
        </Panel>
      </motion.div>
    </section>
  );
}
