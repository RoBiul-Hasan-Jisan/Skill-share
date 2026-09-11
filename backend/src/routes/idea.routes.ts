import { Router } from "express";
import { requireAuth } from "../middleware/auth.js";
import { asyncH } from "../middleware/error.js";
import {
  listIdeas, createIdea, upvoteIdea,
  applyToIdea, getIdeaApplications, updateApplication,
} from "../controllers/idea.controller.js";

const r = Router();
r.use(requireAuth);
r.get("/ideas", asyncH(listIdeas));
r.post("/ideas", asyncH(createIdea));
r.post("/ideas/:id/upvote", asyncH(upvoteIdea));
r.post("/ideas/:id/apply", asyncH(applyToIdea));
r.get("/ideas/:id/applications", asyncH(getIdeaApplications));
r.patch("/applications/:id", asyncH(updateApplication));
export default r;
