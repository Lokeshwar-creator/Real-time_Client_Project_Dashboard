import cron from "node-cron";

import {
  ActivityType,
  TaskStatus,
} from "@prisma/client";

import { prisma } from "../config/database";

import {
  getSocketIO,
} from "../websocket/socket.instance";

import {
  ADMIN_ACTIVITY_ROOM,
  projectActivityRoom,
  taskActivityRoom,
} from "../websocket/socket.rooms";

/**
 * ---------------------------------------------------------
 * RUN OVERDUE TASK CHECK
 * ---------------------------------------------------------
 *
 * Finds tasks that:
 *
 * 1. Are past their due date
 * 2. Are not DONE
 * 3. Have not already been marked overdue
 *
 * The isOverdue flag prevents duplicate
 * processing on every scheduler run.
 */
export async function markOverdueTasks() {
  const now = new Date();

  /**
   * -------------------------------------------------------
   * FIND OVERDUE TASKS
   * -------------------------------------------------------
   */

  const overdueTasks =
    await prisma.task.findMany({
      where: {
        dueDate: {
          lt: now,
        },

        status: {
          not: TaskStatus.DONE,
        },

        isOverdue: false,
      },

      include: {
        project: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    });

  /**
   * Nothing to process.
   */
  if (overdueTasks.length === 0) {
    return;
  }

  console.log(
    `Found ${overdueTasks.length} overdue task(s)`
  );

  /**
   * -------------------------------------------------------
   * PROCESS EACH TASK
   * -------------------------------------------------------
   */

  for (const task of overdueTasks) {
    try {
      /**
       * ---------------------------------------------------
       * DATABASE TRANSACTION
       * ---------------------------------------------------
       *
       * Both operations must succeed:
       *
       * 1. Mark task overdue
       * 2. Create activity log
       */
      const result =
        await prisma.$transaction(
          async (tx) => {
            /**
             * Mark task as overdue.
             *
             * The extra isOverdue:false condition
             * protects against duplicate processing
             * if multiple scheduler executions overlap.
             */
            const updatedTask =
              await tx.task.updateMany({
                where: {
                  id: task.id,

                  isOverdue: false,

                  status: {
                    not: TaskStatus.DONE,
                  },

                  dueDate: {
                    lt: now,
                  },
                },

                data: {
                  isOverdue: true,
                },
              });

            /**
             * Another process may have already
             * marked this task overdue.
             */
            if (
              updatedTask.count === 0
            ) {
              return null;
            }

            /**
             * Create persistent activity log.
             *
             * Scheduler does not have a logged-in user,
             * so we use the task's developer as the
             * activity user.
             *
             * This keeps the existing ActivityLog schema
             * valid because userId is required.
             */
            const activity =
              await tx.activityLog.create({
                data: {
                  projectId:
                    task.projectId,

                  taskId:
                    task.id,

                  userId:
                    task.developerId,

                  type:
                    ActivityType.TASK_UPDATED,

                  message:
                    `Task "${task.title}" is overdue`,
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
              activity,
            };
          }
        );

      /**
       * If another scheduler execution
       * already processed this task,
       * don't emit another event.
       */
      if (!result) {
        continue;
      }

      /**
       * ---------------------------------------------------
       * REAL-TIME SOCKET.IO EVENT
       * ---------------------------------------------------
       */

      try {
        const io =
          getSocketIO();

        const payload = {
          ...result.activity,

          task: {
            id:
              task.id,

            title:
              task.title,

            isOverdue:
              true,
          },

          project: {
            id:
              task.project.id,

            name:
              task.project.name,
          },
        };

        /**
         * ADMIN
         *
         * Global activity feed.
         */
        io.to(
          ADMIN_ACTIVITY_ROOM
        ).emit(
          "activity:new",
          payload
        );

        /**
         * PROJECT MANAGER
         *
         * Project activity feed.
         */
        io.to(
          projectActivityRoom(
            task.projectId
          )
        ).emit(
          "activity:new",
          payload
        );

        /**
         * DEVELOPER
         *
         * Only the developer assigned
         * to this task receives the task room.
         */
        io.to(
          taskActivityRoom(
            task.id
          )
        ).emit(
          "activity:new",
          payload
        );
      } catch (error) {
        /**
         * Socket failure should not undo
         * the successful DB transaction.
         */
        console.error(
          `Unable to emit overdue activity for task ${task.id}:`,
          error
        );
      }

      console.log(
        `Task marked overdue: ${task.title}`
      );
    } catch (error) {
      /**
       * One failed task should not stop
       * the scheduler from processing
       * other overdue tasks.
       */
      console.error(
        `Unable to process overdue task ${task.id}:`,
        error
      );
    }
  }
}

/**
 * ---------------------------------------------------------
 * START OVERDUE TASK SCHEDULER
 * ---------------------------------------------------------
 *
 * Runs every minute.
 *
 * Cron expression:
 *
 * * * * *
 * │ │ │ │ │
 * │ │ │ │ └── Day of week
 * │ │ │ └──── Month
 * │ │ └────── Day of month
 * │ └──────── Hour
 * └────────── Minute
 *
 * Therefore:
 *
 * * * * *
 *
 * means every minute.
 */
export function startOverdueTaskScheduler() {
  cron.schedule(
    "* * * * *",
    async () => {
      console.log(
        "Running overdue task scheduler..."
      );

      await markOverdueTasks();
    }
  );

  console.log(
    "Overdue task scheduler started"
  );
}