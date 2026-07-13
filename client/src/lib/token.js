import Cookies from 'js-cookie';

// Single source of truth for the auth token. Stored in a cookie (not
// localStorage) so the Next.js middleware can also read it for route guarding.
const TOKEN_COOKIE = 'token';

export const setToken = (token) => {
  if (typeof window === 'undefined' || !token) return;
  Cookies.set(TOKEN_COOKIE, token, {
    expires: 30, // days — matches the API's personal access token lifetime
    sameSite: 'strict',
    secure: window.location.protocol === 'https:',
  });
};

export const getToken = () => {
  if (typeof window === 'undefined') return undefined;
  return Cookies.get(TOKEN_COOKIE);
};

export const removeToken = () => {
  if (typeof window === 'undefined') return;
  Cookies.remove(TOKEN_COOKIE);
};
