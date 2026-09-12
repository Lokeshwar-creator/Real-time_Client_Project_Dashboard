import {
  NavLink,
  Outlet,
  useNavigate,
} from "react-router-dom";

import { useAuth } from "../context/AuthContext";
import NotificationBell from "./NotificationBell";

export default function Layout() {
  const {
    user,
    logout,
  } = useAuth();

  const navigate =
    useNavigate();

  async function handleLogout() {
    await logout();
    navigate("/login");
  }

  return (
    <div className="app-shell">

      {/* SIDEBAR */}
      <aside className="sidebar">

        <div className="sidebar-logo">
          <div className="logo-icon">
            CP
          </div>

          <div>
            <strong>
              Client Project
            </strong>

            <span>
              Dashboard
            </span>
          </div>
        </div>

        <nav className="sidebar-nav">

          <NavLink
            to="/dashboard"
            className={({ isActive }) =>
              isActive
                ? "nav-item active"
                : "nav-item"
            }
          >
            <span>▦</span>
            Dashboard
          </NavLink>

          <NavLink
            to="/tasks"
            className={({ isActive }) =>
              isActive
                ? "nav-item active"
                : "nav-item"
            }
          >
            <span>✓</span>
            Tasks
          </NavLink>

          {(user?.role === "ADMIN" ||
            user?.role ===
              "PROJECT_MANAGER") && (
            <NavLink
              to="/projects"
              className={({ isActive }) =>
                isActive
                  ? "nav-item active"
                  : "nav-item"
              }
            >
              <span>▤</span>
              Projects
            </NavLink>
          )}

          <NavLink
            to="/activity"
            className={({ isActive }) =>
              isActive
                ? "nav-item active"
                : "nav-item"
            }
          >
            <span>◷</span>
            Activity
          </NavLink>

          <NavLink
            to="/notifications"
            className={({ isActive }) =>
              isActive
                ? "nav-item active"
                : "nav-item"
            }
          >
            <span>🔔</span>
            Notifications
          </NavLink>

        </nav>

        <div className="sidebar-bottom">

          <div className="user-mini">

            <div className="avatar">
              {user?.name
                ?.charAt(0)
                .toUpperCase()}
            </div>

            <div className="user-info">

              <strong>
                {user?.name}
              </strong>

              <span>
                {user?.role
                  ?.replace(
                    "_",
                    " "
                  )}
              </span>

            </div>

          </div>

          <button
            className="logout-button"
            onClick={
              handleLogout
            }
          >
            Logout
          </button>

        </div>

      </aside>

      {/* MAIN AREA */}
      <div className="main-area">

        {/* TOP HEADER */}
        <header className="top-header">

          <div>
            <h2>
              {getPageTitle(
                window.location.pathname
              )}
            </h2>

            <span className="header-subtitle">
              Real-time project management
            </span>
          </div>

          <div className="header-right">

            <div className="online-indicator">
              <span className="online-dot" />
              Live
            </div>

            <NotificationBell />

            <div className="header-avatar">
              {user?.name
                ?.charAt(0)
                .toUpperCase()}
            </div>

          </div>

        </header>

        {/* PAGE CONTENT */}
        <main className="page-content">
          <Outlet />
        </main>

      </div>

    </div>
  );
}

function getPageTitle(
  pathname: string
) {
  if (
    pathname.startsWith(
      "/dashboard"
    )
  ) {
    return "Dashboard";
  }

  if (
    pathname.startsWith(
      "/tasks"
    )
  ) {
    return "Tasks";
  }

  if (
    pathname.startsWith(
      "/projects"
    )
  ) {
    return "Projects";
  }

  if (
    pathname.startsWith(
      "/activity"
    )
  ) {
    return "Activity";
  }

  if (
    pathname.startsWith(
      "/notifications"
    )
  ) {
    return "Notifications";
  }

  return "Dashboard";
}
