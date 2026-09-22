"use client"
import React, { createContext, useState, useEffect, useRef } from 'react';
import { setToken, getToken, removeToken, signOut } from '@/lib/auth';
import { disconnectEcho } from '@/lib/echo';
import toast from 'react-hot-toast';
import { fetcher } from '@/utils/fetcher';

const AuthContext = createContext();

const AuthProvider = ({ children }) => {
  const [authUser, setAuthUser] = useState(null);
  const [authToken, setAuthToken] = useState(null);
  const [sessionStatus, setSessionStatus] = useState('initializing');
  const [verification, setVerification] = useState(0);
  const generation = useRef(0);

  useEffect(() => {
    let active = true;
    const current = generation.current;
    setSessionStatus('initializing');
    // Restore the session from the token cookie + saved user
    let savedUser = null;
    try {
      savedUser = JSON.parse(localStorage.getItem('user'));
    } catch {
      localStorage.removeItem('user');
    }
    const savedToken = getToken();

    if (savedUser && savedToken) {
      setAuthUser(savedUser);
      setAuthToken(savedToken);
    }
    if (savedToken) {
      fetcher('/auth/me', { token: savedToken }).then((response) => {
        if (!active || generation.current !== current || getToken() !== savedToken) return;
        const user = response.data?.user;
        if (!user?.id) throw new Error('The server returned an invalid session.');
        localStorage.setItem('user', JSON.stringify(user));
        setAuthUser(user);
        setAuthToken(savedToken);
        setSessionStatus('authenticated');
      }).catch((error) => {
        if (!active || generation.current !== current) return;
        if (error.status === 401 && !getToken()) {
          setAuthUser(null);
          setAuthToken(null);
          setSessionStatus('guest');
        } else if (getToken() === savedToken) {
          setSessionStatus('unavailable');
          if (!['/signin', '/signup', '/forget-password', '/reset-password'].includes(window.location.pathname)) {
            toast.error('Could not verify your session. Please check your connection.');
          }
        }
      });
    } else {
      localStorage.removeItem('user');
      setSessionStatus('guest');
    }
    return () => { active = false; };
  }, [verification]);

  const login = (userData, token) => {
    generation.current += 1;
    localStorage.setItem('user', JSON.stringify(userData));
    setToken(token);
    setAuthUser(userData);
    setAuthToken(token);
    setSessionStatus('authenticated');
  };

  // Refresh the stored user after profile edits (keeps the token untouched)
  const updateUser = (userData) => {
    localStorage.setItem('user', JSON.stringify(userData));
    setAuthUser(userData);
  };

  const clearLocalSession = () => {
    generation.current += 1;
    disconnectEcho();
    removeToken();
    localStorage.removeItem('user');
    setAuthUser(null);
    setAuthToken(null);
    setSessionStatus('guest');
  };

  const logout = () => {
    // Revoke the token server-side (best effort), then clear local state
    signOut().catch(() => {
      toast.error('Signed out on this device, but the server session could not be revoked.');
    });
    clearLocalSession();
  };

  return (
    <AuthContext.Provider value={{ authUser, authToken, login, logout, updateUser, sessionStatus, clearLocalSession, retrySession: () => setVerification(value => value + 1) }}>
      {children}
    </AuthContext.Provider>
  );
};

export { AuthProvider, AuthContext };
