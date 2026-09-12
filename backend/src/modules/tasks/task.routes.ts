import { Router } from "express";

import { Role } from "@prisma/client";

import {
  authenticate,
} from "../../middleware/auth.middleware";

import {
  requireRoles,
} from "../../middleware/role.middleware";

import {
  validateBody,
} from "../../middleware/validation.middleware";

import {
  createTaskSchema,
  updateTaskSchema,
  changeTaskStatusSchema,
} from "./task.validation";

import {
  createTaskController,
  getTasksController,
  getTaskByIdController,
  updateTaskController,
  changeTaskStatusController,
} from "./task.controller";

const router = Router();

/**
 * ---------------------------------------------------------
 * ALL TASK ROUTES REQUIRE AUTHENTICATION
 * ---------------------------------------------------------
 */
router.use(authenticate);

/**
 * ---------------------------------------------------------
 * GET ALL TASKS
 * ---------------------------------------------------------
 *
 * ADMIN:
 *   All tasks
 *
 * PROJECT_MANAGER:
 *   Own project tasks
 *
 * DEVELOPER:
 *   Assigned tasks only
 */
router.get(
  "/",
  requireRoles(
    Role.ADMIN,
    Role.PROJECT_MANAGER,
    Role.DEVELOPER
  ),
  getTasksController
);

/**
 * ---------------------------------------------------------
 * CREATE TASK
 * ---------------------------------------------------------
 *
 * Only:
 *   ADMIN
 *   PROJECT_MANAGER
 */
router.post(
  "/",
  requireRoles(
    Role.ADMIN,
    Role.PROJECT_MANAGER
  ),
  validateBody(createTaskSchema),
  createTaskController
);

/**
 * ---------------------------------------------------------
 * CHANGE TASK STATUS
 * ---------------------------------------------------------
 *
 * IMPORTANT:
 * This route MUST appear before /:id.
 *
 * Example:
 *
 * PATCH /api/tasks/123/status
 */
router.patch(
  "/:id/status",
  requireRoles(
    Role.ADMIN,
    Role.PROJECT_MANAGER,
    Role.DEVELOPER
  ),
  validateBody(changeTaskStatusSchema),
  changeTaskStatusController
);

/**
 * ---------------------------------------------------------
 * GET SINGLE TASK
 * ---------------------------------------------------------
 */
router.get(
  "/:id",
  requireRoles(
    Role.ADMIN,
    Role.PROJECT_MANAGER,
    Role.DEVELOPER
  ),
  getTaskByIdController
);

/**
 * ---------------------------------------------------------
 * UPDATE TASK
 * ---------------------------------------------------------
 *
 * ADMIN:
 *   Everything
 *
 * PROJECT_MANAGER:
 *   Everything on own projects
 *
 * DEVELOPER:
 *   Status only
 */
router.patch(
  "/:id",
  requireRoles(
    Role.ADMIN,
    Role.PROJECT_MANAGER,
    Role.DEVELOPER
  ),
  validateBody(updateTaskSchema),
  updateTaskController
);

export default router;