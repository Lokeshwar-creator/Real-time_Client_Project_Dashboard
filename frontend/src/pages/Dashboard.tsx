import {
  useEffect,
  useState,
} from "react";

import {
  useAuth,
} from "../context/AuthContext";

import {
  getDashboard,
} from "../api/dashboard.api";
import { createSocket } from "../utils/socket";

/**
 * ---------------------------------------------------------
 * DASHBOARD PAGE
 * ---------------------------------------------------------
 */

export default function Dashboard() {
  const {
    user,
    logout,
    accessToken,
  } = useAuth();

  const [
    data,
    setData,
  ] = useState<any>(null);

  const [
    loading,
    setLoading,
  ] = useState(true);

  const [
    error,
    setError,
  ] = useState("");

  useEffect(() => {
    loadDashboard();
  }, []);

  useEffect(() => {
    if (user?.role !== "ADMIN" || !accessToken) return;

    const socket = createSocket(accessToken);
    socket.on("presence:users", ({ count }: { count: number }) => {
      setData((current: any) =>
        current ? { ...current, activeUsers: count } : current
      );
    });

    return () => {
      socket.disconnect();
    };
  }, [accessToken, user?.role]);

  /**
   * -------------------------------------------------------
   * LOAD DASHBOARD
   * -------------------------------------------------------
   */

  async function loadDashboard() {
    try {
      setLoading(true);

      setError("");

      const result =
        await getDashboard();

      setData(result);
    } catch (error: any) {
      console.error(
        "Dashboard loading error:",
        error
      );

      setError(
        error?.response?.data
          ?.message ||
          "Unable to load dashboard"
      );
    } finally {
      setLoading(false);
    }
  }

  /**
   * -------------------------------------------------------
   * LOADING
   * -------------------------------------------------------
   */

  if (loading) {
    return (
      <div className="loading-state">
        <div className="loading-spinner" />

        <p>
          Loading dashboard...
        </p>
      </div>
    );
  }

  /**
   * -------------------------------------------------------
   * ERROR
   * -------------------------------------------------------
   */

  if (error) {
    return (
      <div className="error-state">

        <h3>
          Unable to load dashboard
        </h3>

        <p>
          {error}
        </p>

        <button
          onClick={
            loadDashboard
          }
        >
          Try Again
        </button>

      </div>
    );
  }

  /**
   * -------------------------------------------------------
   * SAFETY CHECK
   * -------------------------------------------------------
   */

  if (!data) {
    return (
      <div className="empty-state">
        No dashboard data available.
      </div>
    );
  }

  return (
    <div className="dashboard">

      {/* PAGE HEADING */}

      <div className="page-heading">

        <div>
          <h2>
            Dashboard
          </h2>

          <p>
            Welcome back,{" "}
            <strong>
              {user?.name}
            </strong>
          </p>
        </div>

        <button
          type="button"
          className="logout-button"
          onClick={logout}
        >
          Logout
        </button>

      </div>

      {/* ROLE-SPECIFIC DASHBOARD */}

      {user?.role ===
        "ADMIN" && (
        <AdminDashboard
          data={data}
        />
      )}

      {user?.role ===
        "PROJECT_MANAGER" && (
        <ManagerDashboard
          data={data}
        />
      )}

      {user?.role ===
        "DEVELOPER" && (
        <DeveloperDashboard
          data={data}
        />
      )}

    </div>
  );
}

/**
 * =========================================================
 * ADMIN DASHBOARD
 * =========================================================
 */

function AdminDashboard({
  data,
}: {
  data: any;
}) {
  return (
    <>
      <div className="stats">

        <div className="stat-card">
          <div className="stat-label">
            Total Projects
          </div>

          <strong>
            {data.totalProjects}
          </strong>

          <span>
            All projects
          </span>
        </div>

        <div className="stat-card">
          <div className="stat-label">
            Total Tasks
          </div>

          <strong>
            {data.totalTasks}
          </strong>

          <span>
            Across all projects
          </span>
        </div>

        <div className="stat-card">
          <div className="stat-label">
            Overdue Tasks
          </div>

          <strong>
            {data.overdueTasks}
          </strong>

          <span>
            Require attention
          </span>
        </div>

        <div className="stat-card">
          <div className="stat-label">
            Active Users
          </div>

          <strong>
            {data.activeUsers}
          </strong>

          <span>
            {data.activeUsers} online
          </span>
        </div>

      </div>

      {/* STATUS BREAKDOWN */}

      <section className="dashboard-section">

        <div className="section-header">
          <div>
            <h3>
              Tasks by Status
            </h3>

            <span className="section-subtitle">
              Current task distribution
            </span>
          </div>
        </div>

        <div className="status-grid">

          {data.tasksByStatus?.map(
            (
              item: any
            ) => (
              <div
                className="status-card"
                key={
                  item.status
                }
              >
                <strong>
                  {item.count}
                </strong>

                <span>
                  {formatStatus(
                    item.status
                  )}
                </span>
              </div>
            )
          )}

        </div>

      </section>

    </>
  );
}

/**
 * =========================================================
 * PROJECT MANAGER DASHBOARD
 * =========================================================
 */

function ManagerDashboard({
  data,
}: {
  data: any;
}) {
  const totalPriorityTasks =
    data.tasksByPriority?.reduce(
      (
        total: number,
        item: any
      ) =>
        total +
        item.count,
      0
    ) || 0;

  return (
    <>
      <div className="stats">

        <div className="stat-card">
          <div className="stat-label">
            My Projects
          </div>

          <strong>
            {data.projects}
          </strong>

          <span>
            Projects you manage
          </span>
        </div>

        <div className="stat-card">
          <div className="stat-label">
            Due This Week
          </div>

          <strong>
            {
              data
                .tasksDueThisWeek
                ?.length || 0
            }
          </strong>

          <span>
            Upcoming tasks
          </span>
        </div>

        <div className="stat-card">
          <div className="stat-label">
            Managed Tasks
          </div>

          <strong>
            {totalPriorityTasks}
          </strong>

          <span>
            Across your projects
          </span>
        </div>

      </div>

      <section className="dashboard-section">

        <div className="section-header">

          <div>
            <h3>
              Tasks by Priority
            </h3>

            <span className="section-subtitle">
              Priority distribution
            </span>
          </div>

        </div>

        <div className="status-grid">

          {data.tasksByPriority?.map(
            (
              item: any
            ) => (
              <div
                className="status-card"
                key={
                  item.priority
                }
              >
                <strong>
                  {item.count}
                </strong>

                <span>
                  {formatPriority(
                    item.priority
                  )}
                </span>
              </div>
            )
          )}

        </div>

      </section>

    </>
  );
}

/**
 * =========================================================
 * DEVELOPER DASHBOARD
 * =========================================================
 */

function DeveloperDashboard({
  data,
}: {
  data: any;
}) {
  return (
    <>
      <div className="stats">

        <div className="stat-card">
          <div className="stat-label">
            My Tasks
          </div>

          <strong>
            {data.summary.total}
          </strong>

          <span>
            Assigned to you
          </span>
        </div>

        <div className="stat-card">
          <div className="stat-label">
            To Do
          </div>

          <strong>
            {data.summary.todo}
          </strong>

          <span>
            Not started
          </span>
        </div>

        <div className="stat-card">
          <div className="stat-label">
            In Progress
          </div>

          <strong>
            {data.summary.inProgress}
          </strong>

          <span>
            Currently working
          </span>
        </div>

        <div className="stat-card">
          <div className="stat-label">
            In Review
          </div>

          <strong>
            {data.summary.inReview}
          </strong>

          <span>
            Awaiting review
          </span>
        </div>

        <div className="stat-card">
          <div className="stat-label">
            Overdue
          </div>

          <strong>
            {data.summary.overdue}
          </strong>

          <span>
            Need attention
          </span>
        </div>

      </div>
    </>
  );
}

/**
 * =========================================================
 * HELPERS
 * =========================================================
 */

function formatStatus(
  status: string
) {
  switch (status) {
    case "TODO":
      return "To Do";

    case "IN_PROGRESS":
      return "In Progress";

    case "IN_REVIEW":
      return "In Review";

    case "DONE":
      return "Done";

    default:
      return status;
  }
}

function formatPriority(
  priority: string
) {
  switch (priority) {
    case "LOW":
      return "Low";

    case "MEDIUM":
      return "Medium";

    case "HIGH":
      return "High";

    case "CRITICAL":
      return "Critical";

    default:
      return priority;
  }
}
