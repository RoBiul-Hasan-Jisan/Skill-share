"use client";

import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from "recharts";
import { Panel } from "@/design-system/Panel";
import { Badge } from "@/components/ui/Badge";
import { Skeleton } from "@/components/ui/Skeleton";

export function EngagementChart({ activity, loading }: { activity: any[] | null | undefined; loading: boolean }) {
  return (
    <Panel className="lg:col-span-2">
      <div className="mb-4 flex items-center justify-between">
        <div>
          <h3 className="font-display font-semibold text-white">Engagement</h3>
          <p className="text-xs text-slate-500">Messages sent & received · last 7 days</p>
        </div>
        <Badge tone="cyan">Live</Badge>
      </div>
      {loading || !activity ? (
        <Skeleton className="h-64 w-full" />
      ) : (
        <ResponsiveContainer width="100%" height={260}>
          <AreaChart data={activity} margin={{ left: -20, right: 8, top: 8 }}>
            <defs>
              <linearGradient id="gViews" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#C8862E" stopOpacity={0.5} />
                <stop offset="100%" stopColor="#C8862E" stopOpacity={0} />
              </linearGradient>
              <linearGradient id="gMatch" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#A8503D" stopOpacity={0.4} />
                <stop offset="100%" stopColor="#A8503D" stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid stroke="rgba(255,255,255,0.05)" vertical={false} />
            <XAxis dataKey="day" stroke="#64748b" fontSize={12} tickLine={false} axisLine={false} />
            <YAxis stroke="#64748b" fontSize={12} tickLine={false} axisLine={false} />
            <Tooltip contentStyle={{ background: "#191C21", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 4, color: "#fff" }} />
            <Area type="monotone" dataKey="views" name="Received" stroke="#C8862E" strokeWidth={2} fill="url(#gViews)" />
            <Area type="monotone" dataKey="matches" name="Sent" stroke="#A8503D" strokeWidth={2} fill="url(#gMatch)" />
          </AreaChart>
        </ResponsiveContainer>
      )}
    </Panel>
  );
}
