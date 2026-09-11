import type { Response } from "express";
import { z } from "zod";
import { StartupIdea } from "../models/StartupIdea.js";
import { Application } from "../models/Application.js";
import { Notification } from "../models/Notification.js";
import { User } from "../models/User.js";
import { emitToUser } from "../sockets/chat.socket.js";
import type { AuthedRequest } from "../middleware/auth.js";

const AUTHOR_FIELDS = "name handle avatar role trustScore";
const APPLICANT_FIELDS = "name handle avatar role trustScore availability bio";

const createSchema = z.object({
  title: z.string().min(3),
  pitch: z.string().optional().default(""),
  lookingFor: z.array(z.string()).optional().default([]),
  tags: z.array(z.string()).optional().default([]),
});

function mapIdea(idea: any) {
  return {
    ...idea,
    id: String(idea._id),
    upvotes: Array.isArray(idea.upvotes) ? idea.upvotes.length : (idea.upvotes ?? 0),
    comments: idea.commentsCount ?? 0,
  };
}

export async function listIdeas(req: AuthedRequest, res: Response) {
  const ideas = await StartupIdea.find()
    .populate("author", AUTHOR_FIELDS)
    .sort({ createdAt: -1 })
    .limit(50)
    .lean();
  res.json({ ideas: ideas.map(mapIdea) });
}

export async function createIdea(req: AuthedRequest, res: Response) {
  const body = createSchema.parse(req.body);
  const idea = await StartupIdea.create({ ...body, author: req.userId });
  const populated = await StartupIdea.findById(idea._id).populate("author", AUTHOR_FIELDS).lean();
  res.status(201).json({ idea: mapIdea(populated) });
}

export async function upvoteIdea(req: AuthedRequest, res: Response) {
  const idea = await StartupIdea.findById(req.params.id);
  if (!idea) return res.status(404).json({ error: "Not found" });
  const hasVoted = (idea.upvotes as any[]).some((id: any) => String(id) === req.userId);
  if (hasVoted) {
    (idea as any).upvotes = (idea.upvotes as any[]).filter((id: any) => String(id) !== req.userId);
  } else {
    (idea.upvotes as any[]).push(req.userId);
  }
  await idea.save();
  res.json({ upvotes: idea.upvotes.length, voted: !hasVoted });
}

export async function applyToIdea(req: AuthedRequest, res: Response) {
  const applicantId = req.userId!;
  const ideaId = req.params.id;
  const { message = "", role = "" } = req.body;

  const idea = await StartupIdea.findById(ideaId);
  if (!idea) return res.status(404).json({ error: "Idea not found" });

  if (String(idea.author) === applicantId) {
    return res.status(400).json({ error: "You cannot apply to your own idea" });
  }

  const existing = await Application.findOne({ applicant: applicantId, startupIdea: ideaId });
  if (existing) return res.status(409).json({ error: "Already applied" });

  const application = await Application.create({
    applicant: applicantId,
    startupIdea: ideaId,
    role,
    message,
    status: "pending",
  });

  const applicant = await User.findById(applicantId).select("name avatar handle");

  const notification = await Notification.create({
    user: idea.author,
    type: "application",
    payload: {
      applicationId: String(application._id),
      ideaId,
      ideaTitle: idea.title,
      fromId: applicantId,
      fromName: applicant?.name,
      fromAvatar: applicant?.avatar,
      message: `${applicant?.name} applied to join "${idea.title}"`,
    },
  });

  emitToUser(String(idea.author as any), "notification:new", {
    id: String(notification._id),
    type: "application",
    message: `${applicant?.name} applied to join "${idea.title}"`,
    fromId: applicantId,
    fromName: applicant?.name,
    fromAvatar: applicant?.avatar,
    payload: { applicationId: String(application._id), ideaId, ideaTitle: idea.title },
    createdAt: new Date(),
  });

  res.status(201).json({ application: { id: String(application._id), status: "pending" } });
}

export async function getIdeaApplications(req: AuthedRequest, res: Response) {
  const ideaId = req.params.id;

  const idea = await StartupIdea.findById(ideaId).lean();
  if (!idea) return res.status(404).json({ error: "Idea not found" });

  if (String(idea.author) !== req.userId) {
    return res.status(403).json({ error: "Only the idea author can view applications" });
  }

  const applications = await Application.find({ startupIdea: ideaId })
    .populate("applicant", APPLICANT_FIELDS)
    .sort({ createdAt: -1 })
    .lean();

  res.json({ applications });
}

export async function updateApplication(req: AuthedRequest, res: Response) {
  const { id } = req.params;
  const { status } = req.body;

  if (!["accepted", "rejected"].includes(status)) {
    return res.status(400).json({ error: "Status must be accepted or rejected" });
  }

  const application = await Application.findById(id)
    .populate<{ startupIdea: { _id: any; title: string; author: any } }>("startupIdea", "title author");
  if (!application) return res.status(404).json({ error: "Application not found" });

  if (String(application.startupIdea.author) !== req.userId) {
    return res.status(403).json({ error: "Forbidden" });
  }

  application.status = status;
  await application.save();

  const me = await User.findById(req.userId).select("name avatar");
  const ideaTitle = application.startupIdea.title;
  const notifMsg = status === "accepted"
    ? `${me?.name} accepted your application for "${ideaTitle}" 🎉`
    : `Your application for "${ideaTitle}" was not accepted`;

  const notification = await Notification.create({
    user: application.applicant,
    type: "application",
    payload: {
      ideaId: String(application.startupIdea._id),
      ideaTitle,
      status,
      fromId: req.userId,
      fromName: me?.name,
      fromAvatar: me?.avatar,
      message: notifMsg,
    },
  });

  emitToUser(String(application.applicant as any), "notification:new", {
    id: String(notification._id),
    type: "application",
    message: notifMsg,
    fromId: req.userId,
    fromName: me?.name,
    fromAvatar: me?.avatar,
    payload: { ideaId: String(application.startupIdea._id), status },
    createdAt: new Date(),
  });

  res.json({ ok: true, status });
}
