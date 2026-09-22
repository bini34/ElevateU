'use client';

import { useContext, useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { AuthContext } from '@/context/AuthContext';
import { signIn, signUp } from '@/lib/auth';
import { forgotPassword, resetPassword } from '@/lib/profile';
import { authFailure, recoveryMessage, validateAuth } from '@/lib/auth-form';

export function useAuthForm(kind, initialValues, token) {
  const [values, setValues] = useState(initialValues);
  const [errors, setErrors] = useState({});
  const [message, setMessage] = useState('');
  const [pending, setPending] = useState(false);
  const [succeeded, setSucceeded] = useState(false);
  const [focusVersion, setFocusVersion] = useState(0);
  const focusField = useRef(null);
  const locked = useRef(false);
  const formRef = useRef(null);
  const feedbackRef = useRef(null);
  const { login, authUser, clearLocalSession } = useContext(AuthContext);
  const router = useRouter();

  useEffect(() => {
    if (!focusVersion) return;
    const first = focusField.current;
    if (first) formRef.current?.elements.namedItem(first)?.focus();
    else feedbackRef.current?.focus();
  }, [focusVersion]);

  const change = event => {
    const { name, value } = event.target;
    setValues(previous => ({ ...previous, [name]: value }));
    setErrors(previous => { const next = { ...previous }; delete next[name]; return next; });
  };

  const submit = async event => {
    event.preventDefault();
    if (locked.current || succeeded) return;
    const invalid = validateAuth(kind, values);
    setErrors(invalid);
    setMessage('');
    focusField.current = Object.keys(invalid)[0];
    if (Object.keys(invalid).length) { setFocusVersion(value => value + 1); return; }
    locked.current = true;
    setPending(true);
    const data = Object.fromEntries(Object.entries(values).map(([key, value]) => [key, key.startsWith('password') ? value : value.trim()]));
    try {
      const response = kind === 'login' ? await signIn(data.email, data.password)
        : kind === 'register' ? await signUp(data.user_name, data.first_name, data.last_name, data.email, data.password, data.password_confirmation)
        : kind === 'forgot' ? await forgotPassword(data.email) : await resetPassword({ ...data, token });
      if (response?.status !== 'success' || ((kind === 'login' || kind === 'register') && (!response.data?.user?.id || typeof response.data?.token !== 'string' || !response.data.token))) {
        throw Object.assign(new Error('Invalid response'), { status: 502 });
      }
      setSucceeded(true);
      if (kind === 'login' || kind === 'register') {
        login(response.data.user, response.data.token);
        router.replace('/');
      } else {
        if (kind === 'reset' && authUser?.email?.toLowerCase() === data.email.toLowerCase()) clearLocalSession();
        setMessage(kind === 'forgot' ? recoveryMessage : 'Your password has been reset. Sign in with your new password.');
        focusField.current = null;
        setValues(previous => ({ ...previous, password: '', password_confirmation: '' }));
        setFocusVersion(value => value + 1);
      }
    } catch (error) {
      const failure = authFailure(kind, error);
      setErrors(failure.errors);
      setMessage(failure.message);
      focusField.current = Object.keys(failure.errors)[0];
      setFocusVersion(value => value + 1);
    } finally {
      locked.current = false;
      setPending(false);
    }
  };
  return { values, errors, message, pending, succeeded, formRef, feedbackRef, change, submit };
}
