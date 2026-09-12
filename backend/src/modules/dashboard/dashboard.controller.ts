import { Response } from "express";

import { Role } from "@prisma/client";

import { AuthenticatedRequest } from "../../middleware/auth.middleware";

import {
  getDashboard,
} from "./dashboard.service";

export async function getDashboardController(
  req: AuthenticatedRequest,
  res: Response
) {
  try {
    const user =
      req.user!;

    const dashboard =
      await getDashboard(
        user.userId,
        user.role as Role
      );

    return res.status(200).json({
      success: true,
      message:
        "Dashboard fetched successfully",
      data: dashboard,
    });
  } catch (error) {
    return res.status(400).json({
      success: false,
      message:
        error instanceof Error
          ? error.message
          : "Unable to fetch dashboard",
    });
  }
}