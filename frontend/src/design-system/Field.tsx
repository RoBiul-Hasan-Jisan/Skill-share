import type { InputHTMLAttributes } from "react";
import type { LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

export function Field({
  icon: Icon,
  label,
  className,
  ...props
}: { icon?: LucideIcon; label?: string } & InputHTMLAttributes<HTMLInputElement>) {
  return (
    <label className="block">
      {label && (
        <span className="mb-1.5 block text-xs font-medium text-slate-400">{label}</span>
      )}
      <div
        className={cn(
          "flex items-center gap-2 rounded border border-white/12 bg-white/[0.03] px-3",
          "transition-colors focus-within:border-neon-cyan/60",
          className,
        )}
      >
        {Icon && <Icon className="h-4 w-4 shrink-0 text-slate-500" />}
        <input
          {...props}
          className="h-11 w-full bg-transparent text-sm text-white outline-none placeholder:text-slate-500"
        />
      </div>
    </label>
  );
}
