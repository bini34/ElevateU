// lib/auth.ts
import Fetch  from "./fetcher";
export const setToken = (token) => {
    localStorage.setItem('token', token); // Or better: set it in cookies
  };
  
  export const getToken = () => {
    return localStorage.getItem('token');
  };
  
  export const removeToken = () => {
    localStorage.removeItem('token');
  };
  

  
  export const signUp = async (user_name, first_name, last_name, email, password, confirmPassword) => {
    const data = await Fetch('/auth/register', 'POST', { user_name, first_name, last_name, email, password, confirmPassword });
    setToken(data.token);
    return data;
  };
  
  export const signIn = async (email, password) => {
    if (!email || !password) {
      throw new Error('Email and password are required');
    }
    const data = await Fetch('/auth/login', 'POST', { email, password });
    setToken(data.token);
    return data;
  };
  
  export const forgetPassword = async (email) => {
    if (!email) {
      throw new Error('Email is required');
    }
    return await Fetch('/api/forget-password', 'POST', { email });
  };
  
  export const socialSignIn = async (provider) => {
    const data = await Fetch('/auth/social-login', 'POST',);
    setToken(data.token);
    return data;
  }