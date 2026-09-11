import { cn } from "@/lib/utils";

export function Logo({ className, withWord = true }: { className?: string; withWord?: boolean }) {
  return (
    <div className={cn("flex items-center gap-2", className)}>
      <span className="relative grid h-8 w-8 place-items-center rounded-lg bg-neon-grad shadow-glow">
        {/* Two interlocking sparks — two developers' work fusing into one shared build. */}
        <svg viewBox="0 0 24 24" className="h-[18px] w-[18px]" fill="none">
          <path
            d="M9.5 3 6 11h4l-1.5 10L15 12h-4l1.5-9z"
            fill="#0a0c10"
            fillOpacity={0.92}
          />
          <path
            d="M16.5 8 14 14h2.6l-.9 5.5L20 13h-2.4l1-5z"
            fill="#0a0c10"
            fillOpacity={0.5}
          />
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
