"use client";
import { useState } from 'react';
import { fetcher } from '../utils/fetcher';
export const useSignIn = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const signIn = async (email, password) => {
    setLoading(true);
    setError(null);

    try {
      const data = await fetcher('/api/auth/login', {
        method: 'post', // Changed to POST
        headers: {
          'Content-Type': 'application/json', // Added Content-Type header
        },
        body: JSON.stringify({ email, password }),
      });
    

      return data;
    } catch (err) {
      setError(err.message || 'An unexpected error occurred');
    } finally {
      setLoading(false);
    }
  };

  return { signIn, loading, error };
};
