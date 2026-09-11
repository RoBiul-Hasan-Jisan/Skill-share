import { Router } from "express";
import { requireAuth } from "../middleware/auth.js";
import { asyncH } from "../middleware/error.js";
import {
  sendRequest, acceptRequest, rejectRequest,
  listConnections, listPending, connectionStatus, removeConnection,
} from "../controllers/connection.controller.js";

const r = Router();
r.use(requireAuth);

r.get("/connections", asyncH(listConnections));
r.get("/connections/pending", asyncH(listPending));
r.get("/connections/status/:userId", asyncH(connectionStatus));
r.post("/connections/request/:userId", asyncH(sendRequest));
r.post("/connections/:id/accept", asyncH(acceptRequest));
r.post("/connections/:id/reject", asyncH(rejectRequest));
r.delete("/connections/:userId", asyncH(removeConnection));

export default r;
