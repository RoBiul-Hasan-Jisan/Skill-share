import { Router } from "express";
import { requireAuth } from "../middleware/auth.js";
import { asyncH } from "../middleware/error.js";
import { myTasks, teamTasks, createTask, updateTask, deleteTask } from "../controllers/task.controller.js";

const r = Router();
r.use(requireAuth);
r.get("/tasks", asyncH(myTasks));
r.get("/teams/:teamId/tasks", asyncH(teamTasks));
r.post("/tasks", asyncH(createTask));
r.patch("/tasks/:id", asyncH(updateTask));
r.delete("/tasks/:id", asyncH(deleteTask));
export default r;
