import { cn } from "@/lib/utils";

export function Logo({ className, withWord = true }: { className?: string; withWord?: boolean }) {
  return (
    <div className={cn("flex items-center gap-2", className)}>
      {/* A tally/check mark on an index tab — the roster metaphor: someone
          has been vetted and entered onto the sheet. */}
      <span className="relative grid h-8 w-8 shrink-0 place-items-center rounded-[3px] bg-neon-grad shadow-glow-sm">
        <svg viewBox="0 0 24 24" className="h-[17px] w-[17px]" fill="none">
          <path d="M5 12.5 10 17 19 7" stroke="#14161A" strokeWidth={2.6} strokeLinecap="square" strokeLinejoin="miter" />
        </svg>
      </span>
      {withWord && (
        <span className="font-display text-lg font-bold tracking-tight text-slate-900 dark:text-white">
          Skill<span className="text-grad">Share</span>
        </span>
      )}
    </div>
  );
}
