import { Router } from "express";
import { requireAuth } from "../middleware/auth.js";
import { asyncH } from "../middleware/error.js";
import {
  listMyProjects, listUserProjects, createProject, updateProject, deleteProject,
  addCertificate, deleteCertificate,
} from "../controllers/project.controller.js";

const r = Router();
r.use(requireAuth);

r.get("/projects/me", asyncH(listMyProjects));
r.get("/projects/:userId", asyncH(listUserProjects));
r.post("/projects", asyncH(createProject));
r.patch("/projects/:id", asyncH(updateProject));
r.delete("/projects/:id", asyncH(deleteProject));

r.post("/certificates", asyncH(addCertificate));
r.delete("/certificates/:certId", asyncH(deleteCertificate));

export default r;
