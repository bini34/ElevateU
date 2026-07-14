import { fetcher } from '../utils/fetcher';

export const getNotifications = async (page = 1) => {
  return await fetcher(`/notifications?page=${page}`);
};

export const getUnreadCount = async () => {
  return await fetcher('/notifications/unread-count');
};

export const markNotificationRead = async (id) => {
  return await fetcher(`/notifications/${id}/read`, { method: 'POST' });
};

export const markAllNotificationsRead = async () => {
  return await fetcher('/notifications/read-all', { method: 'POST' });
};

// Where clicking a notification should take the user
export const notificationHref = (data) => {
  switch (data?.kind) {
    case 'post_liked':
    case 'post_commented':
      return data.post_id ? `/post/${data.post_id}` : '/';
    case 'new_message':
      return data.actor?.id ? `/chat/${data.actor.id}` : '/chat';
    default:
      return '/';
  }
};
