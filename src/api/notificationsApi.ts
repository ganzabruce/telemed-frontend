import axios from "axios";

const api = axios.create({
  baseURL: "http://localhost:5003",
});

const getAuthToken = () => {
  const stored = localStorage.getItem("user");
  if (stored) {
    const user = JSON.parse(stored);
    return user?.token;
  }
  return null;
};

api.interceptors.request.use(
  (config) => {
    const token = getAuthToken();
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

export interface Notification {
  id: string;
  message: string;
  type: 'INFO' | 'WARNING' | 'ERROR' | 'SUCCESS';
  status: 'SENT' | 'READ';
  createdAt: string;
}

export const getNotifications = async (): Promise<Notification[]> => {
  const response = await api.get("/notifications");
  return response.data.data || [];
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

