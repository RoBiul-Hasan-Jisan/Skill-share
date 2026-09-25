import { Router } from "express";
import { requireAuth } from "../middleware/auth.js";
import { asyncH } from "../middleware/error.js";
import { listEndorsements, createEndorsement, deleteEndorsement } from "../controllers/endorsement.controller.js";

const r = Router();
r.use(requireAuth);

r.get("/users/:id/endorsements", asyncH(listEndorsements));
r.post("/users/:id/endorsements", asyncH(createEndorsement));
r.delete("/endorsements/:id", asyncH(deleteEndorsement));

export default r;
