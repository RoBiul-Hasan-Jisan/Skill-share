import { Router } from "express";
import { asyncH } from "../middleware/error.js";
import { featuredUsers } from "../controllers/user.controller.js";

const r = Router();
r.get("/featured", asyncH(featuredUsers));
export default r;
