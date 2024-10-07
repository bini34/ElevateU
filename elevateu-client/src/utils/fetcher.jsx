import axios from 'axios';

export const fetcher = async (url, options = {}) => {
  const baseUrl = 'http://localhost:8000'; // Use environment variable for base URL

  try {
    const response = await axios({
      url: `${baseUrl}${url}`,
      method: options.method || 'GET',
      headers: {
        'Accept': 'application/json',
        // Only set Content-Type for JSON requests
        ...(options.body instanceof FormData ? {} : { 'Content-Type': 'application/json' }),
        ...options.headers,
      },
      data: options.body, // Axios uses 'data' for the request body
      responseType: 'text', // Set responseType to 'text' if expecting non-JSON
    });

    // If the response is not JSON, handle it as text or another format
    try {
      return JSON.parse(response.data);
    } catch (e) {
      return response.data; // Return as text if not JSON
    }
  } catch (error) {
    console.error('Fetcher error:', error); // Log the error for debugging
    if (error.response && error.response.data) {
      throw new Error(error.response.data.message || 'An error occurred');
    } else {
      throw new Error(error.message || 'An unexpected error occurred');
    }
  }
};
