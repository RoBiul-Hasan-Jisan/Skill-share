import { cn } from "@/lib/utils";

/** Compatibility gauge — reads like a grading mark, not a glowing dial. */
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
    value >= 90 ? "#55805F" : value >= 80 ? "#C8862E" : "#A66A22";
  return (
    <div className="relative grid place-items-center" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="-rotate-90">
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="rgba(255,255,255,0.1)" strokeWidth={5} />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          fill="none"
          stroke={stroke}
          strokeWidth={5}
          strokeLinecap="butt"
          strokeDasharray={c}
          strokeDashoffset={offset}
          style={{ transition: "stroke-dashoffset 1s cubic-bezier(.2,.8,.2,1)" }}
        />
      </svg>
      <div className="absolute text-center">
        <div className={cn("font-mono font-semibold leading-none", size > 50 ? "text-base" : "text-xs")}>
          {value}
        </div>
        {label && <div className="text-[9px] uppercase tracking-wider text-slate-500">{label}</div>}
      </div>
    </div>
  );
}
