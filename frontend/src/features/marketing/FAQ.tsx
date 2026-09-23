"use client";

import { useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { ChevronDown } from "lucide-react";
import { SectionHeading } from "./SectionHeading";
import { FAQS } from "./data";

const EASE: [number, number, number, number] = [0.16, 1, 0.3, 1];

export function FAQ() {
  const [openFaq, setOpenFaq] = useState<number | null>(0);
  return (
    <section id="faq" className="mx-auto max-w-2xl scroll-mt-24 px-4 py-16 sm:px-6" aria-label="Frequently asked questions">
      <SectionHeading title="Questions, answered" />
      <div className="glass divide-y divide-white/[0.06] p-0">
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
                  <span>{f.q}</span>
                  <ChevronDown className={`h-4 w-4 shrink-0 text-white/30 transition-transform duration-200 ${isOpen ? "rotate-180" : ""}`} aria-hidden />
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
                    <p className="px-5 pb-4 text-sm leading-relaxed text-white/40">{f.a}</p>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          );
        })}
      </div>
    </section>
  );
}
