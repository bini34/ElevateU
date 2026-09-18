"use client"
import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';
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
  error: null,
  hasMore: false,
  loadNotifications: () => {},
  markRead: () => {},
  markAllRead: () => {},
});

export function NotificationProvider({ children }) {
  const { authUser, authToken } = useContext(AuthContext);
  const { echo } = useEcho();
  const [unreadCount, setUnreadCount] = useState(0);
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(false);
  const [hasMore, setHasMore] = useState(false);
  const [error, setError] = useState(null);
  const session = useMemo(() => ({
    userId: authUser?.id,
    authenticated: Boolean(authToken),
    page: 0,
    loading: false,
    mutating: false,
  }), [authUser?.id, authToken]);
  const activeSession = useRef(session);
  activeSession.current = session;
  const [stateOwner, setStateOwner] = useState(session);

  // Clear the previous account and reject its delayed HTTP responses.
  useEffect(() => {
    let cancelled = false;
    setNotifications([]);
    setUnreadCount(0);
    setHasMore(false);
    setLoading(session.loading);
    setError(null);
    setStateOwner(session);
    if (authUser?.id) {
      getUnreadCount()
        .then((res) => {
          if (!cancelled && activeSession.current === session) setUnreadCount(res.data?.count ?? 0);
        })
        .catch((err) => {
          if (!cancelled && activeSession.current === session) setError(err.message || 'Could not load notifications.');
        });
    }
    return () => { cancelled = true; };
  }, [authUser?.id, session]);

  // Live notifications on the user's private channel
  useEffect(() => {
    if (!echo || !authUser?.id) return undefined;

    const channelName = `App.Models.User.${authUser.id}`;
    echo.private(channelName).notification((payload) => {
      if (activeSession.current !== session) return;
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
  }, [echo, authUser?.id, session]);

  const loadNotifications = useCallback(async (reset = false) => {
    if (!authUser?.id || session.loading) return;
    session.loading = true;
    setLoading(true);
    setError(null);
    const nextPage = reset ? 1 : session.page + 1;
    try {
      const res = await getNotifications(nextPage);
      if (activeSession.current !== session) return;
      const paginator = res.data;
      const items = paginator?.data ?? [];
      setNotifications((current) => {
        if (reset) return items;
        const seen = new Set(current.map((n) => n.id));
        return [...current, ...items.filter((n) => !seen.has(n.id))];
      });
      session.page = nextPage;
      setHasMore(Boolean(paginator?.next_page_url));
    } catch (err) {
      if (activeSession.current === session) setError(err.message || 'Could not load notifications.');
    } finally {
      session.loading = false;
      if (activeSession.current === session) setLoading(false);
    }
  }, [authUser?.id, session]);

  const markRead = useCallback(async (id) => {
    if (!authUser?.id || session.mutating || !notifications.some((n) => n.id === id && !n.read_at)) return;
    session.mutating = true;
    try {
      await markNotificationRead(id);
      if (activeSession.current !== session) return;
      setNotifications((current) => current.map((n) =>
        n.id === id ? { ...n, read_at: new Date().toISOString() } : n));
      setUnreadCount((count) => Math.max(0, count - 1));
    } catch (err) {
      if (activeSession.current === session) toast.error(err.message || 'Could not mark the notification as read.');
    } finally {
      session.mutating = false;
    }
  }, [authUser?.id, notifications, session]);

  const markAllRead = useCallback(async () => {
    if (!authUser?.id || session.mutating) return;
    session.mutating = true;
    try {
      await markAllNotificationsRead();
      if (activeSession.current !== session) return;
      setNotifications((current) => current.map((n) =>
        n.read_at ? n : { ...n, read_at: new Date().toISOString() }));
      setUnreadCount(0);
    } catch (err) {
      if (activeSession.current === session) toast.error(err.message || 'Could not mark notifications as read.');
    } finally {
      session.mutating = false;
    }
  }, [authUser?.id, session]);

  const ownsState = stateOwner === session;
  return (
    <NotificationContext.Provider
      value={{
        unreadCount: ownsState ? unreadCount : 0,
        notifications: ownsState ? notifications : [],
        loading: ownsState && loading,
        hasMore: ownsState && hasMore,
        error: ownsState ? error : null,
        loadNotifications, markRead, markAllRead,
      }}
    >
      {children}
    </NotificationContext.Provider>
  );
}

export const useNotifications = () => useContext(NotificationContext);
