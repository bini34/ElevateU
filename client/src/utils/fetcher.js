import axios from 'axios';
import { getToken, removeToken } from '../lib/token.js';

// Endpoints where a 401 is an expected answer, not an expired session
const AUTH_PATHS = ['/auth/login', '/auth/register', '/auth/forgot-password', '/auth/reset-password'];

const handleUnauthorized = (url) => {
  if (typeof window === 'undefined') return;
  if (AUTH_PATHS.some((path) => url.startsWith(path))) return;

  // Session expired or token revoked: clear it and send the user to sign in
  removeToken();
  localStorage.removeItem('user');
  if (!window.location.pathname.startsWith('/signin')) {
    window.location.assign('/signin');
  }
};

// Axios-based fetcher used by the data hooks. Automatically attaches the
// auth token and throws a normalized Error (with .status and .data) on
// failure instead of swallowing it.
export const fetcher = async (url, options = {}) => {
  const baseUrl = process.env.NEXT_PUBLIC_BACKEND_URL;
  if (!baseUrl) {
    throw new Error('NEXT_PUBLIC_BACKEND_URL is not configured');
  }
  const fullUrl = `${baseUrl.replace(/\/+$/, '')}${url.startsWith('/') ? url : `/${url}`}`;

  const token = options.token || getToken();
  // Lets the server exclude this client's own websocket from broadcasts
  const socketId = typeof window !== 'undefined' ? window.__echoSocketId : null;

  try {
    const response = await axios({
      url: fullUrl,
      method: options.method || 'GET',
      headers: {
        'Accept': 'application/json',
        ...(options.body instanceof FormData ? {} : { 'Content-Type': 'application/json' }),
        ...(token ? { 'Authorization': `Bearer ${token}` } : {}),
        ...(socketId ? { 'X-Socket-Id': socketId } : {}),
        ...options.headers,
      },
      data: options.body || null,
      responseType: options.responseType || 'json',
      signal: options.signal,
    });

    return response.data;
  } catch (error) {
    if (error.response?.status === 401 && (!token || token === getToken())) {
      handleUnauthorized(url);
    }

    const serverMessage = error.response?.data?.message;
    const message = Array.isArray(serverMessage)
      ? serverMessage.join(' ')
      : serverMessage || error.message || 'Request failed';

    const err = new Error(message);
    err.status = error.response?.status;
    err.data = error.response?.data;
    throw err;
  }
};
