"use client"
import React, { createContext, useState, useEffect } from 'react';

function getCookie(name) {
  const value = `; ${document.cookie}`;
  const parts = value.split(`; ${name}=`);
  if (parts.length === 2) return parts.pop().split(';').shift();
}
const AuthContext = createContext();

const AuthProvider = ({ children }) => {
  const [authUser, setAuthUser] = useState(null);
  const [authToken, setAuthToken] = useState(null);
  useEffect(() => {
    // Check local storage for a saved user
    const savedUser = JSON.parse(localStorage.getItem('user'));
    const savedToken = getCookie('token');

    if (savedUser) {
      setAuthUser(savedUser);
    }
    if (savedToken) {
      setAuthToken(savedToken);
    }
  }, []);

  const login = (userData, token) => {
    localStorage.setItem('user', JSON.stringify(userData));
    document.cookie = `token=${token}; path=/; secure; samesite=strict`;
    setAuthUser(userData);
    setAuthToken(token);
  };

  const logout = () => {
    document.cookie = 'token=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT';
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
