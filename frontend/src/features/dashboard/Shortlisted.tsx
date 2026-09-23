"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { BookmarkCheck, Briefcase } from "lucide-react";
import { Panel } from "@/design-system/Panel";
import { Avatar } from "@/components/ui/Avatar";
import { Skeleton } from "@/components/ui/Skeleton";
import { api } from "@/lib/api";
import type { DevUser } from "@/types";

/** Self-contained: reads the recruiter shortlist from localStorage and
 *  resolves the users itself, so the dashboard orchestrator doesn't need
 *  to know this feature exists. */
export function Shortlisted() {
  const router = useRouter();
  const [shortlisted, setShortlisted] = useState<DevUser[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const ids: string[] = JSON.parse(localStorage.getItem("recruiter_shortlist") ?? "[]");
    if (ids.length === 0) return;
    setLoading(true);
    Promise.all(ids.map((id) => api.user(id)))
      .then((users) => setShortlisted(users.filter((u) => !!u) as DevUser[]))
      .finally(() => setLoading(false));
  }, []);

  if (!loading && shortlisted.length === 0) return null;

  return (
    <Panel>
      <div className="mb-4 flex items-center justify-between">
        <div>
          <h3 className="flex items-center gap-2 font-display font-semibold text-white">
            <BookmarkCheck className="h-4 w-4 text-neon-cyan" /> Shortlisted
          </h3>
          <p className="text-xs text-slate-500">Developers you saved from Recruiter</p>
        </div>
        <button onClick={() => router.push("/recruiter")} className="flex items-center gap-1.5 text-xs text-neon-cyan hover:underline">
          <Briefcase className="h-3.5 w-3.5" /> Manage
        </button>
      </div>
      <div className="flex gap-3 overflow-x-auto pb-1">
        {loading
          ? Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-24 w-36 shrink-0" />)
          : shortlisted.map((u) => (
              <button
                key={u.id}
                onClick={() => router.push(`/profile/${u.id}`)}
                className="flex w-36 shrink-0 flex-col items-center gap-2 rounded border border-white/10 bg-white/[0.02] p-3 text-center transition hover:border-neon-cyan/30 hover:bg-neon-cyan/[0.04]"
              >
                <Avatar src={u.avatar} name={u.name} status={u.availability} size={44} />
                <div className="w-full min-w-0">
                  <p className="truncate text-sm font-medium text-white">{u.name}</p>
                  <p className="truncate text-[11px] text-slate-500">{u.role || "Developer"}</p>
                  <span className="mt-1 inline-block rounded-full border border-white/10 px-2 py-0.5 text-[10px] text-slate-400">
                    {u.trustScore} trust
                  </span>
                </div>
              </button>
            ))}
      </div>
    </Panel>
  );
}
