export const fetcher = async (url: string, options: RequestInit = {}) => {
  try {
    const res = await fetch(url, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        ...options.headers,
      },
      credentials: 'include', // Ensures cookies (e.g., tokens) are included
    });

    // Automatically handle errors
    if (!res.ok) {
      const errorData = await res.json();
      throw new Error(errorData.message || 'An error occurred');
    }

    return await res.json();
  } catch (error:any) {
    throw new Error(error.message || 'An unexpected error occurred');
  }
};
