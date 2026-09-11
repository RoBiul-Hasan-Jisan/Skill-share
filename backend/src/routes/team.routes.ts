import { Router } from "express";
import { requireAuth } from "../middleware/auth.js";
import { asyncH } from "../middleware/error.js";
import { myTeams, allTeams, createTeam, joinTeam, deleteTeam, removeMember } from "../controllers/team.controller.js";

const r = Router();
r.use(requireAuth);
r.get("/teams/mine", asyncH(myTeams));
r.get("/teams", asyncH(allTeams));
r.post("/teams", asyncH(createTeam));
r.post("/teams/:id/join", asyncH(joinTeam));
r.delete("/teams/:id", asyncH(deleteTeam));
r.delete("/teams/:id/members/:memberId", asyncH(removeMember));
export default r;
