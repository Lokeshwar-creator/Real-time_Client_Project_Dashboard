import { NextFunction, Response } from "express";
import { Role } from "@prisma/client";
import { AuthenticatedRequest } from "./auth.middleware";

export function requireRoles(...allowedRoles: Role[]) {
  return (
    req: AuthenticatedRequest,
    res: Response,
    next: NextFunction
  ) => {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: "Authentication required",
      });
    }

    const userRole = req.user.role as Role;

    if (!allowedRoles.includes(userRole)) {
      return res.status(403).json({
        success: false,
        message: "You do not have permission to perform this action",
      });
    }

    next();
  };
}