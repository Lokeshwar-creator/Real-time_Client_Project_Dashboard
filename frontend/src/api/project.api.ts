import api from "./axios";

export interface Project {
  id: string;
  name: string;
  description?: string;
  clientId: string;
  managerId: string;
  createdAt: string;
  updatedAt: string;

  client: {
    id: string;
    name: string;
    email?: string;
  };

  manager: {
    id: string;
    name: string;
    email: string;
  };

  _count?: {
    tasks: number;
  };
}

export interface Client {
  id: string;
  name: string;
  email?: string;
}

export async function getProjects() {
  const response = await api.get("/projects");

  return response.data.data;
}

export async function getClients() {
  const response = await api.get("/projects/clients");

  return response.data.data;
}

export async function createProject(data: {
  name: string;
  description?: string;
  clientId: string;
  managerId?: string;
}) {
  const response = await api.post(
    "/projects",
    data
  );

  return response.data.data;
}

export async function deleteProject(
  projectId: string
) {
  const response = await api.delete(
    `/projects/${projectId}`
  );

  return response.data.data;
}