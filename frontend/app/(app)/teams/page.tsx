"use client";

import { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useRouter } from "next/navigation";
import {
  Plus, Users, Layers, MessageSquare, X, Check, Settings,
  Trash2, ArrowLeft, MoreHorizontal, Kanban, AlertCircle,
  Crown, ChevronLeft, ChevronRight, UserMinus, CalendarClock, Filter,
} from "lucide-react";
import { GlassCard } from "@/components/ui/GlassCard";
import { Badge } from "@/components/ui/Badge";
import { Avatar } from "@/components/ui/Avatar";
import { Button } from "@/components/ui/Button";
import { Skeleton } from "@/components/ui/Skeleton";
import { useAsync } from "@/hooks/useAsync";
import { api } from "@/lib/api";
import { useToast } from "@/components/ui/Toast";
import { useAuth } from "@/context/AuthContext";
import { cn } from "@/lib/utils";
import type { Team, Task } from "@/types";

/* ─── Constants ─────────────────────────────────────────────────── */
const stageTone = { idea: "magenta", building: "cyan", launched: "lime" } as const;

const TECH_STACK = [
  "React","Next.js","Vue","TypeScript","Node.js","Python","Go","Rust",
  "PostgreSQL","MongoDB","Docker","AWS","Firebase","TailwindCSS","GraphQL","Solidity",
];
const ROLES = [
  "Frontend Dev","Backend Dev","Full-Stack Dev","Mobile Dev",
  "UI/UX Designer","DevOps","Data Scientist","Product Manager",
];

const COLUMNS = [
  { id: "todo",        label: "To Do",       accent: "text-white/50",    dot: "bg-white/25",       header: "border-white/[0.06]"  },
  { id: "in_progress", label: "In Progress", accent: "text-[#C8862E]",   dot: "bg-[#C8862E]",      header: "border-[#C8862E]/20"  },
  { id: "review",      label: "Review",      accent: "text-[#A66A22]",   dot: "bg-[#A66A22]",      header: "border-[#A66A22]/20"  },
  { id: "done",        label: "Done",        accent: "text-white/25",    dot: "bg-white/15",       header: "border-white/[0.04]"  },
] as const;

type ColId = (typeof COLUMNS)[number]["id"];

const PRIORITY = {
  high: { label: "P1", cls: "text-[#C8862E]/80 bg-[#C8862E]/[0.07] border border-[#C8862E]/20" },
  med:  { label: "P2", cls: "text-[#A66A22]/70 bg-[#A66A22]/[0.07] border border-[#A66A22]/20" },
  low:  { label: "P3", cls: "text-white/20 bg-white/[0.04] border border-white/[0.07]" },
} as const;

/** Due-date urgency — overdue (red), due within 2 days (amber), otherwise neutral. */
function dueUrgency(dueDate?: string): { label: string; cls: string } | null {
  if (!dueDate) return null;
  const d = new Date(dueDate);
  const now = new Date();
  const days = Math.ceil((d.getTime() - now.setHours(0, 0, 0, 0)) / 86_400_000);
  const fmt = d.toLocaleDateString(undefined, { month: "short", day: "numeric" });
  if (days < 0) return { label: `Overdue · ${fmt}`, cls: "text-red-400/90 bg-red-500/[0.08] border-red-500/25" };
  if (days === 0) return { label: "Due today", cls: "text-amber-400/90 bg-amber-500/[0.08] border-amber-500/25" };
  if (days <= 2) return { label: `Due in ${days}d`, cls: "text-amber-400/80 bg-amber-500/[0.06] border-amber-500/20" };
  return { label: fmt, cls: "text-white/30 bg-white/[0.03] border-white/[0.08]" };
}

/* ─── Task card ─────────────────────────────────────────────────── */
function TaskCard({
  task, onMove, onDelete, moving,
}: {
  task: Task;
  onMove: (id: string, status: ColId) => void;
  onDelete: (id: string) => void;
  moving: boolean;
}) {
  const [menuOpen, setMenuOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function close(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setMenuOpen(false);
    }
    document.addEventListener("mousedown", close);
    return () => document.removeEventListener("mousedown", close);
  }, []);

  const priority = PRIORITY[(task.priority as keyof typeof PRIORITY) ?? "med"];
  const colIdx = COLUMNS.findIndex((c) => c.id === task.status);
  const prevCol = colIdx > 0 ? COLUMNS[colIdx - 1] : null;
  const nextCol = colIdx < COLUMNS.length - 1 ? COLUMNS[colIdx + 1] : null;
  const otherCols = COLUMNS.filter((c) => c.id !== task.status);

  return (
    <div
      ref={ref}
      className={cn(
        "relative rounded-xl border border-white/[0.06] bg-white/[0.025] p-3 group transition-all duration-150",
        "hover:border-white/[0.1] hover:bg-white/[0.04]",
        moving && "opacity-50 pointer-events-none",
      )}
    >
      <div className="flex items-start justify-between gap-2">
        <p className="text-[13px] leading-snug text-white/75 flex-1">{task.title}</p>
        <button
          onClick={() => setMenuOpen((o) => !o)}
          className="shrink-0 grid h-5 w-5 place-items-center rounded text-white/15 hover:text-white/50 hover:bg-white/[0.06] transition opacity-0 group-hover:opacity-100"
        >
          <MoreHorizontal className="h-3.5 w-3.5" />
        </button>
      </div>

      <div className="mt-2.5 flex items-center gap-1 flex-wrap">
        <span className={cn("rounded-md px-1.5 py-0.5 text-[10px] font-bold", priority.cls)}>
          {priority.label}
        </span>
        {(() => {
          const due = dueUrgency(task.dueDate);
          return due ? (
            <span className={cn("flex items-center gap-1 rounded-md border px-1.5 py-0.5 text-[10px] font-medium", due.cls)}>
              <CalendarClock className="h-2.5 w-2.5" /> {due.label}
            </span>
          ) : null;
        })()}
        {/* Status navigation arrows */}
        <div className="flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition ml-1">
          <button
            disabled={!prevCol}
            onClick={() => prevCol && onMove(task.id, prevCol.id as ColId)}
            className="grid h-4 w-4 place-items-center rounded text-white/20 hover:text-white/60 hover:bg-white/[0.06] transition disabled:opacity-20 disabled:cursor-not-allowed"
            title={prevCol ? `Move to ${prevCol.label}` : "Already first"}
          >
            <ChevronLeft className="h-3 w-3" />
          </button>
          <button
            disabled={!nextCol}
            onClick={() => nextCol && onMove(task.id, nextCol.id as ColId)}
            className="grid h-4 w-4 place-items-center rounded text-white/20 hover:text-white/60 hover:bg-white/[0.06] transition disabled:opacity-20 disabled:cursor-not-allowed"
            title={nextCol ? `Move to ${nextCol.label}` : "Already last"}
          >
            <ChevronRight className="h-3 w-3" />
          </button>
        </div>
        {task.assignee && (
          <div className="ml-auto flex items-center gap-1.5">
            <div className="h-5 w-5 rounded-full bg-neon-cyan/[0.12] border border-neon-cyan/25 grid place-items-center">
              <span className="text-[9px] font-bold text-neon-cyan/80">
                {task.assignee.name.charAt(0).toUpperCase()}
              </span>
            </div>
            <span className="text-[10px] text-white/25 truncate max-w-[72px]">
              {task.assignee.name.split(" ")[0]}
            </span>
          </div>
        )}
      </div>

      {/* Context menu */}
      <AnimatePresence>
        {menuOpen && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: -4 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: -4 }}
            transition={{ duration: 0.12 }}
            className="absolute right-0 top-8 z-30 w-44 rounded-xl border border-white/[0.08] bg-[#14161A] shadow-[0_8px_32px_rgba(0,0,0,0.8)] p-1.5"
          >
            <p className="px-2 py-1 text-[10px] font-semibold uppercase tracking-wider text-white/20">
              Move to
            </p>
            {otherCols.map((col) => (
              <button
                key={col.id}
                onClick={() => { onMove(task.id, col.id); setMenuOpen(false); }}
                className="flex w-full items-center gap-2 rounded-lg px-2 py-1.5 text-xs text-white/50 hover:bg-white/[0.05] hover:text-white transition"
              >
                <span className={cn("h-1.5 w-1.5 rounded-full shrink-0", col.dot)} />
                {col.label}
              </button>
            ))}
            <div className="my-1 h-px bg-white/[0.05]" />
            <button
              onClick={() => { onDelete(task.id); setMenuOpen(false); }}
              className="flex w-full items-center gap-2 rounded-lg px-2 py-1.5 text-xs text-red-400/60 hover:bg-red-500/[0.07] hover:text-red-400 transition"
            >
              <Trash2 className="h-3 w-3" />
              Delete task
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

/* ─── Main component ─────────────────────────────────────────────── */
export default function Teams() {
  const { data: myTeams, loading, setData: setMyTeams } = useAsync(api.teams);
  const { data: allTeams, loading: allLoading, setData: setAllTeams } = useAsync(api.allTeams);
  const { user } = useAuth();
  const toast = useToast();
  const navigate = useRouter();

  const [tab, setTab] = useState<"mine" | "discover">("mine");
  const [showCreate, setShowCreate] = useState(false);
  const [creating, setCreating] = useState(false);
  const [joining, setJoining] = useState<string | null>(null);

  /* Board state */
  const [boardTeam, setBoardTeam] = useState<Team | null>(null);
  const [boardTasks, setBoardTasks] = useState<Task[]>([]);
  const [loadingTasks, setLoadingTasks] = useState(false);
  const [movingTask, setMovingTask] = useState<string | null>(null);

  /* Create task */
  const [showCreateTask, setShowCreateTask] = useState<ColId | null>(null);
  const [taskTitle, setTaskTitle] = useState("");
  const [taskPriority, setTaskPriority] = useState<"low" | "med" | "high">("med");
  const [taskAssigneeId, setTaskAssigneeId] = useState("");
  const [taskDueDate, setTaskDueDate] = useState("");
  const [creatingTask, setCreatingTask] = useState(false);

  /* Board filters */
  const [filterAssignee, setFilterAssignee] = useState<string | null>(null);

  /* Settings / delete */
  const [showSettings, setShowSettings] = useState<Team | null>(null);
  const [deleteConfirm, setDeleteConfirm] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [removingMember, setRemovingMember] = useState<string | null>(null);

  /* Create team form */
  const [name, setName] = useState("");
  const [tagline, setTagline] = useState("");
  const [stack, setStack] = useState<string[]>([]);
  const [openRoles, setOpenRoles] = useState<string[]>([]);
  const [stage, setStage] = useState<"idea" | "building" | "launched">("idea");

  /* ── Team create ── */
  const createTeam = async () => {
    if (!name.trim()) { toast("Team name is required", "error"); return; }
    const all = [...(myTeams ?? []), ...(allTeams ?? [])];
    if (all.some((t) => t.name.toLowerCase() === name.trim().toLowerCase())) {
      toast("A team with this name already exists", "error"); return;
    }
    setCreating(true);
    try {
      const team = await api.createTeam({ name: name.trim(), tagline: tagline.trim(), stack, openRoles, stage });
      setMyTeams((prev) => [team, ...(prev ?? [])]);
      setShowCreate(false);
      setName(""); setTagline(""); setStack([]); setOpenRoles([]); setStage("idea");
      toast(`Team "${team.name}" created!`);
    } catch (err: any) {
      toast(err.message ?? "Failed to create team", "error");
    } finally { setCreating(false); }
  };

  /* ── Join team ── */
  const joinTeam = async (teamId: string) => {
    setJoining(teamId);
    try {
      const team = await api.joinTeam(teamId);
      setMyTeams((prev) => [team, ...(prev ?? [])]);
      setAllTeams((prev) => (prev ?? []).filter((t) => t.id !== teamId));
      toast(`Joined ${team.name}!`);
      setTab("mine");
    } catch (err: any) {
      toast(err.message ?? "Failed to join team", "error");
    } finally { setJoining(null); }
  };

  /* ── Team chat ── */
  const openTeamChat = async (team: Team) => {
    if (team.conversationId) {
      navigate.push(`/chat?roomId=${team.conversationId}`); return;
    }
    try {
      const joined = await api.joinTeam(team.id);
      navigate.push(`/chat?roomId=${joined.conversationId}`);
    } catch { navigate.push("/chat"); }
  };

  /* ── Delete team ── */
  const doDeleteTeam = async () => {
    if (!showSettings) return;
    setDeleting(true);
    try {
      await api.deleteTeam(showSettings.id);
      setMyTeams((prev) => (prev ?? []).filter((t) => t.id !== showSettings.id));
      if (boardTeam?.id === showSettings.id) setBoardTeam(null);
      setShowSettings(null);
      setDeleteConfirm(false);
      toast("Team deleted");
    } catch (err: any) {
      toast(err.message ?? "Failed to delete", "error");
    } finally { setDeleting(false); }
  };

  /* ── Open board ── */
  const openBoard = async (team: Team) => {
    setBoardTeam(team);
    setBoardTasks([]);
    setFilterAssignee(null);
    setLoadingTasks(true);
    try {
      const tasks = await api.teamTasks(team.id);
      setBoardTasks(tasks);
    } catch { setBoardTasks([]); }
    finally { setLoadingTasks(false); }
  };

  /* ── Delete task ── */
  const deleteTask = async (taskId: string) => {
    try {
      await api.deleteTask(taskId);
      setBoardTasks((prev) => prev.filter((t) => t.id !== taskId));
    } catch { toast("Failed to delete task", "error"); }
  };

  /* ── Remove member ── */
  const doRemoveMember = async (memberId: string) => {
    if (!showSettings) return;
    setRemovingMember(memberId);
    try {
      const updated = await api.removeMember(showSettings.id, memberId);
      setShowSettings(updated);
      setMyTeams((prev) => (prev ?? []).map((t) => t.id === updated.id ? updated : t));
      toast("Member removed");
    } catch (err: any) {
      toast(err.message ?? "Failed to remove member", "error");
    } finally { setRemovingMember(null); }
  };

  /* ── Move task ── */
  const moveTask = async (taskId: string, newStatus: ColId) => {
    setMovingTask(taskId);
    try {
      const updated = await api.updateTask(taskId, { status: newStatus } as any);
      setBoardTasks((prev) => prev.map((t) => (t.id === taskId ? updated : t)));
    } catch { toast("Failed to move task", "error"); }
    finally { setMovingTask(null); }
  };

  /* ── Create task ── */
  const createTask = async () => {
    if (!boardTeam || !taskTitle.trim()) return;
    setCreatingTask(true);
    try {
      const task = await api.createTask({
        teamId: boardTeam.id,
        title: taskTitle.trim(),
        priority: taskPriority,
        assigneeId: taskAssigneeId || undefined,
        status: showCreateTask ?? "todo",
        dueDate: taskDueDate || undefined,
      });
      setBoardTasks((prev) => [...prev, task]);
      setShowCreateTask(null);
      setTaskTitle("");
      setTaskPriority("med");
      setTaskAssigneeId("");
      setTaskDueDate("");
    } catch (err: any) {
      toast(err.message ?? "Failed to create task", "error");
    } finally { setCreatingTask(false); }
  };

  const isMyTeam = (team: Team) => team.members.some((m) => m.id === user?.id);
  const isOwner = (team: Team) => team.ownerId === user?.id;
  const discoverTeams = (allTeams ?? []).filter((t) => !isMyTeam(t));

  /* ════════════════════════════════════════════════════════════════ */
  /* BOARD VIEW                                                      */
  /* ════════════════════════════════════════════════════════════════ */
  if (boardTeam) {
    return (
      <div className="space-y-5">
        {/* Board header */}
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <button
              onClick={() => setBoardTeam(null)}
              className="flex items-center gap-1.5 rounded-xl border border-white/[0.07] bg-white/[0.03] px-3 py-2 text-sm text-white/50 transition hover:text-white hover:border-white/[0.12]"
            >
              <ArrowLeft className="h-3.5 w-3.5" /> Teams
            </button>
            <div className="h-4 w-px bg-white/[0.07]" />
            <div>
              <h1 className="font-display text-xl font-bold text-white">{boardTeam.name}</h1>
              {boardTeam.tagline && (
                <p className="text-xs text-white/30">{boardTeam.tagline}</p>
              )}
            </div>
          </div>
          <Button size="sm" onClick={() => setShowCreateTask("todo")}>
            <Plus className="h-3.5 w-3.5" /> New Task
          </Button>
        </div>

        {/* Assignee filter */}
        {boardTeam.members.length > 1 && (
          <div className="flex flex-wrap items-center gap-1.5">
            <Filter className="h-3.5 w-3.5 text-white/20" />
            <button
              onClick={() => setFilterAssignee(null)}
              className={cn(
                "rounded-lg border px-2.5 py-1 text-[11px] transition",
                filterAssignee === null ? "border-neon-cyan/30 bg-neon-cyan/[0.08] text-neon-cyan" : "border-white/[0.07] text-white/35 hover:text-white/60",
              )}
            >
              Everyone
            </button>
            {boardTeam.members.map((m) => (
              <button
                key={m.id}
                onClick={() => setFilterAssignee((cur) => (cur === m.id ? null : m.id))}
                className={cn(
                  "flex items-center gap-1.5 rounded-lg border pl-1 pr-2.5 py-1 text-[11px] transition",
                  filterAssignee === m.id ? "border-neon-cyan/30 bg-neon-cyan/[0.08] text-neon-cyan" : "border-white/[0.07] text-white/35 hover:text-white/60",
                )}
              >
                <Avatar src={m.avatar} name={m.name} size={16} /> {m.name.split(" ")[0]}
              </button>
            ))}
          </div>
        )}

        {/* Kanban columns */}
        {loadingTasks ? (
          <div className="flex gap-3 overflow-x-auto pb-4">
            {COLUMNS.map((c) => (
              <div key={c.id} className="w-72 flex-none rounded-xl border border-white/[0.06] bg-white/[0.02] p-3">
                <Skeleton className="h-4 w-20 mb-3" />
                <div className="space-y-2">
                  <Skeleton className="h-16 w-full" />
                  <Skeleton className="h-16 w-full" />
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="flex gap-3 overflow-x-auto pb-4">
            {COLUMNS.map((col) => {
              const colTasks = boardTasks
                .filter((t) => t.status === col.id)
                .filter((t) => !filterAssignee || t.assignee?.id === filterAssignee);
              return (
                <div
                  key={col.id}
                  className={cn(
                    "w-72 flex-none rounded-xl border bg-white/[0.018] p-3",
                    col.header,
                  )}
                >
                  {/* Column header */}
                  <div className="mb-3 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className={cn("h-2 w-2 rounded-full", col.dot)} />
                      <span className={cn("text-xs font-semibold", col.accent)}>{col.label}</span>
                      <span className="rounded-md bg-white/[0.05] px-1.5 text-[10px] text-white/25">
                        {colTasks.length}
                      </span>
                    </div>
                    <button
                      onClick={() => setShowCreateTask(col.id as ColId)}
                      className="grid h-5 w-5 place-items-center rounded text-white/15 hover:text-white/50 hover:bg-white/[0.06] transition"
                    >
                      <Plus className="h-3.5 w-3.5" />
                    </button>
                  </div>

                  {/* Tasks */}
                  <div className="space-y-2 min-h-[60px]">
                    {colTasks.length === 0 && (
                      <div className="rounded-xl border border-dashed border-white/[0.05] py-6 text-center">
                        <p className="text-[11px] text-white/15">No tasks</p>
                      </div>
                    )}
                    {colTasks.map((task) => (
                      <TaskCard
                        key={task.id}
                        task={task}
                        onMove={moveTask}
                        onDelete={deleteTask}
                        moving={movingTask === task.id}
                      />
                    ))}
                  </div>

                  {/* Add quick task */}
                  <button
                    onClick={() => setShowCreateTask(col.id as ColId)}
                    className="mt-2 flex w-full items-center gap-1.5 rounded-lg px-2 py-2 text-[11px] text-white/15 hover:text-white/40 hover:bg-white/[0.03] transition"
                  >
                    <Plus className="h-3 w-3" /> Add task
                  </button>
                </div>
              );
            })}
          </div>
        )}

        {/* Create task modal */}
        <AnimatePresence>
          {showCreateTask && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4"
              onClick={(e) => e.target === e.currentTarget && setShowCreateTask(null)}
            >
              <motion.div
                initial={{ scale: 0.96, opacity: 0, y: 8 }}
                animate={{ scale: 1, opacity: 1, y: 0 }}
                exit={{ scale: 0.96, opacity: 0, y: 8 }}
                transition={{ duration: 0.18, ease: [0.2, 0.8, 0.2, 1] }}
                className="w-full max-w-md"
              >
                <GlassCard className="space-y-5">
                  <div className="flex items-center justify-between">
                    <div>
                      <h2 className="font-display text-lg font-bold text-white">New Task</h2>
                      <p className="text-xs text-white/30 mt-0.5">
                        Adding to: <span className="text-white/50">{COLUMNS.find((c) => c.id === showCreateTask)?.label}</span>
                      </p>
                    </div>
                    <button onClick={() => setShowCreateTask(null)} className="text-white/30 hover:text-white transition">
                      <X className="h-5 w-5" />
                    </button>
                  </div>

                  <div className="space-y-3">
                    <input
                      autoFocus
                      value={taskTitle}
                      onChange={(e) => setTaskTitle(e.target.value)}
                      onKeyDown={(e) => e.key === "Enter" && !creatingTask && taskTitle.trim() && createTask()}
                      placeholder="Task title…"
                      className="w-full rounded-xl border border-white/[0.08] bg-white/[0.03] px-3.5 py-2.5 text-sm text-white outline-none placeholder:text-white/20 focus:border-neon-cyan/30 focus:bg-white/[0.04] transition"
                    />

                    <div className="flex gap-2">
                      {/* Priority */}
                      <div className="flex-1">
                        <label className="mb-1.5 block text-[11px] text-white/30">Priority</label>
                        <div className="flex gap-1.5">
                          {(["high","med","low"] as const).map((p) => (
                            <button
                              key={p}
                              onClick={() => setTaskPriority(p)}
                              className={cn(
                                "flex-1 rounded-lg py-1.5 text-[11px] font-bold transition border",
                                taskPriority === p
                                  ? PRIORITY[p].cls
                                  : "border-white/[0.06] text-white/20 hover:text-white/40",
                              )}
                            >
                              {PRIORITY[p].label}
                            </button>
                          ))}
                        </div>
                      </div>

                      {/* Assignee */}
                      <div className="flex-1">
                        <label className="mb-1.5 block text-[11px] text-white/30">Assignee</label>
                        <select
                          value={taskAssigneeId}
                          onChange={(e) => setTaskAssigneeId(e.target.value)}
                          className="w-full rounded-xl border border-white/[0.08] bg-[#14161A] px-2.5 py-1.5 text-xs text-white/70 outline-none focus:border-neon-cyan/30 transition"
                        >
                          <option value="">Unassigned</option>
                          {boardTeam.members.map((m) => (
                            <option key={m.id} value={m.id}>{m.name}</option>
                          ))}
                        </select>
                      </div>
                    </div>

                    <div>
                      <label className="mb-1.5 flex items-center gap-1.5 text-[11px] text-white/30">
                        <CalendarClock className="h-3 w-3" /> Due date <span className="text-white/15">(optional)</span>
                      </label>
                      <input
                        type="date"
                        value={taskDueDate}
                        onChange={(e) => setTaskDueDate(e.target.value)}
                        className="w-full rounded-xl border border-white/[0.08] bg-white/[0.03] px-3.5 py-2 text-sm text-white/80 outline-none focus:border-neon-cyan/30 transition [color-scheme:dark]"
                      />
                    </div>
                  </div>

                  <div className="flex gap-2 pt-1">
                    <Button className="flex-1" loading={creatingTask} onClick={createTask} disabled={!taskTitle.trim()}>
                      <Check className="h-3.5 w-3.5" /> Create task
                    </Button>
                    <Button variant="ghost" onClick={() => setShowCreateTask(null)}>Cancel</Button>
                  </div>
                </GlassCard>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    );
  }

  /* ════════════════════════════════════════════════════════════════ */
  /* TEAMS LIST VIEW                                                 */
  /* ════════════════════════════════════════════════════════════════ */
  return (
    <div className="space-y-6">
      <header className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="font-display text-2xl font-bold text-white">Teams</h1>
          <p className="text-sm text-white/30">Your workspaces and open teams to join.</p>
        </div>
        <Button size="sm" onClick={() => setShowCreate(true)}>
          <Plus className="h-4 w-4" /> New team
        </Button>
      </header>

      {/* Tabs */}
      <div className="flex gap-1 rounded-xl border border-white/[0.07] bg-white/[0.02] p-1 w-fit">
        {(["mine", "discover"] as const).map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={cn(
              "relative rounded-lg px-4 py-2 text-sm font-medium transition",
              tab === t ? "text-white" : "text-white/35 hover:text-white/60",
            )}
          >
            {tab === t && (
              <motion.span layoutId="team-tab" className="absolute inset-0 rounded-lg bg-white/[0.07]" />
            )}
            <span className="relative">{t === "mine" ? "My Teams" : "Discover"}</span>
          </button>
        ))}
      </div>

      {/* ── Create team modal ── */}
      <AnimatePresence>
        {showCreate && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4"
            onClick={(e) => e.target === e.currentTarget && setShowCreate(false)}
          >
            <motion.div
              initial={{ scale: 0.96, opacity: 0, y: 8 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.96, opacity: 0, y: 8 }}
              transition={{ duration: 0.18, ease: [0.2, 0.8, 0.2, 1] }}
              className="w-full max-w-lg max-h-[90vh] overflow-y-auto"
            >
              <GlassCard className="space-y-5">
                <div className="flex items-center justify-between">
                  <h2 className="font-display text-xl font-bold text-white">Create a Team</h2>
                  <button onClick={() => setShowCreate(false)} className="text-white/30 hover:text-white transition">
                    <X className="h-5 w-5" />
                  </button>
                </div>
                <div className="space-y-4">
                  <div>
                    <label className="mb-1.5 block text-sm font-medium text-white/60">Team name *</label>
                    <input
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      placeholder="e.g. SkillShare Alpha"
                      className="w-full rounded-xl border border-white/[0.08] bg-white/[0.03] px-3.5 py-2.5 text-sm text-white outline-none placeholder:text-white/20 focus:border-neon-cyan/30 transition"
                    />
                  </div>
                  <div>
                    <label className="mb-1.5 block text-sm font-medium text-white/60">Tagline</label>
                    <input
                      value={tagline}
                      onChange={(e) => setTagline(e.target.value)}
                      placeholder="What are you building?"
                      className="w-full rounded-xl border border-white/[0.08] bg-white/[0.03] px-3.5 py-2.5 text-sm text-white outline-none placeholder:text-white/20 focus:border-neon-cyan/30 transition"
                    />
                  </div>
                  <div>
                    <label className="mb-1.5 block text-sm font-medium text-white/60">Stage</label>
                    <div className="flex gap-2">
                      {(["idea","building","launched"] as const).map((s) => (
                        <button
                          key={s}
                          onClick={() => setStage(s)}
                          className={cn(
                            "flex-1 rounded-xl border py-2 text-xs font-medium capitalize transition",
                            stage === s
                              ? "border-neon-cyan/30 bg-neon-cyan/[0.07] text-neon-cyan"
                              : "border-white/[0.07] text-white/30 hover:text-white/60",
                          )}
                        >
                          {s}
                        </button>
                      ))}
                    </div>
                  </div>
                  <div>
                    <label className="mb-1.5 block text-sm font-medium text-white/60">Tech stack</label>
                    <div className="flex flex-wrap gap-1.5">
                      {TECH_STACK.map((t) => (
                        <button
                          key={t}
                          onClick={() => setStack((s) => s.includes(t) ? s.filter((x) => x !== t) : [...s, t])}
                          className={cn(
                            "rounded-lg border px-2.5 py-1 text-xs transition",
                            stack.includes(t)
                              ? "border-neon-cyan/30 bg-neon-cyan/[0.07] text-neon-cyan"
                              : "border-white/[0.07] text-white/35 hover:text-white/60",
                          )}
                        >
                          {t}
                        </button>
                      ))}
                    </div>
                  </div>
                  <div>
                    <label className="mb-1.5 block text-sm font-medium text-white/60">Open roles</label>
                    <div className="flex flex-wrap gap-1.5">
                      {ROLES.map((r) => (
                        <button
                          key={r}
                          onClick={() => setOpenRoles((s) => s.includes(r) ? s.filter((x) => x !== r) : [...s, r])}
                          className={cn(
                            "rounded-lg border px-2.5 py-1 text-xs transition",
                            openRoles.includes(r)
                              ? "border-[#A66A22]/30 bg-[#A66A22]/[0.07] text-[#A66A22]"
                              : "border-white/[0.07] text-white/35 hover:text-white/60",
                          )}
                        >
                          {r}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
                <div className="flex gap-2 pt-1">
                  <Button className="flex-1" loading={creating} onClick={createTeam} disabled={!name.trim()}>
                    Create team
                  </Button>
                  <Button variant="ghost" onClick={() => setShowCreate(false)}>Cancel</Button>
                </div>
              </GlassCard>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── Settings modal ── */}
      <AnimatePresence>
        {showSettings && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4"
            onClick={(e) => {
              if (e.target === e.currentTarget) {
                setShowSettings(null);
                setDeleteConfirm(false);
              }
            }}
          >
            <motion.div
              initial={{ scale: 0.96, opacity: 0, y: 8 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.96, opacity: 0, y: 8 }}
              transition={{ duration: 0.18, ease: [0.2, 0.8, 0.2, 1] }}
              className="w-full max-w-md"
            >
              <GlassCard className="space-y-5">
                <div className="flex items-center justify-between">
                  <h2 className="font-display text-xl font-bold text-white">Team Settings</h2>
                  <button
                    onClick={() => { setShowSettings(null); setDeleteConfirm(false); }}
                    className="text-white/30 hover:text-white transition"
                  >
                    <X className="h-5 w-5" />
                  </button>
                </div>

                {/* Team info */}
                <div className="rounded-xl border border-white/[0.07] bg-white/[0.02] p-4 space-y-3">
                  <div>
                    <p className="text-[11px] text-white/30 mb-1 uppercase tracking-wider font-semibold">Team name</p>
                    <p className="text-sm font-semibold text-white">{showSettings.name}</p>
                  </div>
                  {showSettings.tagline && (
                    <div>
                      <p className="text-[11px] text-white/30 mb-1 uppercase tracking-wider font-semibold">Tagline</p>
                      <p className="text-sm text-white/60">{showSettings.tagline}</p>
                    </div>
                  )}
                </div>

                {/* Members */}
                <div>
                  <p className="text-[11px] text-white/30 mb-2 uppercase tracking-wider font-semibold">
                    Members ({showSettings.members.length})
                  </p>
                  <div className="space-y-2">
                    {showSettings.members.map((m) => (
                      <div key={m.id} className="flex items-center gap-3 rounded-xl border border-white/[0.06] bg-white/[0.02] px-3 py-2">
                        <Avatar src={m.avatar} name={m.name} size={28} />
                        <div className="flex-1 min-w-0">
                          <p className="text-sm text-white truncate">{m.name}</p>
                          <p className="text-xs text-white/30 truncate">{m.role || "Developer"}</p>
                        </div>
                        {showSettings.ownerId === m.id ? (
                          <div className="flex items-center gap-1 rounded-md border border-yellow-500/20 bg-yellow-500/[0.07] px-1.5 py-0.5">
                            <Crown className="h-2.5 w-2.5 text-yellow-500/70" />
                            <span className="text-[9px] font-semibold text-yellow-500/70">Owner</span>
                          </div>
                        ) : isOwner(showSettings) && (
                          <button
                            disabled={removingMember === m.id}
                            onClick={() => doRemoveMember(m.id)}
                            className="grid h-6 w-6 place-items-center rounded-lg text-white/20 hover:text-red-400 hover:bg-red-500/[0.08] transition disabled:opacity-40"
                            title="Remove member"
                          >
                            {removingMember === m.id
                              ? <span className="h-3 w-3 rounded-full border border-white/20 border-t-white/60 animate-spin block" />
                              : <UserMinus className="h-3.5 w-3.5" />}
                          </button>
                        )}
                      </div>
                    ))}
                  </div>
                </div>

                {/* Delete — only for owner */}
                {isOwner(showSettings) && (
                  <div className="border-t border-white/[0.05] pt-4">
                    {!deleteConfirm ? (
                      <button
                        onClick={() => setDeleteConfirm(true)}
                        className="flex items-center gap-2 rounded-xl border border-red-500/20 bg-red-500/[0.05] px-4 py-2.5 text-sm text-red-400/80 hover:bg-red-500/[0.1] hover:text-red-400 transition w-full"
                      >
                        <Trash2 className="h-4 w-4" />
                        Delete team
                      </button>
                    ) : (
                      <div className="rounded-xl border border-red-500/25 bg-red-500/[0.05] p-4 space-y-3">
                        <div className="flex items-center gap-2">
                          <AlertCircle className="h-4 w-4 text-red-400 shrink-0" />
                          <p className="text-sm text-red-300/80">
                            Delete <strong className="text-red-300">"{showSettings.name}"</strong>? This cannot be undone.
                          </p>
                        </div>
                        <div className="flex gap-2">
                          <Button
                            size="sm"
                            className="flex-1 bg-red-500/20 text-red-300 border border-red-500/30 hover:bg-red-500/30"
                            loading={deleting}
                            onClick={doDeleteTeam}
                          >
                            <Trash2 className="h-3.5 w-3.5" /> Yes, delete
                          </Button>
                          <Button size="sm" variant="ghost" onClick={() => setDeleteConfirm(false)}>
                            Cancel
                          </Button>
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </GlassCard>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── My Teams ── */}
      {tab === "mine" && (
        <>
          {loading ? (
            <div className="grid gap-4 sm:grid-cols-2">
              {Array.from({ length: 2 }).map((_, i) => <Skeleton key={i} className="h-56 w-full" />)}
            </div>
          ) : !myTeams || myTeams.length === 0 ? (
            <GlassCard className="py-16 text-center">
              <div className="mx-auto mb-4 grid h-12 w-12 place-items-center rounded-2xl border border-white/[0.07] bg-white/[0.03]">
                <Users className="h-6 w-6 text-white/30" />
              </div>
              <p className="text-sm text-white/40">You're not in any teams yet.</p>
              <div className="mt-5 flex justify-center gap-3">
                <Button onClick={() => setShowCreate(true)}>
                  <Plus className="h-4 w-4" /> Create team
                </Button>
                <Button variant="outline" onClick={() => setTab("discover")}>Discover teams</Button>
              </div>
            </GlassCard>
          ) : (
            <div className="grid gap-4 sm:grid-cols-2">
              {myTeams.map((t, i) => (
                <motion.div
                  key={t.id}
                  initial={{ opacity: 0, y: 16 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.07 }}
                >
                  <GlassCard interactive className="h-full flex flex-col">
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0">
                        <div className="flex items-center gap-2">
                          <h3 className="font-display text-base font-semibold text-white truncate">{t.name}</h3>
                          {isOwner(t) && <Crown className="h-3.5 w-3.5 text-yellow-500/60 shrink-0" />}
                        </div>
                        <p className="text-xs text-white/30 truncate mt-0.5">{t.tagline || "No tagline yet"}</p>
                      </div>
                      <Badge tone={stageTone[t.stage]}>{t.stage}</Badge>
                    </div>

                    {/* Members */}
                    <div className="mt-4 flex items-center gap-2">
                      <div className="flex -space-x-2">
                        {t.members.slice(0, 5).map((m) => (
                          <button key={m.id} onClick={() => navigate.push(`/profile/${m.id}`)}>
                            <Avatar src={m.avatar} name={m.name} size={28} className="ring-2 ring-ink-950 hover:ring-neon-cyan transition" />
                          </button>
                        ))}
                        {t.members.length > 5 && (
                          <div className="flex h-7 w-7 items-center justify-center rounded-full bg-white/[0.07] ring-2 ring-ink-950 text-[10px] text-white/40">
                            +{t.members.length - 5}
                          </div>
                        )}
                      </div>
                      <span className="text-xs text-white/25">
                        {t.members.length} {t.members.length === 1 ? "member" : "members"}
                      </span>
                    </div>

                    {/* Progress */}
                    {t.taskStats.total > 0 && (
                      <div className="mt-3">
                        <div className="mb-1 flex items-center justify-between text-[11px] text-white/30">
                          <span>Progress</span>
                          <span>{t.taskStats.done}/{t.taskStats.total} done</span>
                        </div>
                        <div className="h-1.5 w-full overflow-hidden rounded-full bg-white/[0.06]">
                          <div
                            className="h-full rounded-full bg-neon-grad transition-all duration-500"
                            style={{ width: `${Math.round((t.taskStats.done / t.taskStats.total) * 100)}%` }}
                          />
                        </div>
                      </div>
                    )}

                    {/* Stack */}
                    {t.stack.length > 0 && (
                      <div className="mt-3 flex flex-wrap gap-1.5">
                        {t.stack.slice(0, 4).map((s) => <Badge key={s}>{s}</Badge>)}
                        {t.stack.length > 4 && <Badge>+{t.stack.length - 4}</Badge>}
                      </div>
                    )}

                    {/* Open roles */}
                    {t.openRoles.length > 0 && (
                      <div className="mt-3 rounded-xl border border-white/[0.06] bg-white/[0.02] p-3">
                        <p className="mb-1.5 flex items-center gap-1.5 text-[11px] font-medium text-neon-cyan/60">
                          <Layers className="h-3 w-3" /> Open roles
                        </p>
                        <div className="flex flex-wrap gap-1.5">
                          {t.openRoles.map((r) => <Badge key={r} tone="cyan">{r}</Badge>)}
                        </div>
                      </div>
                    )}

                    {/* Actions */}
                    <div className="mt-auto pt-4 flex flex-wrap gap-2">
                      <Button size="sm" variant="subtle" className="flex-1 min-w-0" onClick={() => openBoard(t)}>
                        <Kanban className="h-3.5 w-3.5" /> Board
                      </Button>
                      <Button size="sm" className="flex-1 min-w-0" onClick={() => openTeamChat(t)}>
                        <MessageSquare className="h-3.5 w-3.5" /> Chat
                      </Button>
                      <button
                        onClick={() => { setShowSettings(t); setDeleteConfirm(false); }}
                        className="grid h-8 w-8 place-items-center rounded-xl border border-white/[0.07] bg-white/[0.03] text-white/30 hover:text-white hover:border-white/[0.12] transition"
                      >
                        <Settings className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  </GlassCard>
                </motion.div>
              ))}
            </div>
          )}
        </>
      )}

      {/* ── Discover ── */}
      {tab === "discover" && (
        <>
          {allLoading ? (
            <div className="grid gap-4 sm:grid-cols-2">
              {Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-48 w-full" />)}
            </div>
          ) : discoverTeams.length === 0 ? (
            <GlassCard className="py-16 text-center">
              <p className="text-sm text-white/40">No other teams to discover right now.</p>
              <Button className="mt-4" onClick={() => setShowCreate(true)}>
                <Plus className="h-4 w-4" /> Create one
              </Button>
            </GlassCard>
          ) : (
            <div className="grid gap-4 sm:grid-cols-2">
              {discoverTeams.map((t, i) => (
                <motion.div
                  key={t.id}
                  initial={{ opacity: 0, y: 16 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.07 }}
                >
                  <GlassCard interactive className="h-full flex flex-col">
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0">
                        <h3 className="font-display text-base font-semibold text-white truncate">{t.name}</h3>
                        <p className="text-xs text-white/30 truncate mt-0.5">{t.tagline || "No tagline yet"}</p>
                      </div>
                      <Badge tone={stageTone[t.stage]}>{t.stage}</Badge>
                    </div>

                    <div className="mt-4 flex items-center gap-2">
                      <div className="flex -space-x-2">
                        {t.members.slice(0, 4).map((m) => (
                          <Avatar key={m.id} src={m.avatar} name={m.name} size={26} className="ring-2 ring-ink-950" />
                        ))}
                      </div>
                      <span className="text-xs text-white/25">{t.members.length} member{t.members.length !== 1 ? "s" : ""}</span>
                    </div>

                    {t.taskStats.total > 0 && (
                      <div className="mt-3">
                        <div className="mb-1 flex items-center justify-between text-[11px] text-white/30">
                          <span>Progress</span>
                          <span>{t.taskStats.done}/{t.taskStats.total} done</span>
                        </div>
                        <div className="h-1.5 w-full overflow-hidden rounded-full bg-white/[0.06]">
                          <div
                            className="h-full rounded-full bg-neon-grad transition-all duration-500"
                            style={{ width: `${Math.round((t.taskStats.done / t.taskStats.total) * 100)}%` }}
                          />
                        </div>
                      </div>
                    )}

                    {t.stack.length > 0 && (
                      <div className="mt-3 flex flex-wrap gap-1.5">
                        {t.stack.slice(0, 4).map((s) => <Badge key={s}>{s}</Badge>)}
                        {t.stack.length > 4 && <Badge>+{t.stack.length - 4}</Badge>}
                      </div>
                    )}
                    {t.openRoles.length > 0 && (
                      <div className="mt-3 rounded-xl border border-white/[0.06] bg-white/[0.02] p-3">
                        <p className="mb-1.5 flex items-center gap-1.5 text-[11px] font-medium text-neon-cyan/60">
                          <Layers className="h-3 w-3" /> Open roles
                        </p>
                        <div className="flex flex-wrap gap-1.5">
                          {t.openRoles.map((r) => <Badge key={r} tone="cyan">{r}</Badge>)}
                        </div>
                      </div>
                    )}

                    <div className="mt-auto pt-4">
                      <Button
                        size="sm"
                        className="w-full"
                        loading={joining === t.id}
                        onClick={() => joinTeam(t.id)}
                      >
                        <Check className="h-3.5 w-3.5" /> Request to join
                      </Button>
                    </div>
                  </GlassCard>
                </motion.div>
              ))}
            </div>
          )}
        </>
      )}
    </div>
  );
}
