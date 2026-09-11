import { Router } from "express";
import { requireAuth } from "../middleware/auth.js";
import { asyncH } from "../middleware/error.js";
import {
  listConversations, getMessages, searchMessages, openDm,
  editMessage, deleteMessage, reactMessage, clearConversation,
} from "../controllers/message.controller.js";

const r = Router();
r.use(requireAuth);

r.get("/conversations", asyncH(listConversations));
r.post("/conversations/dm/:userId", asyncH(openDm));
r.get("/conversations/:id/messages", asyncH(getMessages));
r.delete("/conversations/:id/messages", asyncH(clearConversation));
r.get("/conversations/:id/search", asyncH(searchMessages));

r.patch("/messages/:id", asyncH(editMessage));
r.delete("/messages/:id", asyncH(deleteMessage));
r.post("/messages/:id/react", asyncH(reactMessage));

export default r;
