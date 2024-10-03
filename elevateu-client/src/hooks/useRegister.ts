// hooks/useRegister.ts
import { useState } from 'react';
import { fetcher } from '../utils/fetcher';

export const useRegister = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const register = async (username:string, email: string, password: string) => {
    setLoading(true);
    setError(null);

    try {
      const data = await fetcher('/api/auth/register', {
        method: 'POST',
        body: JSON.stringify({ email, password }),
      });

      // Handle successful registration, like redirecting or storing user details
      return data;
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return { register, loading, error };
};
