import { create } from 'zustand';
import { api } from '../services/api';

interface Notification {
  id: string;
  type: string;
  entityId: string | null;
  isRead: boolean;
  createdAt: string;
  sender: {
    id: string;
    displayName: string;
    avatarUrl: string | null;
  } | null;
}

interface NotificationState {
  notifications: Notification[];
  unreadCount: number;
  isLoading: boolean;
  fetchNotifications: () => Promise<void>;
  addNotification: (notification: Notification) => void;
  markAsRead: (id: string) => Promise<void>;
  deleteNotification: (id: string) => Promise<void>;
}

export const useNotificationStore = create<NotificationState>((set, get) => ({
  notifications: [],
  unreadCount: 0,
  isLoading: false,

  fetchNotifications: async () => {
    try {
      set({ isLoading: true });
      const res = await api.get('/notifications');
      if (res.data?.status === 'success') {
        const notifications = res.data.data;
        const unreadCount = notifications.filter((n: Notification) => !n.isRead).length;
        set({ notifications, unreadCount });
      }
    } catch (error) {
      console.error('Error fetching notifications:', error);
    } finally {
      set({ isLoading: false });
    }
  },

  addNotification: (notification) => {
    set((state) => {
      const exists = state.notifications.some((n) => n.id === notification.id);
      if (exists) return state;

      const newNotifications = [notification, ...state.notifications];
      return {
        notifications: newNotifications,
        unreadCount: state.unreadCount + (notification.isRead ? 0 : 1),
      };
    });
  },

  markAsRead: async (id) => {
    try {
      const res = await api.put(`/notifications/${id}/read`);
      if (res.data?.status === 'success') {
        if (id === 'all') {
          set({
            notifications: get().notifications.map((n) => ({ ...n, isRead: true })),
            unreadCount: 0,
          });
        } else {
          set({
            notifications: get().notifications.map((n) => (n.id === id ? { ...n, isRead: true } : n)),
            unreadCount: Math.max(0, get().unreadCount - 1),
          });
        }
      }
    } catch (error) {
      console.error('Error marking notification as read:', error);
    }
  },

  deleteNotification: async (id) => {
    try {
      const res = await api.delete(`/notifications/${id}`);
      if (res.data?.status === 'success') {
        const target = get().notifications.find((n) => n.id === id);
        const wasUnread = target ? !target.isRead : false;

        set({
          notifications: get().notifications.filter((n) => n.id !== id),
          unreadCount: Math.max(0, get().unreadCount - (wasUnread ? 1 : 0)),
        });
      }
    } catch (error) {
      console.error('Error deleting notification:', error);
    }
  },
}));
