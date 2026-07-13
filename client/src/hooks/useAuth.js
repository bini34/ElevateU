import { useEffect, useState } from 'react';
import { getToken } from '@/lib/token';

export const useAuth = () => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  useEffect(() => {
    setIsAuthenticated(Boolean(getToken()));
  }, []);

  return isAuthenticated;
};
