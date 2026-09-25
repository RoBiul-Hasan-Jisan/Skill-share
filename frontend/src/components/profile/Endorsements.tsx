"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Award, Plus, X } from "lucide-react";
import { GlassCard } from "@/components/ui/GlassCard";
import { Button } from "@/components/ui/Button";
import { Avatar } from "@/components/ui/Avatar";
import { EmptyState } from "@/components/ui/EmptyState";
import { useToast } from "@/components/ui/Toast";
import { api } from "@/lib/api";
import type { Endorsement, Skill } from "@/types";

/** Self-contained: fetches its own endorsements for `userId` and, when
 *  `canEndorse` is true (viewer is connected to this profile and it isn't
 *  their own), lets them vouch for one of the listed skills. Drop into any
 *  profile page — it doesn't need anything from the parent besides these
 *  three props. */
export function Endorsements({
  userId, skills, canEndorse,
}: { userId: string; skills: Skill[]; canEndorse: boolean }) {
  const toast = useToast();
  const [endorsements, setEndorsements] = useState<Endorsement[] | null>(null);
  const [picking, setPicking] = useState(false);
  const [selectedSkill, setSelectedSkill] = useState("");
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    let live = true;
    api.listEndorsements(userId).then((e) => { if (live) setEndorsements(e); }).catch(() => setEndorsements([]));
    return () => { live = false; };
  }, [userId]);

  const grouped = (endorsements ?? []).reduce<Record<string, Endorsement[]>>((acc, e) => {
    (acc[e.skill] ??= []).push(e);
    return acc;
  }, {});
  const submit = async () => {
    if (!selectedSkill) return;
    setSubmitting(true);
    try {
      const created = await api.endorseSkill(userId, selectedSkill);
      setEndorsements((prev) => [created, ...(prev ?? [])]);
      toast(`Endorsed for ${selectedSkill}`);
      setPicking(false);
      setSelectedSkill("");
    } catch (err: any) {
      toast(err.message ?? "Couldn't endorse right now", "error");
    } finally {
      setSubmitting(false);
    }
  };

  if (endorsements === null) return null; // brief, avoids a layout-shifting skeleton for a below-the-fold card

  return (
    <GlassCard>
      <div className="flex items-center justify-between">
        <h3 className="flex items-center gap-2 font-display font-semibold text-white">
          <Award className="h-4 w-4 text-neon-cyan" /> Endorsements
        </h3>
        {canEndorse && skills.length > 0 && (
          <Button size="sm" variant="ghost" onClick={() => setPicking((v) => !v)}>
            {picking ? <X className="h-3.5 w-3.5" /> : <Plus className="h-3.5 w-3.5" />}
            {picking ? "Cancel" : "Endorse a skill"}
          </Button>
        )}
      </div>

      <AnimatePresence>
        {picking && (
          <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} exit={{ opacity: 0, height: 0 }} className="overflow-hidden">
            <div className="mt-3 flex flex-wrap items-center gap-2 rounded border border-white/10 bg-white/[0.02] p-3">
              <div className="flex flex-1 flex-wrap gap-1.5">
                {skills.map((s) => (
                  <button
                    key={s.name}
                    onClick={() => setSelectedSkill(s.name)}
                    className={`rounded-full border px-2.5 py-1 text-xs transition ${
                      selectedSkill === s.name
                        ? "border-neon-cyan/50 bg-neon-cyan/15 text-neon-cyan"
                        : "border-white/10 text-slate-400 hover:border-white/25 hover:text-slate-200"
                    }`}
                  >
                    {s.name}
                  </button>
                ))}
              </div>
              <Button size="sm" loading={submitting} disabled={!selectedSkill} onClick={submit}>Confirm</Button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="mt-4 space-y-4">
        {Object.keys(grouped).length === 0 ? (
          <EmptyState
  icon={Award}
  title="No endorsements yet"
  description="Endorsements from connections will show up here"
/>
        ) : (
          Object.entries(grouped).map(([skill, list]) => (
            <div key={skill}>
              <div className="mb-1.5 flex items-center gap-2">
                <span className="text-sm font-medium text-slate-200">{skill}</span>
                <span className="rounded-full border border-white/10 px-1.5 py-0.5 text-[10px] text-slate-500">{list.length}</span>
              </div>
              <div className="flex flex-wrap gap-2">
                {list.map((e) => (
                  <div key={e.id} title={e.from.name} className="flex items-center gap-1.5 rounded-full border border-white/10 bg-white/[0.02] py-0.5 pl-0.5 pr-2.5">
                    <Avatar src={e.from.avatar} name={e.from.name} size={20} />
                    <span className="text-xs text-slate-400">{e.from.name}</span>
                  </div>
                ))}
              </div>
            </div>
          ))
        )}
      </div>
    </GlassCard>
  );
}
