import { useEffect, useState } from "react";
import {
  getNotifications,
  markAllNotificationsRead,
  markNotificationRead,
} from "../api/notification.api";
import { useAuth } from "../context/AuthContext";
import { createSocket } from "../utils/socket";
import type { Notification } from "../types";

export default function Notifications() {
  const { accessToken } = useAuth();

  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  async function loadNotifications() {
    try {
      setLoading(true);
      setError("");

      const data = await getNotifications();
      setNotifications(data);
    } catch (error: any) {
      setError(
        error?.response?.data?.message ||
          "Unable to load notifications"
      );
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadNotifications();
  }, []);

  useEffect(() => {
    if (!accessToken) return;

    const socket = createSocket(accessToken);

    socket.on("notification:new", (notification: Notification) => {
      setNotifications((current) => {
        const exists = current.some(
          (item) => item.id === notification.id
        );

        if (exists) {
          return current;
        }

        return [notification, ...current];
      });
    });

    socket.on(
      "notification:updated",
      (updatedNotification: Notification) => {
        setNotifications((current) =>
          current.map((notification) =>
            notification.id === updatedNotification.id
              ? updatedNotification
              : notification
          )
        );
      }
    );

    socket.on(
      "notification:all-read",
      () => {
        setNotifications((current) =>
          current.map((notification) => ({
            ...notification,
            isRead: true,
          }))
        );
      }
    );

    return () => {
      socket.disconnect();
    };
  }, [accessToken]);

  async function handleMarkRead(id: string) {
    try {
      const updated = await markNotificationRead(id);

      setNotifications((current) =>
        current.map((notification) =>
          notification.id === id ? updated : notification
        )
      );
    } catch (error) {
      console.error("Unable to mark notification as read", error);
    }
  }

  async function handleMarkAllRead() {
    try {
      await markAllNotificationsRead();

      setNotifications((current) =>
        current.map((notification) => ({
          ...notification,
          isRead: true,
        }))
      );
    } catch (error) {
      console.error(
        "Unable to mark all notifications as read",
        error
      );
    }
  }

  const unreadCount = notifications.filter(
    (notification) => !notification.isRead
  ).length;

  if (loading) {
    return (
      <div className="page-card">
        <div className="loading-state">
          Loading notifications...
        </div>
      </div>
    );
  }

  return (
    <div className="notifications-page">
      <div className="notifications-header">
        <div>
          <h1>Notifications</h1>

          <p>
            {unreadCount === 0
              ? "You're all caught up."
              : `${unreadCount} unread notification${
                  unreadCount === 1 ? "" : "s"
                }`}
          </p>
        </div>

        {unreadCount > 0 && (
          <button
            className="mark-all-button"
            onClick={handleMarkAllRead}
          >
            Mark all as read
          </button>
        )}
      </div>

      {error && (
        <div className="error">
          {error}
        </div>
      )}

      {notifications.length === 0 ? (
        <div className="empty-state">
          <div className="empty-icon">🔔</div>
          <h3>No notifications</h3>
          <p>
            New task assignments and updates will appear here.
          </p>
        </div>
      ) : (
        <div className="notification-list">
          {notifications.map((notification) => (
            <div
              key={notification.id}
              className={
                notification.isRead
                  ? "notification-item read"
                  : "notification-item unread"
              }
            >
              <div className="notification-icon">
                {notification.type === "TASK_ASSIGNED"
                  ? "✓"
                  : "↗"}
              </div>

              <div className="notification-content">
                <p className="notification-message">
                  {notification.message}
                </p>

                <span className="notification-time">
                  {formatDate(notification.createdAt)}
                </span>
              </div>

              {!notification.isRead && (
                <button
                  className="read-button"
                  onClick={() =>
                    handleMarkRead(notification.id)
                  }
                >
                  Mark read
                </button>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function formatDate(dateString: string) {
  const date = new Date(dateString);

  return date.toLocaleString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}