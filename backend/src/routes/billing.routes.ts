import { Router } from "express";
import { requireAuth } from "../middleware/auth.js";
import { asyncH } from "../middleware/error.js";
import { createCheckout } from "../controllers/billing.controller.js";

const r = Router();
r.post("/billing/checkout", requireAuth, asyncH(createCheckout));
// NOTE: the webhook route is mounted separately in index.ts with express.raw().
export default r;
