import type { Response } from "express";
import { Project } from "../models/Project.js";
import { User } from "../models/User.js";
import { recomputeTrust } from "./user.controller.js";
import type { AuthedRequest } from "../middleware/auth.js";

/** GET /api/projects/me */
export async function listMyProjects(req: AuthedRequest, res: Response) {
  const projects = await Project.find({ owner: req.userId }).sort({ createdAt: -1 }).lean();
  res.json({ projects });
}

/** GET /api/projects/:userId */
export async function listUserProjects(req: AuthedRequest, res: Response) {
  const projects = await Project.find({ owner: req.params.userId }).sort({ createdAt: -1 }).lean();
  res.json({ projects });
}

/** POST /api/projects */
export async function createProject(req: AuthedRequest, res: Response) {
  const { title, description, stack, repoUrl, liveUrl, image } = req.body;
  if (!title) return res.status(400).json({ error: "title is required" });

  const project = await Project.create({
    owner: req.userId,
    title,
    description,
    stack: stack ?? [],
    repoUrl,
    liveUrl,
    image,
  });

  await User.findByIdAndUpdate(req.userId, { $inc: { projectsCount: 1 } });
  await recomputeTrust(req.userId!);

  res.status(201).json({ project });
}

/** PATCH /api/projects/:id */
export async function updateProject(req: AuthedRequest, res: Response) {
  const project = await Project.findOne({ _id: req.params.id, owner: req.userId });
  if (!project) return res.status(404).json({ error: "Not found" });

  const { title, description, stack, repoUrl, liveUrl, image } = req.body;
  if (title !== undefined) project.title = title;
  if (description !== undefined) project.description = description;
  if (stack !== undefined) project.stack = stack;
  if (repoUrl !== undefined) project.repoUrl = repoUrl;
  if (liveUrl !== undefined) project.liveUrl = liveUrl;
  if (image !== undefined) project.image = image;

  await project.save();
  res.json({ project });
}

/** DELETE /api/projects/:id */
export async function deleteProject(req: AuthedRequest, res: Response) {
  const project = await Project.findOneAndDelete({ _id: req.params.id, owner: req.userId });
  if (!project) return res.status(404).json({ error: "Not found" });
  await User.findByIdAndUpdate(req.userId, { $inc: { projectsCount: -1 } });
  await recomputeTrust(req.userId!);
  res.json({ ok: true });
}

/** POST /api/certificates — add certificate embedded in user */
export async function addCertificate(req: AuthedRequest, res: Response) {
  const { name, issuer, year, credentialUrl, imageUrl } = req.body;
  if (!name || !issuer) return res.status(400).json({ error: "name and issuer are required" });

  const user = await User.findByIdAndUpdate(
    req.userId,
    {
      $push: { certificates: { name, issuer, year, credentialUrl, imageUrl } },
      $inc: { certificatesCount: 1 },
    },
    { new: true },
  );
  const cert = user?.certificates[user.certificates.length - 1];
  await recomputeTrust(req.userId!);
  res.status(201).json({ certificate: cert });
}

/** DELETE /api/certificates/:certId — remove embedded certificate */
export async function deleteCertificate(req: AuthedRequest, res: Response) {
  const user = await User.findByIdAndUpdate(
    req.userId,
    {
      $pull: { certificates: { _id: req.params.certId } },
      $inc: { certificatesCount: -1 },
    },
    { new: true },
  );
  if (!user) return res.status(404).json({ error: "Not found" });
  await recomputeTrust(req.userId!);
  res.json({ ok: true });
}
