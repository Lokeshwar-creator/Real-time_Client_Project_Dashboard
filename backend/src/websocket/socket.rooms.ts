import { Role } from "@prisma/client";

import { prisma } from "../config/database";

import { SocketUser } from "./socket.auth";


export function notificationRoom(userId: string) {
  return `notification:user:${userId}`;
}

/**
 * ---------------------------------------------------------
 * ROOM NAMES
 * ---------------------------------------------------------
 */

export const ADMIN_ACTIVITY_ROOM =
  "activity:admin";

export const PRESENCE_ROOM =
  "presence";

export function projectActivityRoom(
  projectId: string
) {
  return `activity:project:${projectId}`;
}

export function taskActivityRoom(
  taskId: string
) {
  return `activity:task:${taskId}`;
}

/**
 * ---------------------------------------------------------
 * JOIN AUTHORIZED ROOMS
 * ---------------------------------------------------------
 *
 * ADMIN:
 *   Global activity room
 *
 * PROJECT_MANAGER:
 *   Only projects managed by that PM
 *
 * DEVELOPER:
 *   Only tasks assigned to that developer
 */
export async function joinAuthorizedRooms(
  socket: any,
  user: SocketUser
) {
  /**
   * -------------------------------------------------------
   * ADMIN
   * -------------------------------------------------------
   */

  if (user.role === Role.ADMIN) {
    await socket.join(
      ADMIN_ACTIVITY_ROOM
    );

    return;
  }

  /**
   * -------------------------------------------------------
   * PROJECT MANAGER
   * -------------------------------------------------------
   */

  if (
    user.role === Role.PROJECT_MANAGER
  ) {
    const projects =
      await prisma.project.findMany({
        where: {
          managerId: user.userId,
        },

        select: {
          id: true,
        },
      });

    for (const project of projects) {
      await socket.join(
        projectActivityRoom(project.id)
      );
    }

    return;
  }

  /**
   * -------------------------------------------------------
   * DEVELOPER
   * -------------------------------------------------------
   */

  if (user.role === Role.DEVELOPER) {
    const tasks =
      await prisma.task.findMany({
        where: {
          developerId: user.userId,
        },

        select: {
          id: true,
        },
      });

    for (const task of tasks) {
      await socket.join(
        taskActivityRoom(task.id)
      );
    }
  }
}