"use client";

import { useState, useRef, useEffect } from "react";
import Link from "next/link";
import { AnimatePresence, motion } from "framer-motion";
import { Plus, X, ChevronLeft, ChevronRight } from "lucide-react";
import { Panel } from "@/design-system/Panel";
import { Button } from "@/design-system/Button";
import { Badge } from "@/components/ui/Badge";
import { Avatar } from "@/components/ui/Avatar";
import { Skeleton } from "@/components/ui/Skeleton";
import { useAsync } from "@/hooks/useAsync";
import { api } from "@/lib/api";
import type { Task, Team } from "@/types";

const COLS = ["todo", "in_progress", "review", "done"] as const;
type Col = (typeof COLS)[number];

export function TaskBoard({ teams }: { teams: Team[] | null | undefined }) {
  const { data: rawTasks, loading: tLoading } = useAsync(api.tasks);
  const [tasks, setTasks] = useState<Task[] | null>(null);
  const [showTaskForm, setShowTaskForm] = useState(false);
  const [taskTitle, setTaskTitle] = useState("");
  const [taskPriority, setTaskPriority] = useState<"low" | "med" | "high">("med");
  const [savingTask, setSavingTask] = useState(false);
  const [movingTask, setMovingTask] = useState<string | null>(null);
  const taskInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => { if (rawTasks) setTasks(rawTasks); }, [rawTasks]);
  useEffect(() => { if (showTaskForm) taskInputRef.current?.focus(); }, [showTaskForm]);

  const hasTeam = teams && teams.length > 0;

  const moveTask = async (taskId: string, currentStatus: Col, dir: 1 | -1) => {
    const idx = COLS.indexOf(currentStatus);
    const nextIdx = idx + dir;
    if (nextIdx < 0 || nextIdx >= COLS.length) return;
    const nextStatus = COLS[nextIdx];
    setMovingTask(taskId);
    setTasks((prev) => prev?.map((t) => (t.id === taskId ? { ...t, status: nextStatus } : t)) ?? prev);
    try {
      await api.updateTask(taskId, { status: nextStatus });
    } catch {
      setTasks((prev) => prev?.map((t) => (t.id === taskId ? { ...t, status: currentStatus } : t)) ?? prev);
    } finally {
      setMovingTask(null);
    }
  };

  const handleAddTask = async () => {
    if (!taskTitle.trim()) return;
    const teamId = teams?.[0]?.id;
    if (!teamId) return;
    setSavingTask(true);
    try {
      const newTask = await api.createTask({ teamId, title: taskTitle.trim(), priority: taskPriority });
      setTasks((prev) => [...(prev ?? []), newTask]);
      setTaskTitle("");
      setShowTaskForm(false);
    } finally {
      setSavingTask(false);
    }
  };

  return (
    <Panel>
      <div className="mb-4 flex items-center justify-between">
        <div>
          <h3 className="font-display font-semibold text-white">{hasTeam ? `${teams![0].name} · Board` : "Team Board"}</h3>
          <p className="text-xs text-slate-500">
            {hasTeam
              ? `Shared with ${teams![0].members.length} teammate${teams![0].members.length !== 1 ? "s" : ""}`
              : "Join or create a team to see tasks"}
          </p>
        </div>
        {hasTeam ? (
          <Button variant="quiet" size="sm" onClick={() => setShowTaskForm((v) => !v)}>
            {showTaskForm ? <X className="h-3.5 w-3.5" /> : <Plus className="h-3.5 w-3.5" />}
            {showTaskForm ? "Cancel" : "Task"}
          </Button>
        ) : (
          <Link href="/teams"><Button variant="quiet" size="sm"><Plus className="h-3.5 w-3.5" /> Create team</Button></Link>
        )}
      </div>

      <AnimatePresence>
        {showTaskForm && (
          <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} exit={{ opacity: 0, height: 0 }} className="mb-4 overflow-hidden">
            <div className="flex flex-wrap items-center gap-2 rounded border border-white/10 bg-white/[0.02] p-3">
              <input
                ref={taskInputRef}
                value={taskTitle}
                onChange={(e) => setTaskTitle(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleAddTask()}
                placeholder="Task title…"
                className="min-w-0 flex-1 bg-transparent text-sm text-white outline-none placeholder:text-slate-500"
              />
              <div className="flex items-center gap-2">
                <select
                  value={taskPriority}
                  onChange={(e) => setTaskPriority(e.target.value as "low" | "med" | "high")}
                  className="rounded border border-white/10 bg-ink-800 px-2 py-1 text-xs text-slate-300 outline-none"
                >
                  <option value="low">Low</option>
                  <option value="med">Med</option>
                  <option value="high">High</option>
                </select>
                <Button size="sm" loading={savingTask} onClick={handleAddTask}>Add</Button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
        {COLS.map((col) => {
          const colIdx = COLS.indexOf(col);
          return (
            <div key={col} className="rounded bg-white/[0.02] p-3">
              <p className="mb-3 text-xs font-medium uppercase tracking-wider text-slate-500">{col.replace("_", " ")}</p>
              <div className="space-y-2">
                {tLoading || !tasks
                  ? Array.from({ length: 2 }).map((_, i) => <Skeleton key={i} className="h-14 w-full" />)
                  : tasks.filter((t) => t.status === col).map((t) => (
                      <div key={t.id} className="rounded border border-white/10 bg-ink-800/60 p-2.5">
                        <p className="text-sm leading-snug text-slate-200">{t.title}</p>
                        <div className="mt-2 flex items-center gap-1">
                          <Badge tone={t.priority === "high" ? "magenta" : t.priority === "med" ? "cyan" : "default"}>{t.priority}</Badge>
                          {t.assignee && <Avatar src={t.assignee.avatar} name={t.assignee.name} size={20} />}
                          <div className="ml-auto flex items-center gap-0.5">
                            {colIdx > 0 && (
                              <button disabled={movingTask === t.id} onClick={() => moveTask(t.id, col, -1)} title="Move back" className="rounded p-0.5 text-slate-500 hover:bg-white/10 hover:text-slate-200 disabled:opacity-40">
                                <ChevronLeft className="h-3.5 w-3.5" />
                              </button>
                            )}
                            {colIdx < COLS.length - 1 && (
                              <button disabled={movingTask === t.id} onClick={() => moveTask(t.id, col, 1)} title={`Move to ${COLS[colIdx + 1].replace("_", " ")}`} className="rounded p-0.5 text-neon-cyan hover:bg-neon-cyan/10 disabled:opacity-40">
                                <ChevronRight className="h-3.5 w-3.5" />
                              </button>
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
                {!tLoading && tasks?.filter((t) => t.status === col).length === 0 && (
                  <p className="py-2 text-center text-[11px] text-slate-600">Empty</p>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </Panel>
  );
}
