export type Role =
  | "ADMIN"
  | "PROJECT_MANAGER"
  | "DEVELOPER";

export type TaskStatus =
  | "TODO"
  | "IN_PROGRESS"
  | "IN_REVIEW"
  | "DONE";

export type TaskPriority =
  | "LOW"
  | "MEDIUM"
  | "HIGH"
  | "CRITICAL";

export interface User {
  id: string;
  name: string;
  email: string;
  role: Role;
}

export interface Task {
  id: string;
  title: string;
  description?: string;
  status: TaskStatus;
  priority: TaskPriority;
  dueDate: string;
  isOverdue: boolean;

  project: {
    id: string;
    name: string;
  };

  developer?: {
    id: string;
    name: string;
    email: string;
    role: Role;
  };
}

export interface Activity {
  id: string;
  type: string;
  message: string;
  createdAt: string;

  user: {
    id: string;
    name: string;
    role: Role;
  };

  task?: {
    id: string;
    title: string;
  };

  project?: {
    id: string;
    name: string;
  };

  oldStatus?: TaskStatus;
  newStatus?: TaskStatus;
}

export interface Notification {
  id: string;
  type:
    | "TASK_ASSIGNED"
    | "TASK_MOVED_TO_REVIEW";
  message: string;
  isRead: boolean;
  createdAt: string;
}