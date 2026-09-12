import api from "./axios";

import type {
  TaskStatus,
  TaskPriority,
} from "../types";

export interface TaskFilters {
  status?: TaskStatus;
  priority?: TaskPriority;
  dueDateFrom?: string;
  dueDateTo?: string;
}

export async function getTasks(
  filters: TaskFilters = {}
) {
  const params =
    new URLSearchParams();

  if (filters.status) {
    params.set(
      "status",
      filters.status
    );
  }

  if (filters.priority) {
    params.set(
      "priority",
      filters.priority
    );
  }

  if (filters.dueDateFrom) {
    params.set(
      "dueDateFrom",
      filters.dueDateFrom
    );
  }

  if (filters.dueDateTo) {
    params.set(
      "dueDateTo",
      filters.dueDateTo
    );
  }

  const response =
    await api.get(
      `/tasks?${params.toString()}`
    );

  return response.data.data;
}

export async function updateTaskStatus(
  taskId: string,
  status: TaskStatus
) {
  const response =
    await api.patch(
      `/tasks/${taskId}/status`,
      {
        status,
      }
    );

  return response.data.data;
}