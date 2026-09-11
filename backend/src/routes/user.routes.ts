import { Router } from "express";
import { requireAuth, requireRole } from "../middleware/auth.js";
import { asyncH } from "../middleware/error.js";
import {
  updateProfile, myTrust, recruiterList, rankedMatches,
  listUsers, getUser, myActivity, featuredUsers,
} from "../controllers/user.controller.js";

const r = Router();

r.use(requireAuth);

// /users/me/... MUST come before /users/:id to avoid param conflict
r.get("/users/me/trust", asyncH(myTrust));
r.get("/users/me/activity", asyncH(myActivity));
r.patch("/users/me", asyncH(updateProfile));

r.get("/users", asyncH(listUsers));
r.get("/users/:id", asyncH(getUser));

r.get("/matches", asyncH(rankedMatches));
r.get("/recruiter/developers", requireRole("recruiter", "admin"), asyncH(recruiterList));

export default r;
