"use client"
import { useState } from 'react';
import Link from 'next/link';
import toast from 'react-hot-toast';
import { forgotPassword } from '@/lib/profile';

export default function ForgetPassword() {
  const [email, setEmail] = useState('');
  const [sending, setSending] = useState(false);
  const [sent, setSent] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) return;
    setSending(true);
    try {
      await forgotPassword(email);
      setSent(true);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Something went wrong. Please try again.');
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="w-full max-w-md flex flex-col mx-auto my-16 justify-center gap-4 px-5">
      <h1 className="text-3xl font-bold">
        <span className="text-red-500">Forgot</span> your password?
      </h1>

      {sent ? (
        <div className="flex flex-col gap-4">
          <p className="text-gray-600">
            If <span className="font-semibold">{email}</span> is registered, a reset link is on its way.
            Follow it to choose a new password.
          </p>
          <Link href="/signin" className="text-red-500 font-semibold hover:underline">
            Back to sign in
          </Link>
        </div>
      ) : (
        <>
          <p className="text-gray-500">
            Enter your account email and we&apos;ll send you a link to reset your password.
          </p>
          <form onSubmit={handleSubmit} className="flex flex-col gap-4">
            <div className="flex flex-col gap-1">
              <label htmlFor="email" className="text-sm font-medium text-gray-700">Email</label>
              <input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                placeholder="you@example.com"
                className="bg-white border border-gray-300 text-gray-900 text-sm rounded-3xl focus:ring-2 focus:ring-red-400 focus:border-red-400 outline-none block w-full p-2.5"
              />
            </div>
            <button
              type="submit"
              disabled={sending || !email}
              className="bg-red-500 text-lg text-white w-full py-2 rounded-3xl hover:bg-red-400 disabled:opacity-50"
            >
              {sending ? 'Sending…' : 'Send reset link'}
            </button>
          </form>
          <p className="text-gray-400 text-center text-sm">
            Remembered it? <Link href="/signin" className="text-red-500">Sign in</Link>
          </p>
        </>
      )}
    </div>
  );
}
