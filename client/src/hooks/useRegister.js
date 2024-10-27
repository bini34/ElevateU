"use client";
import { useState } from 'react';
import { fetcher } from '../utils/fetcher';
import { useAuth } from '@/context/AuthContext';

export const useRegister = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const { setAuthUser,setToken } = useAuth();
  const register = async (user_name, first_name, last_name, email, password, password_confirmation) => {
    setLoading(true);
    setError(null);

    try {
      const data = await fetcher('/api/auth/register', {
        method: 'post',
        body: JSON.stringify({ first_name, last_name, user_name, email, password, password_confirmation }),
      });
      console.log("data from sign up hooks" + data.data);

      if (data.data) {
        setAuthUser(data.data.user);
        setToken(data.data.token);
      }
      return data;
    } catch (err) {
      setError(err.response.data || 'An unexpected error occurred');
    } finally {
      setLoading(false);
    }
  };

  return { register, loading, error };
};
