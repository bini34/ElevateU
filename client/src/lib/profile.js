import { fetcher } from '../utils/fetcher';

// Public profile by user_name (drives the /{name} page)
export const getProfile = async (userName) => {
  return await fetcher(`/profiles/${encodeURIComponent(userName)}`);
};

// Update the authenticated user's own profile fields
export const updateProfile = async (fields) => {
  return await fetcher('/profile', {
    method: 'PUT',
    body: JSON.stringify(fields),
  });
};

// Upload a new avatar image
export const uploadAvatar = async (file) => {
  const formData = new FormData();
  formData.append('avatar', file);
  return await fetcher('/profile/avatar', { method: 'POST', body: formData });
};

// Account security
export const changePassword = async (current_password, password, password_confirmation) => {
  return await fetcher('/auth/change-password', {
    method: 'POST',
    body: JSON.stringify({ current_password, password, password_confirmation }),
  });
};

export const forgotPassword = async (email) => {
  return await fetcher('/auth/forgot-password', {
    method: 'POST',
    body: JSON.stringify({ email }),
  });
};

export const resetPassword = async ({ token, email, password, password_confirmation }) => {
  return await fetcher('/auth/reset-password', {
    method: 'POST',
    body: JSON.stringify({ token, email, password, password_confirmation }),
  });
};
