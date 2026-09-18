"use client"
import React, { createContext, useState, useEffect } from 'react';
import { setToken, getToken, removeToken, signOut } from '@/lib/auth';
import { disconnectEcho } from '@/lib/echo';
import toast from 'react-hot-toast';
import { fetcher } from '@/utils/fetcher';

const AuthContext = createContext();

const AuthProvider = ({ children }) => {
  const [authUser, setAuthUser] = useState(null);
  const [authToken, setAuthToken] = useState(null);

  useEffect(() => {
    let active = true;
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
        if (!active || getToken() !== savedToken) return;
        const user = response.data?.user;
        if (!user?.id) throw new Error('The server returned an invalid session.');
        localStorage.setItem('user', JSON.stringify(user));
        setAuthUser(user);
        setAuthToken(savedToken);
      }).catch((error) => {
        if (active && getToken() === savedToken && error.status !== 401) {
          toast.error('Could not verify your session. Please check your connection.');
        }
      });
    } else {
      localStorage.removeItem('user');
    }
    return () => { active = false; };
  }, []);

  const login = (userData, token) => {
    localStorage.setItem('user', JSON.stringify(userData));
    setToken(token);
    setAuthUser(userData);
    setAuthToken(token);
  };

  // Refresh the stored user after profile edits (keeps the token untouched)
  const updateUser = (userData) => {
    localStorage.setItem('user', JSON.stringify(userData));
    setAuthUser(userData);
  };

  const logout = () => {
    // Revoke the token server-side (best effort), then clear local state
    signOut().catch(() => {
      toast.error('Signed out on this device, but the server session could not be revoked.');
    });
    disconnectEcho();
    removeToken();
    localStorage.removeItem('user');
    setAuthUser(null);
    setAuthToken(null);
  };

  return (
    <AuthContext.Provider value={{ authUser, authToken, login, logout, updateUser }}>
      {children}
    </AuthContext.Provider>
  );
};

export { AuthProvider, AuthContext };
