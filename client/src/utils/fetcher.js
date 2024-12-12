import axios from 'axios';

export const fetcher = async (url, options = {}) => {
  const baseUrl = process.env.NEXT_PUBLIC_BACKEND_URL;
  const fullUrl = `${baseUrl}${url.startsWith('/') ? url : `/${url}`}`;

  try {
    const response = await axios({
      url: fullUrl,
      method: options.method || 'GET',
      headers: {
        'Accept': 'application/json',
        ...(options.body instanceof FormData ? {} : { 'Content-Type': 'application/json' }),
        ...(options.token ? { 'Authorization': `Bearer ${options.token}` } : {}),
        ...options.headers,
      },
      data: options.body || null,
      responseType: 'json',
    });

    console.log('Response:', response.data);
    return response.data;
  } catch (error) {
    console.error('Error in fetcher:', error.message || error);
  }
};
