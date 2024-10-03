// hooks/useSignIn.ts
import { useState } from 'react';
import { fetcher } from '../utils/fetcher';

export const useSignIn = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const signIn = async (email: string, password: string) => {
    setLoading(true);
    setError(null);

    try {
      const data = await fetcher('/api/auth/signin', {
        method: 'POST',
        body: JSON.stringify({ email, password }),
      });

      // Handle successful login, such as storing token in cookies/localStorage
      // But ideally, tokens should be managed on the server-side
      return data;
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return { signIn, loading, error };
};
