import {
  useEffect,
  useState,
} from "react";

import type {
  Activity,
} from "../types";

import {
  createSocket,
} from "../utils/socket";

import {
  useAuth,
} from "../context/AuthContext";

function formatTime(
  dateString: string
) {
  const date =
    new Date(dateString);

  const now =
    new Date();

  const diff =
    Math.floor(
      (now.getTime() -
        date.getTime()) /
        1000
    );

  if (diff < 60) {
    return `${diff}s ago`;
  }

  if (diff < 3600) {
    return `${Math.floor(
      diff / 60
    )}m ago`;
  }

  if (diff < 86400) {
    return `${Math.floor(
      diff / 3600
    )}h ago`;
  }

  return date.toLocaleDateString();
}

function formatStatus(
  status?: string
) {
  if (!status) {
    return "";
  }

  return status
    .replace(
      "IN_PROGRESS",
      "In Progress"
    )
    .replace(
      "IN_REVIEW",
      "In Review"
    )
    .replace(
      "TODO",
      "To Do"
    )
    .replace(
      "DONE",
      "Done"
    );
}

function formatActivity(
  activity: Activity
) {
  if (
    activity.type ===
      "STATUS_CHANGED" &&
    activity.oldStatus &&
    activity.newStatus
  ) {
    return (
      `${activity.user.name} moved ` +
      `"${activity.task?.title}" ` +
      `from ${formatStatus(
        activity.oldStatus
      )} → ${formatStatus(
        activity.newStatus
      )}`
    );
  }

  return activity.message;
}

export default function ActivityFeed() {
  const {
    accessToken,
  } = useAuth();

  const [
    activities,
    setActivities,
  ] = useState<Activity[]>(
    []
  );

  const [
    connected,
    setConnected,
  ] = useState(false);

  useEffect(() => {
    if (!accessToken) {
      return;
    }

    const socket =
      createSocket(
        accessToken
      );

    socket.on(
      "connect",
      () => {
        console.log(
          "Activity Socket connected"
        );

        setConnected(true);

        /**
         * Ask backend for activities
         * that happened while the
         * user was offline.
         */
        const lastSeenAt =
          localStorage.getItem(
            "activityLastSeenAt"
          );

        socket.emit(
          "activity:catch-up",
          {
            lastSeenAt:
              lastSeenAt ||
              new Date(0).toISOString(),
          }
        );
      }
    );

    socket.on(
      "disconnect",
      () => {
        console.log(
          "Activity Socket disconnected"
        );

        setConnected(false);
      }
    );

    /**
     * -----------------------------------------------------
     * MISSED ACTIVITIES
     * -----------------------------------------------------
     */

    socket.on(
      "activity:catch-up",
      (data) => {
        const missed =
          data.activities ||
          [];

        setActivities(
          missed
        );

        updateLastSeen(
          missed
        );
      }
    );

    /**
     * -----------------------------------------------------
     * LIVE ACTIVITY
     * -----------------------------------------------------
     */

    socket.on(
      "activity:new",
      (activity) => {
        setActivities(
          (previous) => [
            activity,
            ...previous,
          ].slice(0, 20)
        );

        localStorage.setItem(
          "activityLastSeenAt",
          activity.createdAt
        );
      }
    );

    return () => {
      socket.disconnect();
    };
  }, [accessToken]);

  function updateLastSeen(
    items: Activity[]
  ) {
    if (
      items.length === 0
    ) {
      return;
    }

    const latest =
      items.reduce(
        (
          newest,
          current
        ) =>
          new Date(
            current.createdAt
          ).getTime() >
          new Date(
            newest.createdAt
          ).getTime()
            ? current
            : newest
      );

    localStorage.setItem(
      "activityLastSeenAt",
      latest.createdAt
    );
  }

  return (
    <section className="activity-card">

      <div className="section-header">

        <div>
          <h3>
            Live Activity
          </h3>

          <span className="section-subtitle">
            Real-time project events
          </span>
        </div>

        <div
          className={
            connected
              ? "socket-status connected"
              : "socket-status"
          }
        >
          <span className="socket-dot" />

          {connected
            ? "Live"
            : "Offline"}
        </div>

      </div>

      <div className="activity-list">

        {activities.length ===
          0 && (
          <div className="empty-state">
            No activity yet.
          </div>
        )}

        {activities.map(
          (activity) => (
            <div
              className="activity-item"
              key={
                activity.id
              }
            >

              <div className="activity-icon">
                {getActivityIcon(
                  activity.type
                )}
              </div>

              <div className="activity-content">

                <p>
                  {formatActivity(
                    activity
                  )}
                </p>

                <div className="activity-meta">

                  <span>
                    {activity.project
                      ?.name}
                  </span>

                  <span>
                    ·
                  </span>

                  <span>
                    {formatTime(
                      activity.createdAt
                    )}
                  </span>

                </div>

              </div>

            </div>
          )
        )}

      </div>

    </section>
  );
}

function getActivityIcon(
  type: string
) {
  switch (type) {
    case "STATUS_CHANGED":
      return "↔";

    case "TASK_CREATED":
      return "+";

    case "TASK_ASSIGNED":
      return "→";

    case "TASK_UPDATED":
      return "✎";

    default:
      return "•";
  }
}