'use client';

import Link from 'next/link';
import { Input } from '@/components/ui/Field';
import { PasswordInput } from '@/components/ui/PasswordInput';
import { Button } from '@/components/ui/Button';
import { invalidResetMessage } from '@/lib/auth-form';
import { useAuthForm } from './useAuthForm';

const actions = { login: ['Sign In', 'Signing in…'], register: ['Sign up', 'Creating account…'], forgot: ['Send reset instructions', 'Sending instructions…'], reset: ['Reset password', 'Resetting password…'] };

export function AuthForm({ kind, email = '', token = '' }) {
  const form = useAuthForm(kind, { first_name: '', last_name: '', user_name: '', email, password: '', password_confirmation: '' }, token);
  const field = (name, label, autoComplete, extra = {}) => ({ name, label, autoComplete, required: true, value: form.values[name], error: form.errors[name], onChange: form.change, readOnly: form.pending, ...extra });
  if (kind === 'reset' && !token) return <div className="space-y-6"><p role="alert" className="auth-feedback auth-feedback-error">{invalidResetMessage}</p><Link className="auth-link" href="/forget-password">Request a new reset link</Link></div>;
  return <form ref={form.formRef} onSubmit={form.submit} noValidate aria-busy={form.pending} className="auth-fields">
    {form.message && <p ref={form.feedbackRef} tabIndex={-1} role={form.succeeded ? 'status' : 'alert'} className={`auth-feedback ${form.succeeded ? 'auth-feedback-success' : 'auth-feedback-error'}`}>{form.message}</p>}
    {!form.succeeded && <>
      {kind === 'register' && <><div className="auth-name-fields"><Input {...field('first_name', 'First name', 'given-name')} /><Input {...field('last_name', 'Last name', 'family-name')} /></div><Input {...field('user_name', 'Username', 'username', { description: 'This will be your unique name on ElevateU.' })} /></>}
      <Input {...field('email', 'Email', 'email', { type: 'email', inputMode: 'email', autoCapitalize: 'none', spellCheck: false })} />
      {kind !== 'forgot' && <PasswordInput {...field('password', kind === 'reset' ? 'New password' : 'Password', kind === 'login' ? 'current-password' : 'new-password', { description: kind === 'login' ? undefined : 'Use between 8 and 4096 characters.' })} />}
      {(kind === 'register' || kind === 'reset') && <PasswordInput {...field('password_confirmation', kind === 'reset' ? 'Confirm new password' : 'Confirm password', 'new-password')} />}
      {kind === 'login' && <div className="text-right"><Link className="auth-link" href="/forget-password">Forgot password?</Link></div>}
      <Button type="submit" className="w-full" loading={form.pending} loadingLabel={actions[kind][1]}>{actions[kind][0]} <span aria-hidden="true">→</span></Button>
    </>}
    {kind === 'reset' && !form.succeeded && <Link className="auth-link" href="/forget-password">Request a new reset link</Link>}
    {(kind === 'forgot' || kind === 'reset') && <Link className="auth-link text-center" href="/signin">Back to sign in</Link>}
  </form>;
}
