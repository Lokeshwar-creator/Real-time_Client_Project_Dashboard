import { Response } from "express";

import { AuthenticatedRequest } from "../../middleware/auth.middleware";

import {
  getNotifications,
  getUnreadNotificationCount,
  markNotificationAsRead,
  markAllNotificationsAsRead,
} from "./notification.service";

/**
 * ---------------------------------------------------------
 * GET NOTIFICATIONS
 * ---------------------------------------------------------
 */

export async function getNotificationsController(
  req: AuthenticatedRequest,
  res: Response
) {
  try {
    const userId =
      req.user!.userId;

    const unreadOnly =
      req.query.unreadOnly === "true";

    const notifications =
      await getNotifications(
        userId,
        unreadOnly
      );

    return res.status(200).json({
      success: true,
      message:
        "Notifications fetched successfully",
      data: notifications,
    });
  } catch (error) {
    return res.status(400).json({
      success: false,
      message:
        error instanceof Error
          ? error.message
          : "Unable to fetch notifications",
    });
  }
}

/**
 * ---------------------------------------------------------
 * GET UNREAD COUNT
 * ---------------------------------------------------------
 */

export async function getUnreadCountController(
  req: AuthenticatedRequest,
  res: Response
) {
  try {
    const userId =
      req.user!.userId;

    const count =
      await getUnreadNotificationCount(
        userId
      );

    return res.status(200).json({
      success: true,
      data: {
        count,
      },
    });
  } catch (error) {
    return res.status(400).json({
      success: false,
      message:
        error instanceof Error
          ? error.message
          : "Unable to get unread count",
    });
  }
}

/**
 * ---------------------------------------------------------
 * MARK ONE AS READ
 * ---------------------------------------------------------
 */

export async function markNotificationAsReadController(
  req: AuthenticatedRequest,
  res: Response
) {
  try {
    const userId =
      req.user!.userId;

    const notificationId =
      Array.isArray(req.params.id)
        ? req.params.id[0]
        : req.params.id;

    const notification =
      await markNotificationAsRead(
        notificationId,
        userId
      );

    const unreadCount =
      await getUnreadNotificationCount(
        userId
      );

    return res.status(200).json({
      success: true,
      message:
        "Notification marked as read",
      data: {
        notification,
        unreadCount,
      },
    });
  } catch (error) {
    return res.status(404).json({
      success: false,
      message:
        error instanceof Error
          ? error.message
          : "Unable to mark notification as read",
    });
  }
}

/**
 * ---------------------------------------------------------
 * MARK ALL AS READ
 * ---------------------------------------------------------
 */

export async function markAllNotificationsAsReadController(
  req: AuthenticatedRequest,
  res: Response
) {
  try {
    const userId =
      req.user!.userId;

    await markAllNotificationsAsRead(
      userId
    );

    return res.status(200).json({
      success: true,
      message:
        "All notifications marked as read",
      data: {
        unreadCount: 0,
      },
    });
  } catch (error) {
    return res.status(400).json({
      success: false,
      message:
        error instanceof Error
          ? error.message
          : "Unable to mark notifications as read",
    });
  }
}