import { Response } from "express";
import { Role } from "@prisma/client";

import { AuthenticatedRequest } from "../../middleware/auth.middleware";
import {
  createProject,
  getProjects,
  getProjectById,
  updateProject,
} from "./project.service";
import { getClients } from "./project.service";


export async function getClientsController(
  _req: AuthenticatedRequest,
  res: Response
) {
  try {
    const clients = await getClients();

    return res.status(200).json({
      success: true,
      message: "Clients fetched successfully",
      data: clients,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message:
        error instanceof Error
          ? error.message
          : "Unable to fetch clients",
    });
  }
}

export async function createProjectController(
  req: AuthenticatedRequest,
  res: Response
) {
  try {
    const user = req.user!;

    const project = await createProject(
      user.userId,
      user.role as Role,
      req.body
    );

    return res.status(201).json({
      success: true,
      message: "Project created successfully",
      data: project,
    });
  } catch (error) {
    return res.status(400).json({
      success: false,
      message:
        error instanceof Error
          ? error.message
          : "Failed to create project",
    });
  }
}

export async function getProjectsController(
  req: AuthenticatedRequest,
  res: Response
) {
  try {
    const user = req.user!;

    const projects = await getProjects(
      user.userId,
      user.role as Role
    );

    return res.status(200).json({
      success: true,
      data: projects,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Failed to fetch projects",
    });
  }
}

export async function getProjectByIdController(
  req: AuthenticatedRequest,
  res: Response
) {
  try {
    const user = req.user!;

    const project = await getProjectById(
      req.params.id as string,
      user.userId,
      user.role as Role
    );

    return res.status(200).json({
      success: true,
      data: project,
    });
  } catch (error) {
    return res.status(403).json({
      success: false,
      message:
        error instanceof Error
          ? error.message
          : "Unable to access project",
    });
  }
}

export async function updateProjectController(
  req: AuthenticatedRequest,
  res: Response
) {
  try {
    const user = req.user!;

    const project = await updateProject(
      req.params.id as string,
      user.userId,
      user.role as Role,
      req.body
    );

    return res.status(200).json({
      success: true,
      message: "Project updated successfully",
      data: project,
    });
  } catch (error) {
    return res.status(403).json({
      success: false,
      message:
        error instanceof Error
          ? error.message
          : "Unable to update project",
    });
  }
}