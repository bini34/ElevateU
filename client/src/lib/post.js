// Import the fetcher utility
import fetcher from '../utils/fetcher';

// Function to create a new post
export const createPost = async (postData) => {
  return await fetcher('/posts', 'POST', postData);
};

// Function to get all posts
export const getPosts = async () => {
  return await fetcher('/posts', 'GET');
};

// Function to get a specific post by ID
export const getPostById = async (id) => {
  return await fetcher(`/posts/${id}`, 'GET');
};

// Function to update a specific post
export const updatePost = async (userId, postId, postData) => {
  return await fetcher(`/user/${userId}/post/${postId}`, 'PUT', postData);
};

// Function to delete a specific post
export const deletePost = async (postId) => {
  return await fetcher(`/post/${postId}`, 'DELETE');
};

// Function to get all posts for a specific user
export const getUserPosts = async (userId, page) => {
  return await fetcher(`/user/${userId}/posts?page=${page}`, 'GET');
};

// Function to like a specific post
export const likePost = async (postId) => {
  return await fetcher(`/posts/${postId}/like`, 'POST');
};

// Function to get all likes for a post
export const getPostLikes = async (postId) => {
  return await fetcher(`/posts/${postId}/likes`, 'GET');
};

// Function to comment on a specific post
export const commentOnPost = async (postId, commentData) => {
  return await fetcher(`/posts/${postId}/comments`, 'POST', commentData);
};

// Function to get all comments for a post
export const getPostComments = async (postId) => {
  return await fetcher(`/posts/${postId}/comments`, 'GET');
};

// Function to search for posts
export const searchPosts = async (query) => {
  return await fetcher(`/posts/search?query=${query}`, 'GET');
};