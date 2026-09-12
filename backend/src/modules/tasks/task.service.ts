import {
  ActivityType,
  Role,
  TaskPriority,
  TaskStatus,
} from "@prisma/client";

import { prisma } from "../../config/database";

import {
  CreateTaskInput,
  UpdateTaskInput,
} from "./task.validation";

import {
  createNotification,
  getProjectManagerId,
} from "../notifications/notification.service";

import {
  getSocketIO,
} from "../../websocket/socket.instance";

import {
  ADMIN_ACTIVITY_ROOM,
  projectActivityRoom,
  taskActivityRoom,
} from "../../websocket/socket.rooms";



/**
 * ---------------------------------------------------------
 * VERIFY PROJECT ACCESS
 * ---------------------------------------------------------
 *
 * ADMIN:
 * Can access every project.
 *
 * PROJECT MANAGER:
 * Can access only projects they manage.
 *
 * DEVELOPER:
 * Cannot access project management operations.
 */
export async function verifyProjectAccess(
  projectId: string,
  userId: string,
  role: Role
) {
  const project =
    await prisma.project.findUnique({
      where: {
        id: projectId,
      },
    });

  if (!project) {
    throw new Error(
      "Project not found"
    );
  }

  /**
   * ADMIN can access all projects.
   */
  if (role === Role.ADMIN) {
    return project;
  }

  /**
   * PROJECT MANAGER can access only
   * projects they manage.
   */
  if (
    role === Role.PROJECT_MANAGER &&
    project.managerId === userId
  ) {
    return project;
  }

  throw new Error(
    "You do not have permission to access this project"
  );
}

/**
 * ---------------------------------------------------------
 * VERIFY DEVELOPER
 * ---------------------------------------------------------
 *
 * Makes sure the selected user:
 *
 * 1. Exists
 * 2. Has DEVELOPER role
 */
export async function verifyDeveloper(
  developerId: string
) {
  const developer =
    await prisma.user.findUnique({
      where: {
        id: developerId,
      },
    });

  if (!developer) {
    throw new Error(
      "Developer not found"
    );
  }

  if (
    developer.role !== Role.DEVELOPER
  ) {
    throw new Error(
      "Selected user is not a developer"
    );
  }

  return developer;
}

/**
 * ---------------------------------------------------------
 * CREATE TASK
 * ---------------------------------------------------------
 */
export async function createTask(
  userId: string,
  role: Role,
  input: CreateTaskInput
) {
  /**
   * -------------------------------------------------------
   * VERIFY PROJECT ACCESS
   * -------------------------------------------------------
   */
  await verifyProjectAccess(
    input.projectId,
    userId,
    role
  );

  /**
   * -------------------------------------------------------
   * VERIFY DEVELOPER
   * -------------------------------------------------------
   */
  const developer =
    await verifyDeveloper(
      input.developerId
    );

  /**
   * -------------------------------------------------------
   * CREATE TASK
   * -------------------------------------------------------
   */
  const task =
    await prisma.task.create({
      data: {
        projectId:
          input.projectId,

        title:
          input.title,

        description:
          input.description,

        developerId:
          input.developerId,

        status:
          input.status !== undefined
            ? (input.status as TaskStatus)
            : TaskStatus.TODO,

        priority:
          input.priority !== undefined
            ? (input.priority as TaskPriority)
            : TaskPriority.MEDIUM,

        dueDate:
          new Date(
            input.dueDate
          ),
      },

      include: {
        project: true,

        developer: {
          select: {
            id: true,
            name: true,
            email: true,
            role: true,
          },
        },
      },
    });

  /**
   * -------------------------------------------------------
   * ACTIVITY: TASK CREATED
   * -------------------------------------------------------
   */
  const createdActivity =
    await prisma.activityLog.create({
      data: {
        projectId:
          task.projectId,

        taskId:
          task.id,

        userId,

        type:
          ActivityType.TASK_CREATED,

        message:
          `Task "${task.title}" was created`,
      },

      include: {
        user: {
          select: {
            id: true,
            name: true,
            role: true,
          },
        },
      },
    });

  /**
   * -------------------------------------------------------
   * ACTIVITY: TASK ASSIGNED
   * -------------------------------------------------------
   */
  const assignedActivity =
    await prisma.activityLog.create({
      data: {
        projectId:
          task.projectId,

        taskId:
          task.id,

        userId,

        type:
          ActivityType.TASK_ASSIGNED,

        message:
          `Task "${task.title}" was assigned to ${developer.name}`,
      },

      include: {
        user: {
          select: {
            id: true,
            name: true,
            role: true,
          },
        },
      },
    });

  /**
   * -------------------------------------------------------
   * NOTIFICATION: TASK ASSIGNED
   * -------------------------------------------------------
   *
   * The developer receives a persistent notification.
   *
   * createNotification() also emits:
   *
   * notification:new
   *
   * notification:unread-count
   */
  await createNotification(
    task.developerId,
    "TASK_ASSIGNED",
    `You were assigned task "${task.title}"`
  );

  /**
   * -------------------------------------------------------
   * REAL-TIME ACTIVITY
   * -------------------------------------------------------
   *
   * ADMIN:
   * Global activity feed.
   *
   * PROJECT MANAGER:
   * Project activity feed.
   *
   * DEVELOPER:
   * Assigned task activity.
   */
  try {
    const io =
      getSocketIO();

    const basePayload = {
      task: {
        id:
          task.id,

        title:
          task.title,
      },

      project: {
        id:
          task.project.id,

        name:
          task.project.name,
      },
    };

    /**
     * ADMIN ACTIVITY
     */

    io.to(
      ADMIN_ACTIVITY_ROOM
    ).emit(
      "activity:new",
      {
        ...createdActivity,
        ...basePayload,
      }
    );

    io.to(
      ADMIN_ACTIVITY_ROOM
    ).emit(
      "activity:new",
      {
        ...assignedActivity,
        ...basePayload,
      }
    );

    /**
     * PROJECT MANAGER ACTIVITY
     */

    io.to(
      projectActivityRoom(
        task.projectId
      )
    ).emit(
      "activity:new",
      {
        ...createdActivity,
        ...basePayload,
      }
    );

    io.to(
      projectActivityRoom(
        task.projectId
      )
    ).emit(
      "activity:new",
      {
        ...assignedActivity,
        ...basePayload,
      }
    );

    /**
     * DEVELOPER ACTIVITY
     */

    io.to(
      taskActivityRoom(
        task.id
      )
    ).emit(
      "activity:new",
      {
        ...createdActivity,
        ...basePayload,
      }
    );

    io.to(
      taskActivityRoom(
        task.id
      )
    ).emit(
      "activity:new",
      {
        ...assignedActivity,
        ...basePayload,
      }
    );
  } catch (error) {
    /**
     * Socket failure must not cause
     * task creation to fail.
     */
    console.error(
      "Unable to emit task activity:",
      error
    );
  }

  return task;
}

/**
 * ---------------------------------------------------------
 * GET TASKS
 * ---------------------------------------------------------
 *
 * RBAC:
 *
 * ADMIN
 * -> All tasks
 *
 * PROJECT MANAGER
 * -> Tasks belonging to their projects
 *
 * DEVELOPER
 * -> Only tasks assigned to themselves
 *
 * Filters:
 *
 * ?status=IN_PROGRESS
 * ?priority=HIGH
 * ?dueDateFrom=2026-09-01
 * ?dueDateTo=2026-09-30
 *
 * Filters can therefore be represented
 * in shareable URLs.
 */
export async function getTasks(
  userId: string,
  role: Role,
  filters: {
    status?: TaskStatus;
    priority?: TaskPriority;
    dueDateFrom?: string;
    dueDateTo?: string;
  }
) {
  const where: any = {};

  /**
   * -------------------------------------------------------
   * ROLE FILTER
   * -------------------------------------------------------
   */

  if (
    role === Role.ADMIN
  ) {
    /**
     * Admin sees all tasks.
     */
  } else if (
    role === Role.PROJECT_MANAGER
  ) {
    /**
     * PM sees only tasks from
     * projects they manage.
     */
    where.project = {
      managerId: userId,
    };
  } else if (
    role === Role.DEVELOPER
  ) {
    /**
     * Developer sees ONLY
     * their assigned tasks.
     */
    where.developerId =
      userId;
  } else {
    throw new Error(
      "Invalid user role"
    );
  }

  /**
   * -------------------------------------------------------
   * STATUS FILTER
   * -------------------------------------------------------
   */

  if (filters.status) {
    where.status =
      filters.status;
  }

  /**
   * -------------------------------------------------------
   * PRIORITY FILTER
   * -------------------------------------------------------
   */

  if (filters.priority) {
    where.priority =
      filters.priority;
  }

  /**
   * -------------------------------------------------------
   * DATE FILTER
   * -------------------------------------------------------
   */

  if (
    filters.dueDateFrom ||
    filters.dueDateTo
  ) {
    where.dueDate = {};

    if (
      filters.dueDateFrom
    ) {
      where.dueDate.gte =
        new Date(
          filters.dueDateFrom
        );
    }

    if (
      filters.dueDateTo
    ) {
      where.dueDate.lte =
        new Date(
          filters.dueDateTo
        );
    }
  }

  /**
   * -------------------------------------------------------
   * DATABASE QUERY
   * -------------------------------------------------------
   */

  return prisma.task.findMany({
    where,

    include: {
      project: {
        select: {
          id: true,
          name: true,
          managerId: true,
        },
      },

      developer: {
        select: {
          id: true,
          name: true,
          email: true,
          role: true,
        },
      },
    },

    /**
     * Higher priority first,
     * then nearest due date.
     */
    orderBy: [
      {
        priority: "desc",
      },

      {
        dueDate: "asc",
      },
    ],
  });
}

/**
 * ---------------------------------------------------------
 * GET TASK BY ID
 * ---------------------------------------------------------
 */
export async function getTaskById(
  taskId: string,
  userId: string,
  role: Role
) {
  /**
   * -------------------------------------------------------
   * FIND TASK
   * -------------------------------------------------------
   */

  const task =
    await prisma.task.findUnique({
      where: {
        id: taskId,
      },

      include: {
        project: true,

        developer: {
          select: {
            id: true,
            name: true,
            email: true,
            role: true,
          },
        },

        activityLogs: {
          orderBy: {
            createdAt: "desc",
          },

          /**
           * Last 20 activity logs.
           */
          take: 20,

          include: {
            user: {
              select: {
                id: true,
                name: true,
                role: true,
              },
            },
          },
        },
      },
    });

  if (!task) {
    throw new Error(
      "Task not found"
    );
  }

  /**
   * -------------------------------------------------------
   * RBAC
   * -------------------------------------------------------
   */

  const hasAccess =
    role === Role.ADMIN ||
    (
      role === Role.PROJECT_MANAGER &&
      task.project.managerId ===
        userId
    ) ||
    (
      role === Role.DEVELOPER &&
      task.developerId ===
        userId
    );

  if (!hasAccess) {
    throw new Error(
      "You do not have permission to access this task"
    );
  }

  return task;
}

/**
 * ---------------------------------------------------------
 * UPDATE TASK
 * ---------------------------------------------------------
 */
export async function updateTask(
  taskId: string,
  userId: string,
  role: Role,
  input: UpdateTaskInput
) {
  /**
   * -------------------------------------------------------
   * FIND EXISTING TASK
   * -------------------------------------------------------
   */

  const existingTask =
    await prisma.task.findUnique({
      where: {
        id: taskId,
      },

      include: {
        project: true,
      },
    });

  if (!existingTask) {
    throw new Error(
      "Task not found"
    );
  }

  /**
   * -------------------------------------------------------
   * ACCESS CONTROL
   * -------------------------------------------------------
   */

  const hasAccess =
    role === Role.ADMIN ||
    (
      role === Role.PROJECT_MANAGER &&
      existingTask.project.managerId ===
        userId
    ) ||
    (
      role === Role.DEVELOPER &&
      existingTask.developerId ===
        userId
    );

  if (!hasAccess) {
    throw new Error(
      "You do not have permission to update this task"
    );
  }

  /**
   * -------------------------------------------------------
   * DEVELOPER RESTRICTION
   * -------------------------------------------------------
   *
   * Developers can ONLY change status.
   *
   * They cannot:
   *
   * - change title
   * - change description
   * - change developer
   * - change priority
   * - change due date
   */
  if (
    role === Role.DEVELOPER
  ) {
    const onlyStatusProvided =
      Object.keys(input).every(
        (key) =>
          key === "status"
      );

    if (!onlyStatusProvided) {
      throw new Error(
        "Developers can only update task status"
      );
    }

    if (input.status) {
      return changeTaskStatus(
        taskId,
        userId,
        role,
        input.status as TaskStatus
      );
    }
  }

  /**
   * -------------------------------------------------------
   * VERIFY NEW DEVELOPER
   * -------------------------------------------------------
   */

  if (
    input.developerId
  ) {
    await verifyDeveloper(
      input.developerId
    );
  }

  /**
   * -------------------------------------------------------
   * UPDATE TASK
   * -------------------------------------------------------
   */

  const updatedTask =
    await prisma.task.update({
      where: {
        id: taskId,
      },

      data: {
        ...(input.title !==
          undefined && {
          title:
            input.title,
        }),

        ...(input.description !==
          undefined && {
          description:
            input.description,
        }),

        ...(input.developerId !==
          undefined && {
          developerId:
            input.developerId,
        }),

        ...(input.status !==
          undefined && {
          status:
            input.status as TaskStatus,
        }),

        ...(input.priority !==
          undefined && {
          priority:
            input.priority as TaskPriority,
        }),

        ...(input.dueDate !==
          undefined && {
          dueDate:
            new Date(
              input.dueDate
            ),
        }),
      },

      include: {
        project: true,

        developer: {
          select: {
            id: true,
            name: true,
            email: true,
            role: true,
          },
        },
      },
    });

  if (
    input.developerId !== undefined &&
    input.developerId !== existingTask.developerId
  ) {
    await createNotification(
      updatedTask.developerId,
      "TASK_ASSIGNED",
      `You were assigned task "${updatedTask.title}"`
    );
  }

  /**
   * -------------------------------------------------------
   * ACTIVITY LOG
   * -------------------------------------------------------
   */

  const activity =
    await prisma.activityLog.create({
      data: {
        projectId:
          existingTask.projectId,

        taskId:
          existingTask.id,

        userId,

        type:
          ActivityType.TASK_UPDATED,

        message:
          `Task "${existingTask.title}" was updated`,
      },

      include: {
        user: {
          select: {
            id: true,
            name: true,
            role: true,
          },
        },
      },
    });

  /**
   * -------------------------------------------------------
   * REAL-TIME ACTIVITY
   * -------------------------------------------------------
   */

  try {
    const io =
      getSocketIO();

    const payload = {
      ...activity,

      task: {
        id:
          updatedTask.id,

        title:
          updatedTask.title,
      },

      project: {
        id:
          updatedTask.project.id,

        name:
          updatedTask.project.name,
      },
    };

    /**
     * ADMIN
     */
    io.to(
      ADMIN_ACTIVITY_ROOM
    ).emit(
      "activity:new",
      payload
    );

    /**
     * PROJECT MANAGER
     */
    io.to(
      projectActivityRoom(
        updatedTask.projectId
      )
    ).emit(
      "activity:new",
      payload
    );

    /**
     * DEVELOPER
     */
    io.to(
      taskActivityRoom(
        updatedTask.id
      )
    ).emit(
      "activity:new",
      payload
    );
  } catch (error) {
    console.error(
      "Unable to emit update activity:",
      error
    );
  }

  return updatedTask;
}

/**
 * ---------------------------------------------------------
 * CHANGE TASK STATUS
 * ---------------------------------------------------------
 *
 * This function:
 *
 * 1. Finds task
 * 2. Finds user
 * 3. Checks RBAC
 * 4. Updates task status
 * 5. Creates ActivityLog
 * 6. Notifies PM when status becomes IN_REVIEW
 * 7. Emits Socket.IO activity
 *
 * The task update and activity log are
 * executed inside one transaction.
 */
export async function changeTaskStatus(
  taskId: string,
  userId: string,
  role: Role,
  newStatus: TaskStatus
) {
  /**
   * -------------------------------------------------------
   * FIND TASK
   * -------------------------------------------------------
   */

  const existingTask =
    await prisma.task.findUnique({
      where: {
        id: taskId,
      },

      include: {
        project: true,

        developer: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
    });

  if (!existingTask) {
    throw new Error(
      "Task not found"
    );
  }

  /**
   * -------------------------------------------------------
   * FIND USER
   * -------------------------------------------------------
   */

  const user =
    await prisma.user.findUnique({
      where: {
        id: userId,
      },
    });

  if (!user) {
    throw new Error(
      "User not found"
    );
  }

  /**
   * -------------------------------------------------------
   * RBAC
   * -------------------------------------------------------
   *
   * ADMIN:
   * Can change any task.
   *
   * PROJECT MANAGER:
   * Can change tasks belonging to
   * their own projects.
   *
   * DEVELOPER:
   * Can change only their assigned tasks.
   */
  const hasAccess =
    role === Role.ADMIN ||
    (
      role === Role.PROJECT_MANAGER &&
      existingTask.project.managerId ===
        userId
    ) ||
    (
      role === Role.DEVELOPER &&
      existingTask.developerId ===
        userId
    );

  if (!hasAccess) {
    throw new Error(
      "You do not have permission to change this task"
    );
  }

  /**
   * -------------------------------------------------------
   * NO STATUS CHANGE
   * -------------------------------------------------------
   */

  if (
    existingTask.status ===
    newStatus
  ) {
    return {
      updatedTask:
        existingTask,

      activity:
        null,
    };
  }

  /**
   * -------------------------------------------------------
   * TRANSACTION
   * -------------------------------------------------------
   *
   * Both operations must succeed:
   *
   * 1. Update task
   * 2. Create activity log
   *
   * Otherwise Prisma rolls back the transaction.
   */
  const result =
    await prisma.$transaction(
      async (tx) => {
        /**
         * Update task status.
         */
        const updatedTask =
          await tx.task.update({
            where: {
              id: taskId,
            },

            data: {
              status:
                newStatus,
            },
          });


          

        /**
         * Create activity log.
         */
        const activity =
          await tx.activityLog.create({
            data: {
              projectId:
                existingTask.projectId,

              taskId:
                existingTask.id,

              userId,

              type:
                ActivityType.STATUS_CHANGED,

              oldStatus:
                existingTask.status,

              newStatus,

              message:
                `${user.name} moved "${existingTask.title}" ` +
                `from ${existingTask.status} → ${newStatus}`,
            },

            include: {
              user: {
                select: {
                  id: true,
                  name: true,
                  role: true,
                },
              },
            },
          });

        return {
          updatedTask,
          activity,
        };
      }
    );

  /**
   * -------------------------------------------------------
   * NOTIFY PROJECT MANAGER
   * -------------------------------------------------------
   *
   * Requirement:
   *
   * When a task moves to IN_REVIEW,
   * notify the Project Manager.
   * 
   *
   */

  if (
    newStatus ===
    TaskStatus.IN_REVIEW
  ) {
    /**
     * Find the manager who owns
     * this project.
     */
    const projectManagerId =
      await getProjectManagerId(
        existingTask.projectId
      );

    /**
     * Create persistent notification
     * and emit it through Socket.IO.
     */
    await createNotification(
      projectManagerId,
      "TASK_MOVED_TO_REVIEW",
      `${user.name} moved task "${existingTask.title}" to In Review`
    );
  }

  /**
   * -------------------------------------------------------
   * SOCKET.IO REAL-TIME EVENT
   * -------------------------------------------------------
   */

  try {
    const io =
      getSocketIO();

    const payload = {
      ...result.activity,

      task: {
        id:
          existingTask.id,

        title:
          existingTask.title,
      },

      project: {
        id:
          existingTask.projectId,

        name:
          existingTask.project.name,
      },

      statusChange: {
        oldStatus:
          existingTask.status,

        newStatus,
      },
    };

    /**
     * -----------------------------------------------------
     * ADMIN
     * -----------------------------------------------------
     *
     * Admin receives global activity.
     */
    io.to(
      ADMIN_ACTIVITY_ROOM
    ).emit(
      "activity:new",
      payload
    );

    /**
     * -----------------------------------------------------
     * PROJECT MANAGER
     * -----------------------------------------------------
     *
     * PM receives activity for
     * projects they manage.
     */
    io.to(
      projectActivityRoom(
        existingTask.projectId
      )
    ).emit(
      "activity:new",
      payload
    );

    /**
     * -----------------------------------------------------
     * DEVELOPER
     * -----------------------------------------------------
     *
     * Developer receives activity
     * only for the assigned task.
     */
    io.to(
      taskActivityRoom(
        existingTask.id
      )
    ).emit(
      "activity:new",
      payload
    );
  } catch (error) {
    /**
     * Socket failure should not undo
     * the successful database transaction.
     */
    console.error(
      "Unable to emit status activity:",
      error
    );
  }

  return result;
}
