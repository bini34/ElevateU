'use client';

import { Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { AuthPage } from '@/components/auth/AuthPage';
import { AuthForm } from '@/components/auth/AuthForm';
import { LoadingState } from '@/components/ui/State';

function ResetForm() {
  const params = useSearchParams();
  const token = params.get('token') || '';
  const email = params.get('email') || '';
  return <AuthForm key={`${token}:${email}`} kind="reset" token={token} email={email} />;
}

export default function ResetPasswordPage() {
  return <AuthPage title="A fresh start" description="Choose a new password for your account." reset signup><Suspense fallback={<LoadingState label="Opening your reset link…" />}><ResetForm /></Suspense></AuthPage>;
}