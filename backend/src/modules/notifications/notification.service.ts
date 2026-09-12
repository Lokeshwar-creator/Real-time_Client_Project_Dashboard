import { NotificationType} from "@prisma/client";

import { prisma } from "../../config/database";
import { getSocketIO } from "../../websocket/socket.instance";
import { notificationRoom } from "../../websocket/socket.rooms";

export async function getNotifications(
  userId: string,
  unreadOnly = false
) {
  return prisma.notification.findMany({
    where: {
      userId,
      ...(unreadOnly && {
        isRead: false,
      }),
    },

    orderBy: {
      createdAt: "desc",
    },

    take: 50,
  });
}

export async function getUnreadNotificationCount(
  userId: string
) {
  return prisma.notification.count({
    where: {
      userId,
      isRead: false,
    },
  });
}

export async function markNotificationAsRead(
  notificationId: string,
  userId: string
) {
  const notification =
    await prisma.notification.findFirst({
      where: {
        id: notificationId,
        userId,
      },
    });

  if (!notification) {
    throw new Error(
      "Notification not found"
    );
  }

  const updatedNotification = await prisma.notification.update({
    where: {
      id: notificationId,
    },

    data: {
      isRead: true,
    },
  });

  const unreadCount = await getUnreadNotificationCount(userId);
  emitNotificationUpdated(userId, updatedNotification);
  emitUnreadCount(userId, unreadCount);

  return updatedNotification;
}

export async function markAllNotificationsAsRead(
  userId: string
) {
  await prisma.notification.updateMany({
    where: {
      userId,
      isRead: false,
    },

    data: {
      isRead: true,
    },
  });

  emitUnreadCount(userId, 0);
  emitAllNotificationsRead(userId);

  return {
    success: true,
  };
}

/**
 * ---------------------------------------------------------
 * CREATE NOTIFICATION
 * ---------------------------------------------------------
 */

export async function createNotification(
  userId: string,
  type: NotificationType,
  message: string
) {
  const notification =
    await prisma.notification.create({
      data: {
        userId,
        type,
        message,
      },
    });

  const unreadCount =
    await getUnreadNotificationCount(
      userId
    );

  /**
   * Send the actual notification.
   */
  try {
    const io = getSocketIO();

    io.to(notificationRoom(userId)).emit(
      "notification:new",
      notification
    );

    /**
     * Send updated unread count.
     */
    io.to(notificationRoom(userId)).emit(
      "notification:unread-count",
      {
        count: unreadCount,
      }
    );
  } catch (error) {
    console.error(
      "Unable to emit notification:",
      error
    );
  }

  return notification;
}

/**
 * ---------------------------------------------------------
 * EMIT UNREAD COUNT
 * ---------------------------------------------------------
 */

export function emitUnreadCount(
  userId: string,
  count: number
) {
  try {
    const io = getSocketIO();

    io.to(notificationRoom(userId)).emit(
      "notification:unread-count",
      {
        count,
      }
    );
  } catch (error) {
    console.error(
      "Unable to emit unread count:",
      error
    );
  }
}

/**
 * ---------------------------------------------------------
 * NOTIFICATION RECIPIENT HELPERS
 * ---------------------------------------------------------
 */

/**
 * Find the project manager who owns the project.
 */
export async function getProjectManagerId(
  projectId: string
) {
  const project =
    await prisma.project.findUnique({
      where: {
        id: projectId,
      },

      select: {
        managerId: true,
      },
    });

  if (!project) {
    throw new Error(
      "Project not found"
    );
  }

  return project.managerId;
}

function emitNotificationUpdated(userId: string, notification: unknown) {
  try {
    getSocketIO()
      .to(notificationRoom(userId))
      .emit("notification:updated", notification);
  } catch (error) {
    console.error("Unable to emit notification update:", error);
  }
}

function emitAllNotificationsRead(userId: string) {
  try {
    getSocketIO()
      .to(notificationRoom(userId))
      .emit("notification:all-read");
  } catch (error) {
    console.error("Unable to emit all-read notification:", error);
  }
}
