import { Router } from "express";

import { authenticate } from "../../middleware/auth.middleware";

import {
  getNotificationsController,
  getUnreadCountController,
  markNotificationAsReadController,
  markAllNotificationsAsReadController,
} from "./notification.controller";

const router = Router();

/**
 * All notification endpoints require authentication.
 */
router.use(authenticate);

/**
 * GET /api/notifications
 */
router.get(
  "/",
  getNotificationsController
);

/**
 * GET /api/notifications/unread-count
 */
router.get(
  "/unread-count",
  getUnreadCountController
);

/**
 * PATCH /api/notifications/read-all
 */
router.patch(
  "/read-all",
  markAllNotificationsAsReadController
);

/**
 * PATCH /api/notifications/:id/read
 */
router.patch(
  "/:id/read",
  markNotificationAsReadController
);

export default router;