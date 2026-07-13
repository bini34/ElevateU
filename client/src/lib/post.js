import { fetcher } from '../utils/fetcher';

// API layer for the feed. Every function returns the parsed
// { status, message, data } body and throws on failure.

// Create a post. Accepts FormData with `content` and `file[]` entries.
export const createPost = async (formData) => {
  return await fetcher('/post', { method: 'POST', body: formData });
};

// Paginated feed
export const getPosts = async (page = 1) => {
  return await fetcher(`/posts?page=${page}`);
};

// Single post with details
export const getPostById = async (id) => {
  return await fetcher(`/posts/${id}`);
};

// Update own post's content
export const updatePost = async (postId, content) => {
  return await fetcher(`/posts/${postId}`, {
    method: 'PUT',
    body: JSON.stringify({ content }),
  });
};

// Delete own post
export const deletePost = async (postId) => {
  return await fetcher(`/post/${postId}`, { method: 'DELETE' });
};

// Posts of a specific user
export const getUserPosts = async (userId, page = 1) => {
  return await fetcher(`/user/${userId}/posts?page=${page}`);
};

// Toggle like; resolves to { liked, likes_count } in data
export const toggleLike = async (postId) => {
  return await fetcher(`/posts/${postId}/like`, { method: 'POST' });
};

// Users who liked a post
export const getPostLikes = async (postId, page = 1) => {
  return await fetcher(`/posts/${postId}/likes?page=${page}`);
};

// Comments
export const getPostComments = async (postId, page = 1) => {
  return await fetcher(`/posts/${postId}/comments?page=${page}`);
};

export const addComment = async (postId, content) => {
  return await fetcher(`/posts/${postId}/comments`, {
    method: 'POST',
    body: JSON.stringify({ content }),
  });
};

export const updateComment = async (commentId, content) => {
  return await fetcher(`/comments/${commentId}`, {
    method: 'PUT',
    body: JSON.stringify({ content }),
  });
};

export const deleteComment = async (commentId) => {
  return await fetcher(`/comments/${commentId}`, { method: 'DELETE' });
};

// Search
export const searchPosts = async (query, page = 1) => {
  return await fetcher(`/posts/search?query=${encodeURIComponent(query)}&page=${page}`);
};
