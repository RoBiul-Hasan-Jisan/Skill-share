import { cn } from "@/lib/utils";

/** Circular compatibility gauge. */
export function ScoreRing({
  value,
  size = 60,
  label,
}: {
  value: number;
  size?: number;
  label?: string;
}) {
  const r = (size - 8) / 2;
  const c = 2 * Math.PI * r;
  const offset = c - (value / 100) * c;
  const stroke =
    value >= 90 ? "#10b981" : value >= 80 ? "#3b82f6" : "#6366f1";
  return (
    <div className="relative grid place-items-center" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="-rotate-90">
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="rgba(255,255,255,0.08)" strokeWidth={6} />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          fill="none"
          stroke={stroke}
          strokeWidth={6}
          strokeLinecap="round"
          strokeDasharray={c}
          strokeDashoffset={offset}
          style={{ transition: "stroke-dashoffset 1s cubic-bezier(.2,.8,.2,1)", filter: `drop-shadow(0 0 6px ${stroke}88)` }}
        />
      </svg>
      <div className="absolute text-center">
        <div className={cn("font-display font-bold leading-none", size > 50 ? "text-base" : "text-xs")}>
          {value}
        </div>
        {label && <div className="text-[9px] uppercase tracking-wider text-slate-500">{label}</div>}
      </div>
    </div>
  );
}
