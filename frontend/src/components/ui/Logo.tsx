import Image from "next/image";
import { cn } from "@/lib/utils";

export function Logo({ className, withWord = true }: { className?: string; withWord?: boolean }) {
  return (
    <div className={cn("flex items-center gap-2", className)}>
      <Image
        src="/logo.png"
        alt="SkillShare"
        width={32}
        height={32}
        className="h-8 w-8 shrink-0 object-contain"
        priority
      />
      {withWord && (
        <span className="font-display text-lg font-bold tracking-tight text-slate-900 dark:text-white">
          Skill<span className="text-grad">Share</span>
        </span>
      )}
    </div>
  );
}
