import { Role } from "@prisma/client";
import { prisma } from "../../config/database";

interface CreateProjectInput {
  name: string;
  description?: string;
  clientId: string;
}

interface UpdateProjectInput {
  name?: string;
  description?: string;
  clientId?: string;
}

export async function getClients() {
  return prisma.client.findMany({
    orderBy: {
      name: "asc",
    },
  });
}

export interface ProjectManager {
  id: string;
  name: string;
  email: string;
}

export async function createProject(
  userId: string,
  role: Role,
  input: CreateProjectInput
) {
  if (
    role !== Role.ADMIN &&
    role !== Role.PROJECT_MANAGER
  ) {
    throw new Error("You are not allowed to create projects");
  }

  const client = await prisma.client.findUnique({
    where: {
      id: input.clientId,
    },
  });

  if (!client) {
    throw new Error("Client not found");
  }

  const project = await prisma.project.create({
    data: {
      name: input.name,
      description: input.description,
      clientId: input.clientId,

      // Admin can create a project.
      // For simplicity, admin-created projects are
      // assigned to the authenticated admin.
      managerId: userId,
    },

    include: {
      client: true,
      manager: {
        select: {
          id: true,
          name: true,
          email: true,
          role: true,
        },
      },
    },
  });

  return project;
}

export async function getProjects(
  userId: string,
  role: Role
) {
  if (role === Role.ADMIN) {
    return prisma.project.findMany({
      include: {
        client: true,
        manager: {
          select: {
            id: true,
            name: true,
            email: true,
            role: true,
          },
        },
        _count: {
          select: {
            tasks: true,
          },
        },
      },
      orderBy: {
        createdAt: "desc",
      },
    });
  }

  if (role === Role.PROJECT_MANAGER) {
    return prisma.project.findMany({
      where: {
        managerId: userId,
      },
      include: {
        client: true,
        manager: {
          select: {
            id: true,
            name: true,
            email: true,
            role: true,
          },
        },
        _count: {
          select: {
            tasks: true,
          },
        },
      },
      orderBy: {
        createdAt: "desc",
      },
    });
  }

  return [];
}

export async function getProjectById(
  projectId: string,
  userId: string,
  role: Role
) {
  const project = await prisma.project.findUnique({
    where: {
      id: projectId,
    },
    include: {
      client: true,
      manager: {
        select: {
          id: true,
          name: true,
          email: true,
          role: true,
        },
      },
      tasks: {
        include: {
          developer: {
            select: {
              id: true,
              name: true,
              email: true,
              role: true,
            },
          },
        },
        orderBy: {
          dueDate: "asc",
        },
      },
    },
  });

  if (!project) {
    throw new Error("Project not found");
  }

  // Admin can access every project.
  if (role === Role.ADMIN) {
    return project;
  }

  // PM can access only projects they manage.
  if (
    role === Role.PROJECT_MANAGER &&
    project.managerId === userId
  ) {
    return project;
  }

  // Developer is NOT allowed to browse projects.
  throw new Error("You do not have access to this project");
}

export async function updateProject(
  projectId: string,
  userId: string,
  role: Role,
  input: UpdateProjectInput
) {
  const project = await prisma.project.findUnique({
    where: {
      id: projectId,
    },
  });

  if (!project) {
    throw new Error("Project not found");
  }

  if (
    role !== Role.ADMIN &&
    !(
      role === Role.PROJECT_MANAGER &&
      project.managerId === userId
    )
  ) {
    throw new Error("You do not have permission to update this project");
  }

  if (input.clientId) {
    const client = await prisma.client.findUnique({
      where: {
        id: input.clientId,
      },
    });

    if (!client) {
      throw new Error("Client not found");
    }
  }

  return prisma.project.update({
    where: {
      id: projectId,
    },
    data: input,
    include: {
      client: true,
      manager: {
        select: {
          id: true,
          name: true,
          email: true,
          role: true,
        },
      },
    },
  });
}

export async function getProjectManagers() {
  return prisma.user.findMany({
    where: {
      role: "PROJECT_MANAGER",
    },
    select: {
      id: true,
      name: true,
      email: true,
    },
    orderBy: {
      name: "asc",
    },
  });
}