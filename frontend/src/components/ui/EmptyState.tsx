import type { ReactNode } from "react";
import { Inbox } from "lucide-react";

export function EmptyState({
  icon = <Inbox className="h-6 w-6" />,
  title,
  description,
  action,
}: {
  icon?: ReactNode;
  title: string;
  description?: string;
  action?: ReactNode;
}) {
  return (
    <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-white/10 py-16 text-center">
      <div className="mb-4 grid h-14 w-14 place-items-center rounded-2xl border border-white/10 bg-white/[0.03] text-neon-cyan">
        {icon}
      </div>
      <h3 className="font-display text-lg font-semibold text-white">{title}</h3>
      {description && (
        <p className="mt-1 max-w-sm text-sm text-slate-400">{description}</p>
      )}
      {action && <div className="mt-5">{action}</div>}
    </div>
  );
}
