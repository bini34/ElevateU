"use client";
import { useState } from 'react';
import { fetcher } from '../utils/fetcher';

export const useRegister = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const register = async (user_name, first_name, last_name, email, password, password_confirmation) => {
    setLoading(true);
    setError(null);

    try {
      const data = await fetcher('/auth/register', {
        method: 'post',
        body: JSON.stringify({ first_name, last_name, user_name, email, password, password_confirmation }),
      });
      console.log("data from sign up hooks" + data);

    
      return data;
    } catch (err) {
      console.log("error from reg hooks", err);
      const errorMessage = err.response?.data?.message || 'An unexpected error occurred';
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  return { register, loading, error };
};
