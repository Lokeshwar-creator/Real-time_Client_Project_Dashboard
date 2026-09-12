import { Router } from "express";
import { Role } from "@prisma/client";

import {
  createProjectController,
  getProjectsController,
  getProjectByIdController,
  updateProjectController,
} from "./project.controller";

import { authenticate } from "../../middleware/auth.middleware";
import { requireRoles } from "../../middleware/role.middleware";
import { validateBody } from "../../middleware/validation.middleware";
import {
  getClientsController,
} from "./project.controller";

import {
  createProjectSchema,
  updateProjectSchema,
} from "./project.validation";

const router = Router();

router.use(authenticate);

router.get(
  "/",
  requireRoles(
    Role.ADMIN,
    Role.PROJECT_MANAGER
  ),
  getProjectsController
);

router.post(
  "/",
  requireRoles(
    Role.ADMIN,
    Role.PROJECT_MANAGER
  ),
  validateBody(createProjectSchema),
  createProjectController
);

// Keep this static route before `/:id`; otherwise Express interprets
// "clients" as a project id.
router.get(
  "/clients",
  requireRoles(
    Role.ADMIN,
    Role.PROJECT_MANAGER
  ),
  getClientsController
);

router.get(
  "/:id",
  requireRoles(
    Role.ADMIN,
    Role.PROJECT_MANAGER
  ),
  getProjectByIdController
);

router.patch(
  "/:id",
  requireRoles(
    Role.ADMIN,
    Role.PROJECT_MANAGER
  ),
  validateBody(updateProjectSchema),
  updateProjectController
);

export default router;
