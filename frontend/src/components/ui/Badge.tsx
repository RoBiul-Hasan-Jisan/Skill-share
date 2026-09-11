import type { HTMLAttributes } from "react";
import { cn } from "@/lib/utils";

type Tone = "default" | "cyan" | "blue" | "magenta" | "lime";

// Restrained tones — subtle tint, not cartoon-bright
const tones: Record<Tone, string> = {
  default:
    "border-white/8 bg-white/[0.05] text-slate-400 dark:border-white/8 dark:bg-white/[0.05] dark:text-slate-400",
  cyan:
    "border-neon-cyan/20 bg-neon-cyan/[0.08] text-neon-cyan",
  blue:
    "border-neon-blue/20 bg-neon-blue/[0.08] text-neon-blue dark:text-blue-400",
  magenta:
    "border-neon-magenta/20 bg-neon-magenta/[0.08] text-neon-magenta dark:text-pink-400",
  lime:
    "border-neon-lime/20 bg-neon-lime/[0.08] text-neon-lime dark:text-lime-400",
};

export function Badge({
  className,
  tone = "default",
  ...rest
}: HTMLAttributes<HTMLSpanElement> & { tone?: Tone }) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 rounded-full border px-2.5 py-0.5 text-[11px] font-medium tracking-wide",
        tones[tone],
        className,
      )}
      {...rest}
    />
  );
}
