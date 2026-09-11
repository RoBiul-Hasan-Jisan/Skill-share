import { trustTier } from "@/lib/trust";
import { cn } from "@/lib/utils";

export function TrustMeter({
  score,
  size = 120,
  showTier = true,
}: {
  score: number;
  size?: number;
  showTier?: boolean;
}) {
  const tier = trustTier(score);
  const r = (size - 14) / 2;
  const c = 2 * Math.PI * r;
  const offset = c - (score / 100) * c;

  return (
    <div className="flex flex-col items-center gap-2">
      <div className="relative grid place-items-center" style={{ width: size, height: size }}>
        <svg width={size} height={size} className="-rotate-90">
          <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="rgba(255,255,255,0.07)" strokeWidth={9} />
          <circle
            cx={size / 2}
            cy={size / 2}
            r={r}
            fill="none"
            stroke={tier.color}
            strokeWidth={9}
            strokeLinecap="round"
            strokeDasharray={c}
            strokeDashoffset={offset}
            style={{
              transition: "stroke-dashoffset 1.1s cubic-bezier(.2,.8,.2,1)",
              filter: `drop-shadow(0 0 8px ${tier.color}aa)`,
            }}
          />
        </svg>
        <div className="absolute text-center">
          <div className="font-display text-3xl font-bold leading-none text-white">{score}</div>
          <div className="text-[10px] uppercase tracking-widest text-slate-500">Trust</div>
        </div>
      </div>
      {showTier && (
        <span
          className={cn(
            "inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-xs font-medium",
          )}
          style={{ borderColor: `${tier.color}55`, color: tier.color, background: `${tier.color}14` }}
        >
          <span>{tier.emoji}</span> {tier.label}
        </span>
      )}
    </div>
  );
}
