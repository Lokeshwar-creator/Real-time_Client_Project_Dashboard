import { z } from "zod";

export const createTaskSchema = z.object({
  projectId: z.string().uuid("Invalid project ID"),

  title: z
    .string()
    .min(2, "Task title must be at least 2 characters")
    .max(200, "Task title cannot exceed 200 characters"),

  description: z
    .string()
    .max(2000, "Task description cannot exceed 2000 characters")
    .optional(),

  developerId: z.string().uuid("Invalid developer ID"),

  status: z
    .enum(["TODO", "IN_PROGRESS", "IN_REVIEW", "DONE"])
    .optional(),

  priority: z
    .enum(["LOW", "MEDIUM", "HIGH", "CRITICAL"])
    .optional(),

  dueDate: z.string().datetime("Invalid due date"),
});

export const updateTaskSchema = z.object({
  title: z
    .string()
    .min(2, "Task title must be at least 2 characters")
    .max(200, "Task title cannot exceed 200 characters")
    .optional(),

  description: z
    .string()
    .max(2000, "Task description cannot exceed 2000 characters")
    .optional(),

  developerId: z
    .string()
    .uuid("Invalid developer ID")
    .optional(),

  status: z
    .enum(["TODO", "IN_PROGRESS", "IN_REVIEW", "DONE"])
    .optional(),

  priority: z
    .enum(["LOW", "MEDIUM", "HIGH", "CRITICAL"])
    .optional(),

  dueDate: z
    .string()
    .datetime("Invalid due date")
    .optional(),
});

export const changeTaskStatusSchema = z.object({
  status: z.enum(
    ["TODO", "IN_PROGRESS", "IN_REVIEW", "DONE"],
    {
      message: "Invalid task status",
    }
  ),
});

export type CreateTaskInput = z.infer<typeof createTaskSchema>;
export type UpdateTaskInput = z.infer<typeof updateTaskSchema>;
export type ChangeTaskStatusInput = z.infer<
  typeof changeTaskStatusSchema
>;