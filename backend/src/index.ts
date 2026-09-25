import http from "http";
import express from "express";
import cors from "cors";
import { env } from "./config/env.js";
import { connectDB } from "./config/db.js";
import { notFound, errorHandler } from "./middleware/error.js";
import { initChatSocket } from "./sockets/chat.socket.js";
// Billing temporarily disabled — see routes/billing.routes.ts and app/(app)/billing/page.tsx
// import { webhook } from "./controllers/billing.controller.js";

import authRoutes from "./routes/auth.routes.js";
import publicRoutes from "./routes/public.routes.js";
import messageRoutes from "./routes/message.routes.js";
import userRoutes from "./routes/user.routes.js";
// import billingRoutes from "./routes/billing.routes.js";
import teamRoutes from "./routes/team.routes.js";
import ideaRoutes from "./routes/idea.routes.js";
import taskRoutes from "./routes/task.routes.js";
import connectionRoutes from "./routes/connection.routes.js";
import notificationRoutes from "./routes/notification.routes.js";
import projectRoutes from "./routes/project.routes.js";
import endorsementRoutes from "./routes/endorsement.routes.js";

const app = express();
const allowedOrigins = [
  env.clientOrigin,
  // Accept any localhost port during local development
  ...(/^http:\/\/localhost/.test(env.clientOrigin) ? [/^http:\/\/localhost:\d+$/] : []),
];
app.use(cors({
  origin: (origin, cb) => {
    if (!origin) return cb(null, true); // server-to-server / curl
    const ok = allowedOrigins.some((o) => typeof o === "string" ? o === origin : o.test(origin));
    ok ? cb(null, true) : cb(new Error(`CORS: origin ${origin} not allowed`));
  },
  credentials: true,
}));

// app.post("/api/billing/webhook", express.raw({ type: "application/json" }), webhook);
app.use(express.json({ limit: "10mb" }));

app.get("/health", (_req, res) => res.json({ ok: true }));

// Public (no auth) — FIRST
app.use("/api/auth", authRoutes);
app.use("/api/public", publicRoutes);

// Authenticated routes
app.use("/api", messageRoutes);
app.use("/api", userRoutes);
// app.use("/api", billingRoutes);
app.use("/api", teamRoutes);
app.use("/api", ideaRoutes);
app.use("/api", taskRoutes);
app.use("/api", connectionRoutes);
app.use("/api", notificationRoutes);
app.use("/api", projectRoutes);
app.use("/api", endorsementRoutes);

app.use(notFound);
app.use(errorHandler);

const server = http.createServer(app);
initChatSocket(server);

connectDB(env.mongoUri)
  .then(() => {
    server.listen(env.port, () =>
      console.log(`✓ SkillShare API + Socket.io on http://localhost:${env.port}`),
    );
  })
  .catch((err) => {
    console.error("Failed to start:", err);
    process.exit(1);
  });
