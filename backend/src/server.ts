import express from "express";
import cors from "cors";
import cookieParser from "cookie-parser";
import http from "http";

import { env } from "./config/env";

import authRoutes from "./modules/auth/auth.routes";
import projectRoutes from "./modules/projects/project.routes";
import taskRoutes from "./modules/tasks/task.routes";

import { initializeSocket } from "./websocket/socket.server";
import notificationRoutes from "./modules/notifications/notification.routes";

import {
  startOverdueTaskScheduler,
} from "./jobs/overdue.task";

import dashboardRoutes from "./modules/dashboard/dashboard.routes";

const app = express();

/**
 * ---------------------------------------------------------
 * GLOBAL MIDDLEWARE
 * ---------------------------------------------------------
 */

app.use(
  cors({
    origin: env.frontendUrl,
    credentials: true,
  })
);

app.use(express.json());

app.use(cookieParser());



/**
 * ---------------------------------------------------------
 * HEALTH CHECK
 * ---------------------------------------------------------
 */

app.get("/api/health", (_req, res) => {
  res.json({
    success: true,
    message: "Server is running",
  });
});

/**
 * ---------------------------------------------------------
 * API ROUTES
 * ---------------------------------------------------------
 */

app.use("/api/auth", authRoutes);

app.use("/api/projects", projectRoutes);

app.use("/api/tasks", taskRoutes);

app.use(
  "/api/notifications",
  notificationRoutes
);
app.use(
  "/api/dashboard",
  dashboardRoutes
);
/**
 * ---------------------------------------------------------
 * CREATE HTTP SERVER
 * ---------------------------------------------------------
 */

const httpServer = http.createServer(app);

/**
 * ---------------------------------------------------------
 * INITIALIZE SOCKET.IO
 * ---------------------------------------------------------
 */

initializeSocket(httpServer);

/**
 * ---------------------------------------------------------
 * START SERVER
 * ---------------------------------------------------------
 */

httpServer.listen(env.port, () => {
  console.log(
    `Server running on http://localhost:${env.port}`
  );

  console.log(
    "Socket.IO server initialized"
  );
  startOverdueTaskScheduler();
});