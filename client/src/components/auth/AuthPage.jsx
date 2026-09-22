'use client';

import { useContext, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { AuthContext } from '@/context/AuthContext';
import { AuthLayout } from '@/components/layout/AuthLayout';
import { LoadingState, ErrorState } from '@/components/ui/State';
import { Button } from '@/components/ui/Button';

export function AuthPage({ title, description, children, reset = false, signup = false }) {
  const { sessionStatus, retrySession, clearLocalSession } = useContext(AuthContext);
  const router = useRouter();
  const redirecting = sessionStatus === 'authenticated' && !reset;
  useEffect(() => { if (redirecting) router.replace('/'); }, [redirecting, router]);
  return <main className="auth-page"><AuthLayout title={title} description={description}
    headerAction={<>{signup ? 'Already a member? ' : 'New here? '}<Link className="auth-link" href={signup ? '/signin' : '/signup'}>{signup ? 'Sign in' : 'Create an account'} <span aria-hidden="true">→</span></Link></>}
    footer={<p>Progress, not perfection.</p>}>
    {sessionStatus === 'initializing' || redirecting ? <LoadingState label={redirecting ? 'Opening your home…' : 'Checking your session…'} />
      : sessionStatus === 'unavailable' && !reset ? <><ErrorState title="Could not verify your session" description="Check your connection and try again, or sign in again on this device." onRetry={retrySession} /><Button variant="ghost" onClick={clearLocalSession}>Sign in again</Button></>
        : <>{sessionStatus === 'unavailable' && reset && <p role="alert" className="auth-feedback auth-feedback-error mb-6">We could not verify your current session. You can still use your password reset link.</p>}{children}</>}
  </AuthLayout></main>;
}
