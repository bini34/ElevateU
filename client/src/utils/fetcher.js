import axios from 'axios';
import { getToken } from '@/lib/token';

// Axios-based fetcher used by the data hooks. Automatically attaches the
// auth token and throws a normalized Error (with .status and .data) on
// failure instead of swallowing it.
export const fetcher = async (url, options = {}) => {
  const baseUrl = process.env.NEXT_PUBLIC_BACKEND_URL;
  if (!baseUrl) {
    throw new Error('NEXT_PUBLIC_BACKEND_URL is not configured');
  }
  const fullUrl = `${baseUrl}${url.startsWith('/') ? url : `/${url}`}`;

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
      responseType: 'json',
    });

    return response.data;
  } catch (error) {
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
