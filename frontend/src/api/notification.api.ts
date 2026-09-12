import api from "./axios";

export async function getNotifications() {
  const response =
    await api.get(
      "/notifications"
    );

  return response.data.data;
}

export async function getUnreadCount() {
  const response =
    await api.get(
      "/notifications/unread-count"
    );

  return response.data.data.count;
}

export async function markNotificationRead(
  id: string
) {
  const response =
    await api.patch(
      `/notifications/${id}/read`
    );

  return response.data.data.notification;
}

export async function markAllNotificationsRead() {
  const response =
    await api.patch(
      "/notifications/read-all"
    );

  return response.data.data;
}
