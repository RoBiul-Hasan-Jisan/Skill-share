import { cn, initials } from "@/lib/utils";
import type { Availability } from "@/types";

const dot: Record<Availability, string> = {
  available: "bg-neon-lime",
  open: "bg-neon-cyan",
  busy: "bg-amber-400",
};

export function Avatar({
  src,
  name,
  size = 40,
  status,
  className,
}: {
  src?: string;
  name: string;
  size?: number;
  status?: Availability;
  className?: string;
}) {
  return (
    <div className={cn("relative shrink-0", className)} style={{ width: size, height: size }}>
      <div
        className="grid place-items-center overflow-hidden rounded-full border border-white/10 bg-ink-700 text-xs font-semibold text-slate-200"
        style={{ width: size, height: size }}
      >
        {src ? (
          <img src={src} alt={name} className="h-full w-full object-cover" />
        ) : (
          initials(name)
        )}
      </div>
      {status && (
        <span
          className={cn(
            "absolute -bottom-0.5 -right-0.5 rounded-full ring-2 ring-ink-950",
            dot[status],
          )}
          style={{ width: size * 0.28, height: size * 0.28 }}
        />
      )}
    </div>
  );
}
