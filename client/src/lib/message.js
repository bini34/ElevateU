import { fetcher } from '../utils/fetcher';

// API layer for chat. Every function returns the parsed
// { status, message, data } body and throws on failure.

// Chat list cards for the authenticated user
export const getMessageCards = async () => {
  return await fetcher('/message-cards');
};

// The other user + existing conversation (if any) for /chat/{userId}
export const getConversationWith = async (userId) => {
  return await fetcher(`/conversations/with/${userId}`);
};

// Paginated history, newest page first (reverse each page for display)
export const getConversationMessages = async (conversationId, page = 1) => {
  return await fetcher(`/conversations/${conversationId}/messages?page=${page}`);
};

export const getGroupMessages = async (groupId, page = 1) => {
  return await fetcher(`/groups/${groupId}/messages?page=${page}`);
};

// Send a message. Pass client_uuid so retries can never duplicate.
export const sendMessage = async ({ message, receiver_id, group_id, client_uuid, files = [] }) => {
  const formData = new FormData();
  if (message) formData.append('message', message);
  if (receiver_id) formData.append('receiver_id', receiver_id);
  if (group_id) formData.append('group_id', group_id);
  if (client_uuid) formData.append('client_uuid', client_uuid);
  files.forEach((file, index) => formData.append(`files[${index}]`, file));

  return await fetcher('/messages', { method: 'POST', body: formData });
};

// Mark every message sent to me in this conversation as read
export const markConversationRead = async (conversationId) => {
  return await fetcher(`/conversations/${conversationId}/read`, { method: 'POST' });
};
