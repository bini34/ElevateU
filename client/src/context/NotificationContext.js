"use client"
import { createContext, useCallback, useContext, useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import { AuthContext } from './AuthContext';
import useEcho from '@/hooks/echo';
import {
  getNotifications,
  getUnreadCount,
  markNotificationRead,
  markAllNotificationsRead,
} from '@/lib/notifications';

const NotificationContext = createContext({
  unreadCount: 0,
  notifications: [],
  loading: false,
  hasMore: false,
  loadNotifications: () => {},
  markRead: () => {},
  markAllRead: () => {},
});

export function NotificationProvider({ children }) {
  const { authUser } = useContext(AuthContext);
  const { echo } = useEcho();
  const [unreadCount, setUnreadCount] = useState(0);
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(false);
  const [hasMore, setHasMore] = useState(false);
  const [page, setPage] = useState(0);

  // Initial unread badge
  useEffect(() => {
    if (!authUser) return;
    getUnreadCount()
      .then((res) => setUnreadCount(res.data?.count ?? 0))
      .catch(() => {});
  }, [authUser]);

  // Live notifications on the user's private channel
  useEffect(() => {
    if (!echo || !authUser?.id) return undefined;

    const channelName = `App.Models.User.${authUser.id}`;
    echo.private(channelName).notification((payload) => {
      setUnreadCount((count) => count + 1);
      setNotifications((current) => [
        { id: payload.id, data: payload, read_at: null, created_at: new Date().toISOString() },
        ...current.filter((n) => n.id !== payload.id),
      ]);
      if (payload.text) {
        toast(payload.text, { icon: '🔔', position: 'top-right' });
      }
    });

    return () => {
      echo.leave(channelName);
    };
  }, [echo, authUser?.id]);

  const loadNotifications = useCallback(async (reset = false) => {
    setLoading(true);
    const nextPage = reset ? 1 : page + 1;
    try {
      const res = await getNotifications(nextPage);
      const paginator = res.data;
      const items = paginator?.data ?? [];
      setNotifications((current) => {
        if (reset) return items;
        const seen = new Set(current.map((n) => n.id));
        return [...current, ...items.filter((n) => !seen.has(n.id))];
      });
      setPage(nextPage);
      setHasMore(Boolean(paginator?.next_page_url));
    } catch {
      /* the dropdown/page shows what it has */
    } finally {
      setLoading(false);
    }
  }, [page]);

  const markRead = useCallback(async (id) => {
    setNotifications((current) =>
      current.map((n) => (n.id === id && !n.read_at ? { ...n, read_at: new Date().toISOString() } : n))
    );
    setUnreadCount((count) => Math.max(0, count - 1));
    try {
      await markNotificationRead(id);
    } catch {
      /* server refused; the badge refreshes on next load */
    }
  }, []);

  const markAllRead = useCallback(async () => {
    setNotifications((current) =>
      current.map((n) => (n.read_at ? n : { ...n, read_at: new Date().toISOString() }))
    );
    setUnreadCount(0);
    try {
      await markAllNotificationsRead();
    } catch {
      /* ignore */
    }
  }, []);

  return (
    <NotificationContext.Provider
      value={{ unreadCount, notifications, loading, hasMore, loadNotifications, markRead, markAllRead }}
    >
      {children}
    </NotificationContext.Provider>
  );
}

export const useNotifications = () => useContext(NotificationContext);
