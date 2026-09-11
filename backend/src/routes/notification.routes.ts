import { Router } from "express";
import { requireAuth } from "../middleware/auth.js";
import { asyncH } from "../middleware/error.js";
import {
  getNotifications, unreadCount, markRead, markAllRead, deleteNotification,
} from "../controllers/notification.controller.js";

const r = Router();
r.use(requireAuth);

r.get("/notifications", asyncH(getNotifications));
r.get("/notifications/unread-count", asyncH(unreadCount));
r.patch("/notifications/read-all", asyncH(markAllRead));
r.patch("/notifications/:id/read", asyncH(markRead));
r.delete("/notifications/:id", asyncH(deleteNotification));

export default r;
