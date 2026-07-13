"use client"
import React, { createContext, useState, useEffect } from 'react';
import { setToken, getToken, removeToken, signOut } from '@/lib/auth';

const AuthContext = createContext();

const AuthProvider = ({ children }) => {
  const [authUser, setAuthUser] = useState(null);
  const [authToken, setAuthToken] = useState(null);

  useEffect(() => {
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
  }, []);

  const login = (userData, token) => {
    localStorage.setItem('user', JSON.stringify(userData));
    setToken(token);
    setAuthUser(userData);
    setAuthToken(token);
  };

  const logout = () => {
    // Revoke the token server-side (best effort), then clear local state
    signOut().catch(() => {});
    removeToken();
    localStorage.removeItem('user');
    setAuthUser(null);
    setAuthToken(null);
  };

  return (
    <AuthContext.Provider value={{ authUser, authToken, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

export { AuthProvider, AuthContext };
