import { Response } from "express";

import {
  Role,
  TaskPriority,
  TaskStatus,
} from "@prisma/client";

import {
  AuthenticatedRequest,
} from "../../middleware/auth.middleware";

import {
  createTask,
  getTasks,
  getTaskById,
  updateTask,
  changeTaskStatus,
} from "./task.service";

function getRouteParamId(
  value: string | string[] | undefined
): string | undefined {
  if (typeof value === "string") return value;
  if (Array.isArray(value)) return value[0];
  return undefined;
}

/**
 * ---------------------------------------------------------
 * CREATE TASK
 * ---------------------------------------------------------
 */
export async function createTaskController(
  req: AuthenticatedRequest,
  res: Response
) {
  try {
    const user = req.user!;

    const task = await createTask(
      user.userId,
      user.role as Role,
      req.body
    );

    return res.status(201).json({
      success: true,
      message: "Task created successfully",
      data: task,
    });
  } catch (error) {
    return res.status(400).json({
      success: false,
      message:
        error instanceof Error
          ? error.message
          : "Unable to create task",
    });
  }
}

/**
 * ---------------------------------------------------------
 * GET TASKS
 * ---------------------------------------------------------
 *
 * Supports:
 *
 * GET /api/tasks
 *
 * GET /api/tasks?status=IN_PROGRESS
 *
 * GET /api/tasks?priority=HIGH
 *
 * GET /api/tasks?dueDateFrom=2026-09-01T00:00:00.000Z
 *
 * GET /api/tasks?dueDateTo=2026-09-30T23:59:59.999Z
 *
 * Multiple filters can be combined.
 */
export async function getTasksController(
  req: AuthenticatedRequest,
  res: Response
) {
  try {
    const user = req.user!;

    const status =
      typeof req.query.status === "string"
        ? (req.query.status as TaskStatus)
        : undefined;

    const priority =
      typeof req.query.priority === "string"
        ? (req.query.priority as TaskPriority)
        : undefined;

    const dueDateFrom =
      typeof req.query.dueDateFrom === "string"
        ? req.query.dueDateFrom
        : undefined;

    const dueDateTo =
      typeof req.query.dueDateTo === "string"
        ? req.query.dueDateTo
        : undefined;

    const tasks = await getTasks(
      user.userId,
      user.role as Role,
      {
        status,
        priority,
        dueDateFrom,
        dueDateTo,
      }
    );

    return res.status(200).json({
      success: true,
      message: "Tasks fetched successfully",
      data: tasks,
    });
  } catch (error) {
    return res.status(400).json({
      success: false,
      message:
        error instanceof Error
          ? error.message
          : "Unable to fetch tasks",
    });
  }
}

/**
 * ---------------------------------------------------------
 * GET SINGLE TASK
 * ---------------------------------------------------------
 */
export async function getTaskByIdController(
  req: AuthenticatedRequest,
  res: Response
) {
  try {
    const user = req.user!;
    const taskId = getRouteParamId(req.params.id);

    if (!taskId) {
      return res.status(400).json({
        success: false,
        message: "Task id is required",
      });
    }

    const task = await getTaskById(
      taskId,
      user.userId,
      user.role as Role
    );

    return res.status(200).json({
      success: true,
      message: "Task fetched successfully",
      data: task,
    });
  } catch (error) {
    return res.status(403).json({
      success: false,
      message:
        error instanceof Error
          ? error.message
          : "Unable to fetch task",
    });
  }
}

/**
 * ---------------------------------------------------------
 * UPDATE TASK
 * ---------------------------------------------------------
 */
export async function updateTaskController(
  req: AuthenticatedRequest,
  res: Response
) {
  try {
    const user = req.user!;
    const taskId = getRouteParamId(req.params.id);

    if (!taskId) {
      return res.status(400).json({
        success: false,
        message: "Task id is required",
      });
    }

    const task = await updateTask(
      taskId,
      user.userId,
      user.role as Role,
      req.body
    );

    return res.status(200).json({
      success: true,
      message: "Task updated successfully",
      data: task,
    });
  } catch (error) {
    return res.status(403).json({
      success: false,
      message:
        error instanceof Error
          ? error.message
          : "Unable to update task",
    });
  }
}

/**
 * ---------------------------------------------------------
 * CHANGE TASK STATUS
 * ---------------------------------------------------------
 *
 * Dedicated endpoint:
 *
 * PATCH /api/tasks/:id/status
 *
 * Body:
 *
 * {
 *   "status": "IN_REVIEW"
 * }
 */
export async function changeTaskStatusController(
  req: AuthenticatedRequest,
  res: Response
) {
  try {
    const user = req.user!;
    const taskId = getRouteParamId(req.params.id);

    if (!taskId) {
      return res.status(400).json({
        success: false,
        message: "Task id is required",
      });
    }

    const result =
      await changeTaskStatus(
        taskId,
        user.userId,
        user.role as Role,
        req.body.status as TaskStatus
      );

    return res.status(200).json({
      success: true,
      message:
        "Task status updated successfully",
      data: result,
    });
  } catch (error) {
    return res.status(403).json({
      success: false,
      message:
        error instanceof Error
          ? error.message
          : "Unable to change task status",
    });
  }
}