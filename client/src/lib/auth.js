import { fetcher } from '../utils/fetcher.js';
import { setToken, getToken, removeToken } from './token.js';

export { setToken, getToken, removeToken };

// The API responds with { status, message, data: { user, token } }.
// Each helper returns that body; the token is persisted on success.

export const signUp = async (user_name, first_name, last_name, email, password, password_confirmation) => {
  const data = await fetcher('/auth/register', { method: 'POST', body: {
    user_name,
    first_name,
    last_name,
    email,
    password,
    password_confirmation,
  } });
  if (data?.status === 'success' && data.data?.token) {
    setToken(data.data.token);
  }
  return data;
};

export const signIn = async (email, password) => {
  if (!email || !password) {
    throw new Error('Email and password are required');
  }
  const data = await fetcher('/auth/login', { method: 'POST', body: { email, password } });
  if (data?.status === 'success' && data.data?.token) {
    setToken(data.data.token);
  }
  return data;
};

export const signOut = async () => {
  const token = getToken();
  try {
    if (token) {
      await fetcher('/auth/logout', { method: 'POST', token });
    }
  } finally {
    // A delayed logout must not clear a newly signed-in session.
    if (getToken() === token) removeToken();
  }
};
