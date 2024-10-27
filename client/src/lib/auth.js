// lib/auth.ts
export const setToken = (token) => {
    localStorage.setItem('token', token); // Or better: set it in cookies
  };
  
  export const getToken = () => {
    return localStorage.getItem('token');
  };
  
  export const removeToken = () => {
    localStorage.removeItem('token');
  };
  