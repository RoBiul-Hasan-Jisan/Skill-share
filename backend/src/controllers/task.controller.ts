import type { Response } from "express";
import { z } from "zod";
import { Task } from "../models/Task.js";
import { Team } from "../models/Team.js";
import type { AuthedRequest } from "../middleware/auth.js";

const ASSIGNEE_FIELDS = "name handle avatar";

const createSchema = z.object({
  teamId: z.string(),
  title: z.string().min(1),
  priority: z.enum(["low", "med", "high"]).optional().default("med"),
  assigneeId: z.string().optional(),
  status: z.enum(["todo", "in_progress", "review", "done"]).optional().default("todo"),
});

const updateSchema = z.object({
  title: z.string().min(1).optional(),
  status: z.enum(["todo", "in_progress", "review", "done"]).optional(),
  priority: z.enum(["low", "med", "high"]).optional(),
  assignee: z.string().nullable().optional(),
  order: z.number().optional(),
});

export async function myTasks(req: AuthedRequest, res: Response) {
  const myTeams = await Team.find({ members: req.userId }).select("_id").lean();
  const teamIds = myTeams.map((t: any) => t._id);
  const tasks = await Task.find({ team: { $in: teamIds } })
    .populate("assignee", ASSIGNEE_FIELDS)
    .sort({ order: 1, createdAt: 1 })
    .lean();
  res.json({ tasks });
}

export async function teamTasks(req: AuthedRequest, res: Response) {
  const tasks = await Task.find({ team: req.params.teamId })
    .populate("assignee", ASSIGNEE_FIELDS)
    .sort({ order: 1, createdAt: 1 })
    .lean();
  res.json({ tasks });
}

export async function createTask(req: AuthedRequest, res: Response) {
  const body = createSchema.parse(req.body);
  const task = await Task.create({
    team: body.teamId,
    title: body.title,
    priority: body.priority,
    status: body.status,
    assignee: body.assigneeId ?? null,
  });
  const populated = await Task.findById(task._id).populate("assignee", ASSIGNEE_FIELDS).lean();
  res.status(201).json({ task: populated });
}

export async function updateTask(req: AuthedRequest, res: Response) {
  const patch = updateSchema.parse(req.body);
  const task = await Task.findByIdAndUpdate(req.params.id, patch, { new: true })
    .populate("assignee", ASSIGNEE_FIELDS)
    .lean();
  if (!task) return res.status(404).json({ error: "Not found" });
  res.json({ task });
}

export async function deleteTask(req: AuthedRequest, res: Response) {
  const task = await Task.findById(req.params.id).lean();
  if (!task) return res.status(404).json({ error: "Not found" });
  await Task.findByIdAndDelete(req.params.id);
  res.json({ ok: true });
}
