import Fetch from './fetcher';
import { setToken, getToken, removeToken } from './token';

export { setToken, getToken, removeToken };

// The API responds with { status, message, data: { user, token } }.
// Each helper returns that body; the token is persisted on success.

export const signUp = async (user_name, first_name, last_name, email, password, password_confirmation) => {
  const data = await Fetch('/auth/register', 'POST', {
    user_name,
    first_name,
    last_name,
    email,
    password,
    password_confirmation,
  });
  if (data?.status === 'success' && data.data?.token) {
    setToken(data.data.token);
  }
  return data;
};

export const signIn = async (email, password) => {
  if (!email || !password) {
    throw new Error('Email and password are required');
  }
  const data = await Fetch('/auth/login', 'POST', { email, password });
  if (data?.status === 'success' && data.data?.token) {
    setToken(data.data.token);
  }
  return data;
};

export const signOut = async () => {
  try {
    if (getToken()) {
      await Fetch('/auth/logout', 'POST');
    }
  } finally {
    removeToken();
  }
};

export const forgetPassword = async (email) => {
  if (!email) {
    throw new Error('Email is required');
  }
  return await Fetch('/forget-password', 'POST', { email });
};
