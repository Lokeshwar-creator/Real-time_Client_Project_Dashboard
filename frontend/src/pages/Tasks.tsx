import {
  useEffect,
  useState,
} from "react";

import {
  useSearchParams,
} from "react-router-dom";

import {
  getTasks,
  updateTaskStatus,
} from "../api/task.api";

import {
  useAuth,
} from "../context/AuthContext";

import type {
  TaskStatus,
} from "../types";

import type {
  TaskPriority,
  Task,
} from "../types";

/**
 * =========================================================
 * TASKS PAGE
 * =========================================================
 */

export default function Tasks() {
  const {
    user,
  } = useAuth();

  /**
   * URL query parameters are used for filters.
   *
   * Example:
   *
   * /tasks?status=IN_PROGRESS&priority=HIGH
   *
   * This makes filters shareable.
   */
  const [
    searchParams,
    setSearchParams,
  ] = useSearchParams();

  const [
    tasks,
    setTasks,
  ] = useState<Task[]>([]);

  const [
    loading,
    setLoading,
  ] = useState(true);

  const [
    error,
    setError,
  ] = useState("");

  const [
    updatingTaskId,
    setUpdatingTaskId,
  ] = useState<
    string | null
  >(null);

  /**
   * -------------------------------------------------------
   * FILTER VALUES
   * -------------------------------------------------------
   */

  const status =
    searchParams.get(
      "status"
    ) || "";

  const priority =
    searchParams.get(
      "priority"
    ) || "";

  const dueDateFrom =
    searchParams.get(
      "dueDateFrom"
    ) || "";

  const dueDateTo =
    searchParams.get(
      "dueDateTo"
    ) || "";

  /**
   * -------------------------------------------------------
   * LOAD TASKS
   * -------------------------------------------------------
   */

  useEffect(() => {
    loadTasks();
  }, [
    status,
    priority,
    dueDateFrom,
    dueDateTo,
  ]);

  async function loadTasks() {
    try {
      setLoading(true);

      setError("");

      const result =
        await getTasks({
          status:
            status
              ? status as TaskStatus
              : undefined,

          priority:
            priority
              ? priority as TaskPriority
              : undefined,

          dueDateFrom:
            dueDateFrom ||
            undefined,

          dueDateTo:
            dueDateTo ||
            undefined,
        });

      setTasks(result);
    } catch (error: any) {
      console.error(
        "Unable to load tasks:",
        error
      );

      setError(
        error?.response?.data
          ?.message ||
          "Unable to load tasks"
      );
    } finally {
      setLoading(false);
    }
  }

  /**
   * -------------------------------------------------------
   * FILTER UPDATE
   * -------------------------------------------------------
   */

  function updateFilter(
    key: string,
    value: string
  ) {
    const params =
      new URLSearchParams(
        searchParams
      );

    if (value) {
      params.set(
        key,
        value
      );
    } else {
      params.delete(
        key
      );
    }

    setSearchParams(
      params
    );
  }

  /**
   * -------------------------------------------------------
   * CLEAR FILTERS
   * -------------------------------------------------------
   */

  function clearFilters() {
    setSearchParams({});
  }

  /**
   * -------------------------------------------------------
   * STATUS UPDATE
   * -------------------------------------------------------
   */

  async function handleStatusChange(
    taskId: string,
    newStatus: TaskStatus
  ) {
    try {
      setUpdatingTaskId(
        taskId
      );

      await updateTaskStatus(
        taskId,
        newStatus
      );

      /**
       * Reload tasks so the UI
       * reflects the database state.
       */
      await loadTasks();
    } catch (error: any) {
      alert(
        error?.response?.data
          ?.message ||
          "Unable to update task status"
      );
    } finally {
      setUpdatingTaskId(
        null
      );
    }
  }

  return (
    <div className="tasks-page">

      {/* =================================================
          HEADER
          ================================================= */}

      <div className="page-heading">

        <div>
          <h2>
            Tasks
          </h2>

          <p>
            {getRoleDescription(
              user?.role
            )}
          </p>
        </div>

        <div className="task-count">
          {tasks.length} task
          {tasks.length !== 1
            ? "s"
            : ""}
        </div>

      </div>

      {/* =================================================
          FILTERS
          ================================================= */}

      <section className="filter-card">

        <div className="filter-header">

          <div>
            <h3>
              Filters
            </h3>

            <span>
              Filter tasks using URL parameters
            </span>
          </div>

          {(status ||
            priority ||
            dueDateFrom ||
            dueDateTo) && (
            <button
              className="clear-filter-button"
              onClick={
                clearFilters
              }
            >
              Clear Filters
            </button>
          )}

        </div>

        <div className="filter-grid">

          {/* STATUS */}

          <div className="filter-field">

            <label>
              Status
            </label>

            <select
              value={status}
              onChange={(event) =>
                updateFilter(
                  "status",
                  event.target.value
                )
              }
            >
              <option value="">
                All Statuses
              </option>

              <option value="TODO">
                To Do
              </option>

              <option value="IN_PROGRESS">
                In Progress
              </option>

              <option value="IN_REVIEW">
                In Review
              </option>

              <option value="DONE">
                Done
              </option>

            </select>

          </div>

          {/* PRIORITY */}

          <div className="filter-field">

            <label>
              Priority
            </label>

            <select
              value={priority}
              onChange={(event) =>
                updateFilter(
                  "priority",
                  event.target.value
                )
              }
            >
              <option value="">
                All Priorities
              </option>

              <option value="LOW">
                Low
              </option>

              <option value="MEDIUM">
                Medium
              </option>

              <option value="HIGH">
                High
              </option>

              <option value="CRITICAL">
                Critical
              </option>

            </select>

          </div>

          {/* FROM */}

          <div className="filter-field">

            <label>
              Due From
            </label>

            <input
              type="date"
              value={
                dueDateFrom
              }
              onChange={(event) =>
                updateFilter(
                  "dueDateFrom",
                  event.target.value
                )
              }
            />

          </div>

          {/* TO */}

          <div className="filter-field">

            <label>
              Due To
            </label>

            <input
              type="date"
              value={
                dueDateTo
              }
              onChange={(event) =>
                updateFilter(
                  "dueDateTo",
                  event.target.value
                )
              }
            />

          </div>

        </div>

      </section>

      {/* =================================================
          ERROR
          ================================================= */}

      {error && (
        <div className="error-state">
          <h3>
            Unable to load tasks
          </h3>

          <p>
            {error}
          </p>

          <button
            onClick={
              loadTasks
            }
          >
            Try Again
          </button>
        </div>
      )}

      {/* =================================================
          LOADING
          ================================================= */}

      {loading && (
        <div className="loading-state">
          <div className="loading-spinner" />

          <p>
            Loading tasks...
          </p>
        </div>
      )}

      {/* =================================================
          TASK TABLE
          ================================================= */}

      {!loading &&
        !error && (
          <section className="tasks-card">

            <div className="table-wrapper">

              <table className="task-table">

                <thead>
                  <tr>

                    <th>
                      Task
                    </th>

                    <th>
                      Project
                    </th>

                    <th>
                      Developer
                    </th>

                    <th>
                      Priority
                    </th>

                    <th>
                      Status
                    </th>

                    <th>
                      Due Date
                    </th>

                  </tr>
                </thead>

                <tbody>

                  {tasks.length ===
                    0 && (
                    <tr>
                      <td
                        colSpan={6}
                        className="empty-table"
                      >
                        No tasks found.
                      </td>
                    </tr>
                  )}

                  {tasks.map(
                    (task) => (
                      <TaskRow
                        key={
                          task.id
                        }
                        task={
                          task
                        }
                        updating={
                          updatingTaskId ===
                          task.id
                        }
                        onStatusChange={
                          handleStatusChange
                        }
                      />
                    )
                  )}

                </tbody>

              </table>

            </div>

          </section>
        )}

    </div>
  );
}

/**
 * =========================================================
 * TASK ROW
 * =========================================================
 */

function TaskRow({
  task,
  updating,
  onStatusChange,
}: {
  task: Task;
  updating: boolean;
  onStatusChange: (
    taskId: string,
    status: TaskStatus
  ) => Promise<void>;
}) {
  return (
    <tr>

      {/* TASK */}

      <td>

        <div className="task-title">
          {task.title}
        </div>

        {task.description && (
          <div className="task-description">
            {task.description}
          </div>
        )}

      </td>

      {/* PROJECT */}

      <td>
        {task.project?.name ||
          "-"}
      </td>

      {/* DEVELOPER */}

      <td>
        {task.developer?.name ||
          "-"}
      </td>

      {/* PRIORITY */}

      <td>
        <span
          className={`priority-badge priority-${task.priority.toLowerCase()}`}
        >
          {formatPriority(
            task.priority
          )}
        </span>
      </td>

      {/* STATUS */}

      <td>

        <select
          className={`status-select status-${task.status.toLowerCase()}`}
          value={
            task.status
          }
          disabled={updating}
          onChange={(event) =>
            onStatusChange(
              task.id,
              event.target
                .value as TaskStatus
            )
          }
        >

          <option value="TODO">
            To Do
          </option>

          <option value="IN_PROGRESS">
            In Progress
          </option>

          <option value="IN_REVIEW">
            In Review
          </option>

          <option value="DONE">
            Done
          </option>

        </select>

      </td>

      {/* DUE DATE */}

      <td>

        <div
          className={
            task.isOverdue
              ? "due-date overdue"
              : "due-date"
          }
        >

          {formatDate(
            task.dueDate
          )}

          {task.isOverdue && (
            <span className="overdue-label">
              Overdue
            </span>
          )}

        </div>

      </td>

    </tr>
  );
}

/**
 * =========================================================
 * HELPERS
 * =========================================================
 */

function formatPriority(
  priority: string
) {
  return priority
    .replace(
      "CRITICAL",
      "Critical"
    )
    .replace(
      "HIGH",
      "High"
    )
    .replace(
      "MEDIUM",
      "Medium"
    )
    .replace(
      "LOW",
      "Low"
    );
}

function formatDate(
  date: string
) {
  return new Date(
    date
  ).toLocaleDateString(
    "en-IN",
    {
      day: "2-digit",
      month: "short",
      year: "numeric",
    }
  );
}

function getRoleDescription(
  role?: string
) {
  switch (role) {
    case "ADMIN":
      return "Manage and monitor all project tasks.";

    case "PROJECT_MANAGER":
      return "Manage tasks across your projects.";

    case "DEVELOPER":
      return "View and update your assigned tasks.";

    default:
      return "Manage project tasks.";
  }
}