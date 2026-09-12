import { z } from "zod";

export const createProjectSchema = z.object({
  name: z
    .string()
    .min(2, "Project name must be at least 2 characters")
    .max(150),

  description: z
    .string()
    .max(1000)
    .optional(),

  clientId: z
    .string()
    .uuid("Invalid client ID"),
});

export const updateProjectSchema = z.object({
  name: z
    .string()
    .min(2)
    .max(150)
    .optional(),

  description: z
    .string()
    .max(1000)
    .optional(),

  clientId: z
    .string()
    .uuid()
    .optional(),
});