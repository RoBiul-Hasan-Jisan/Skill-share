import type { Response } from "express";
import { Notification } from "../models/Notification.js";
import type { AuthedRequest } from "../middleware/auth.js";

/** GET /api/notifications */
export async function getNotifications(req: AuthedRequest, res: Response) {
  const limit = Math.min(Number(req.query.limit ?? 30), 100);
  const notifications = await Notification.find({ user: req.userId })
    .sort({ createdAt: -1 })
    .limit(limit)
    .lean();
  res.json({ notifications });
}

/** GET /api/notifications/unread-count */
export async function unreadCount(req: AuthedRequest, res: Response) {
  const count = await Notification.countDocuments({ user: req.userId, read: false });
  res.json({ count });
}

/** PATCH /api/notifications/:id/read */
export async function markRead(req: AuthedRequest, res: Response) {
  await Notification.updateOne({ _id: req.params.id, user: req.userId }, { $set: { read: true } });
  res.json({ ok: true });
}

/** PATCH /api/notifications/read-all */
export async function markAllRead(req: AuthedRequest, res: Response) {
  await Notification.updateMany({ user: req.userId, read: false }, { $set: { read: true } });
  res.json({ ok: true });
}

/** DELETE /api/notifications/:id */
export async function deleteNotification(req: AuthedRequest, res: Response) {
  await Notification.deleteOne({ _id: req.params.id, user: req.userId });
  res.json({ ok: true });
}
