import { api } from "./client";

export interface Notification {
  id: string;
  message: string;
  type: 'INFO' | 'WARNING' | 'ERROR' | 'SUCCESS';
  status: 'SENT' | 'READ';
  createdAt: string;
}

export const getNotifications = async (limit?: number): Promise<Notification[]> => {
  // Note: limit parameter is for backward compatibility but backend returns all notifications
  const response = await api.get("/notifications");
  const notifications = response.data.data || [];
  // If limit is specified, return only that many (client-side filtering for dropdown)
  return limit ? notifications.slice(0, limit) : notifications;
};

export const markNotificationAsRead = async (notificationId: string): Promise<Notification> => {
  const response = await api.patch(`/notifications/${notificationId}/read`);
  return response.data.data;
};

export const markAllNotificationsAsRead = async (): Promise<void> => {
  const notifications = await getNotifications();
  const unreadNotifications = notifications.filter(n => n.status === 'SENT');
  await Promise.all(unreadNotifications.map(n => markNotificationAsRead(n.id)));
};

