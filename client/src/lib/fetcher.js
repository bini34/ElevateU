import { getToken } from './token';

// Thin wrapper around fetch(). Returns the parsed JSON body for any HTTP
// status (the API sends structured {status, message, data} errors) and only
// throws when the request itself fails (network error, invalid JSON).
const Fetch = async (url, method, body) => {
  const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL;
  if (!backendUrl) {
    throw new Error('NEXT_PUBLIC_BACKEND_URL is not configured');
  }
  const fullUrl = `${backendUrl}${url}`;

  const token = getToken();
  const options = {
    method,
    headers: {
      Accept: 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
  };

  if (body instanceof FormData) {
    options.body = body; // FormData is used directly as the body
  } else if (body !== undefined) {
    options.headers['Content-Type'] = 'application/json';
    options.body = JSON.stringify(body);
  }

  const response = await fetch(fullUrl, options);
  return response.json();
};

export default Fetch;
