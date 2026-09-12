import {
  Role,
  TaskStatus,
  TaskPriority,
} from "@prisma/client";

import { prisma } from "../../config/database";
import { getOnlineUserCount } from "../../websocket/presence.store";

export async function getAdminDashboard() {
  const [
    totalProjects,
    totalTasks,
    overdueTasks,
    tasksByStatus,
    activeUsers,
  ] = await Promise.all([
    prisma.project.count(),

    prisma.task.count(),

    prisma.task.count({
      where: {
        isOverdue: true,
        status: {
          not: TaskStatus.DONE,
        },
      },
    }),

    prisma.task.groupBy({
      by: ["status"],
      _count: {
        id: true,
      },
    }),

    Promise.resolve(getOnlineUserCount()),
  ]);

  return {
    totalProjects,
    totalTasks,
    overdueTasks,

    tasksByStatus: tasksByStatus.map(
      (item) => ({
        status: item.status,
        count: item._count.id,
      })
    ),

    activeUsers,
  };
}

export async function getProjectManagerDashboard(
  userId: string
) {
  const now = new Date();

  const endOfWeek =
    new Date(now);

  endOfWeek.setDate(
    now.getDate() +
      (7 - now.getDay())
  );

  endOfWeek.setHours(
    23,
    59,
    59,
    999
  );

  const [
    projects,
    tasksByPriority,
    tasksDueThisWeek,
  ] = await Promise.all([
    prisma.project.count({
      where: {
        managerId: userId,
      },
    }),

    prisma.task.groupBy({
      by: ["priority"],
      where: {
        project: {
          managerId: userId,
        },
      },

      _count: {
        id: true,
      },
    }),

    prisma.task.findMany({
      where: {
        project: {
          managerId: userId,
        },

        dueDate: {
          gte: now,
          lte: endOfWeek,
        },

        status: {
          not: TaskStatus.DONE,
        },
      },

      include: {
        project: {
          select: {
            id: true,
            name: true,
          },
        },

        developer: {
          select: {
            id: true,
            name: true,
          },
        },
      },

      orderBy: {
        dueDate: "asc",
      },
    }),
  ]);

  return {
    projects,

    tasksByPriority:
      tasksByPriority.map(
        (item) => ({
          priority:
            item.priority,
          count:
            item._count.id,
        })
      ),

    tasksDueThisWeek,
  };
}

export async function getDeveloperDashboard(
  userId: string
) {
  const tasks =
    await prisma.task.findMany({
      where: {
        developerId: userId,
      },

      include: {
        project: {
          select: {
            id: true,
            name: true,
          },
        },
      },

      orderBy: [
        {
          priority: "desc",
        },

        {
          dueDate: "asc",
        },
      ],
    });

  const summary = {
    total: tasks.length,

    todo: tasks.filter(
      (task) =>
        task.status ===
        TaskStatus.TODO
    ).length,

    inProgress: tasks.filter(
      (task) =>
        task.status ===
        TaskStatus.IN_PROGRESS
    ).length,

    inReview: tasks.filter(
      (task) =>
        task.status ===
        TaskStatus.IN_REVIEW
    ).length,

    done: tasks.filter(
      (task) =>
        task.status ===
        TaskStatus.DONE
    ).length,

    overdue: tasks.filter(
      (task) =>
        task.isOverdue
    ).length,
  };

  return {
    summary,
    tasks,
  };
}

export async function getDashboard(
  userId: string,
  role: Role
) {
  switch (role) {
    case Role.ADMIN:
      return getAdminDashboard();

    case Role.PROJECT_MANAGER:
      return getProjectManagerDashboard(
        userId
      );

    case Role.DEVELOPER:
      return getDeveloperDashboard(
        userId
      );

    default:
      throw new Error(
        "Invalid user role"
      );
  }
}
