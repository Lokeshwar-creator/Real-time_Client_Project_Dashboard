import { useEffect, useState } from "react";
import { Link } from "react-router-dom";

import { getUnreadCount } from "../api/notification.api";
import { useAuth } from "../context/AuthContext";
import { createSocket } from "../utils/socket";

export default function NotificationBell() {
  const { accessToken } = useAuth();
  const [unreadCount, setUnreadCount] = useState(0);

  useEffect(() => {
    if (!accessToken) {
      setUnreadCount(0);
      return;
    }

    let active = true;
    void getUnreadCount()
      .then((count) => {
        if (active) setUnreadCount(count);
      })
      .catch(() => {
        if (active) setUnreadCount(0);
      });

    const socket = createSocket(accessToken);
    socket.on("notification:unread-count", ({ count }: { count: number }) => {
      setUnreadCount(count);
    });

    return () => {
      active = false;
      socket.disconnect();
    };
  }, [accessToken]);

  return (
    <Link
      to="/notifications"
      className="notification-bell"
      aria-label={`Notifications${unreadCount ? `, ${unreadCount} unread` : ""}`}
    >
      <span aria-hidden="true">🔔</span>
      {unreadCount > 0 && (
        <span className="notification-badge">
          {unreadCount > 99 ? "99+" : unreadCount}
        </span>
      )}
    </Link>
  );
}
