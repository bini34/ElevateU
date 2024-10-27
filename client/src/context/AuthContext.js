"use client"
import React, { createContext, useState, useEffect } from 'react';

const AuthContext = createContext();

const AuthProvider = ({ children }) => {
  const [authUser, setAuthUser] = useState(null);
  const [authToken, setAuthToken] = useState(null);
  useEffect(() => {
    // Check local storage for a saved user
    const savedUser = JSON.parse(localStorage.getItem('user'));
    const savedToken = localStorage.getItem('token');
    if (savedUser) {
      setAuthUser(savedUser);
    }
    if (savedToken) {
      setAuthToken(savedToken);
    }
  }, []);

  const login = (userData, token) => {
    localStorage.setItem('user', JSON.stringify(userData));
    localStorage.setItem('token', token);
    setAuthUser(userData);
    setAuthToken(token);
  };

  const logout = () => {
    localStorage.removeItem('user');
    localStorage.removeItem('token');
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
