import { Router } from "express";
import { register, login, me, googleAuth, completeOnboarding, updateAvatar } from "../controllers/auth.controller.js";
import { requireAuth } from "../middleware/auth.js";
import { asyncH } from "../middleware/error.js";

const r = Router();
r.post("/register", asyncH(register));
r.post("/login", asyncH(login));
r.post("/google", asyncH(googleAuth));
r.get("/me", requireAuth, asyncH(me));
r.post("/onboarding", requireAuth, asyncH(completeOnboarding));
r.patch("/avatar", requireAuth, asyncH(updateAvatar));
export default r;
