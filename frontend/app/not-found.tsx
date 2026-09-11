"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/Button";
import { Logo } from "@/components/ui/Logo";

/* Animated dot grid background */
function NodeGrid() {
  const count = 80;
  return (
    <div className="pointer-events-none absolute inset-0 overflow-hidden">
      {Array.from({ length: count }).map((_, i) => {
        const x = Math.random() * 100;
        const y = Math.random() * 100;
        const delay = Math.random() * 4;
        const duration = 3 + Math.random() * 4;
        const size = Math.random() > 0.85 ? 3 : 1.5;
        return (
          <motion.div
            key={i}
            className="absolute rounded-full bg-white"
            style={{ left: `${x}%`, top: `${y}%`, width: size, height: size }}
            animate={{ opacity: [0.05, 0.25, 0.05] }}
            transition={{ duration, delay, repeat: Infinity, ease: "easeInOut" }}
          />
        );
      })}

      {/* Connection lines */}
      {Array.from({ length: 8 }).map((_, i) => {
        const x1 = 15 + Math.random() * 70;
        const y1 = 15 + Math.random() * 70;
        const x2 = 15 + Math.random() * 70;
        const y2 = 15 + Math.random() * 70;
        return (
          <motion.svg
            key={`line-${i}`}
            className="absolute inset-0 h-full w-full"
            initial={{ opacity: 0 }}
            animate={{ opacity: [0, 0.07, 0] }}
            transition={{ duration: 4 + Math.random() * 3, delay: Math.random() * 5, repeat: Infinity }}
          >
            <line
              x1={`${x1}%`} y1={`${y1}%`}
              x2={`${x2}%`} y2={`${y2}%`}
              stroke="rgba(59,130,246,0.6)"
              strokeWidth="0.5"
              strokeDasharray="4 4"
            />
          </motion.svg>
        );
      })}
    </div>
  );
}

export default function NotFound() {
  return (
    <div className="relative grid min-h-screen place-items-center px-6 text-center overflow-hidden">
      <NodeGrid />

      {/* Glow blob */}
      <div
        className="pointer-events-none absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2"
        style={{
          width: "60vw",
          height: "40vh",
          background: "radial-gradient(ellipse, rgba(59,130,246,0.06) 0%, transparent 70%)",
        }}
      />

      <div className="relative z-10 flex flex-col items-center">
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <Logo className="mx-auto mb-10 justify-center" />
        </motion.div>

        {/* 404 number */}
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.6, ease: [0.2, 0.8, 0.2, 1] }}
          className="relative"
        >
          <span
            className="font-display text-[120px] sm:text-[160px] font-black leading-none select-none"
            style={{
              background: "linear-gradient(135deg, rgba(59,130,246,0.15) 0%, rgba(99,102,241,0.15) 100%)",
              WebkitBackgroundClip: "text",
              WebkitTextFillColor: "transparent",
              backgroundClip: "text",
              filter: "drop-shadow(0 0 40px rgba(59,130,246,0.15))",
            }}
          >
            404
          </span>
          {/* Glitch layers */}
          <motion.span
            aria-hidden
            animate={{ x: [-2, 2, -1, 0], opacity: [0, 0.3, 0.3, 0] }}
            transition={{ duration: 0.2, repeat: Infinity, repeatDelay: 3.5 }}
            className="font-display text-[120px] sm:text-[160px] font-black leading-none absolute inset-0 select-none"
            style={{
              background: "linear-gradient(135deg, rgba(59,130,246,0.4) 0%, rgba(99,102,241,0.4) 100%)",
              WebkitBackgroundClip: "text",
              WebkitTextFillColor: "transparent",
              backgroundClip: "text",
            }}
          >
            404
          </motion.span>
        </motion.div>

        <motion.h1
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2, duration: 0.5 }}
          className="mt-4 font-display text-xl sm:text-2xl font-semibold text-white"
        >
          This node isn't in the mesh.
        </motion.h1>

        <motion.p
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3, duration: 0.5 }}
          className="mt-2 max-w-sm text-slate-400"
        >
          The page you're looking for drifted off the graph. Let's get you back on the network.
        </motion.p>

        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4, duration: 0.5 }}
          className="mt-8 flex flex-wrap items-center justify-center gap-3"
        >
          <Link href="/dashboard">
            <Button>Back to dashboard</Button>
          </Link>
          <Link href="/discover">
            <Button variant="outline">Find teammates</Button>
          </Link>
        </motion.div>

        {/* Decorative border card */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.6, duration: 0.8 }}
          className="mt-12 rounded-2xl border border-white/[0.06] bg-white/[0.02] px-6 py-4 text-xs text-slate-600"
        >
          Error 404 · Page not found · SkillShare
        </motion.div>
      </div>
    </div>
  );
}
