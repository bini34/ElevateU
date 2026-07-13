"use client"
import { Suspense, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import toast, { Toaster } from 'react-hot-toast';
import { resetPassword } from '@/lib/profile';

function ResetPasswordForm() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const token = searchParams.get('token') ?? '';
    const emailFromLink = searchParams.get('email') ?? '';

    const [email, setEmail] = useState(emailFromLink);
    const [password, setPassword] = useState('');
    const [confirm, setConfirm] = useState('');
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState('');

    if (!token) {
        return (
            <div className="flex flex-col gap-4">
                <p className="text-gray-600">This reset link is invalid or incomplete.</p>
                <Link href="/forget-password" className="text-red-500 font-semibold hover:underline">
                    Request a new link
                </Link>
            </div>
        );
    }

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        if (password.length < 8) {
            setError('The password must be at least 8 characters.');
            return;
        }
        if (password !== confirm) {
            setError('The passwords do not match.');
            return;
        }
        setSaving(true);
        try {
            await resetPassword({ token, email, password, password_confirmation: confirm });
            toast.success('Password reset! Sign in with your new password.');
            router.push('/signin');
        } catch (err) {
            setError(err.message || 'Could not reset the password. The link may have expired.');
        } finally {
            setSaving(false);
        }
    };

    return (
        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
            <div className="flex flex-col gap-1">
                <label htmlFor="email" className="text-sm font-medium text-gray-700">Email</label>
                <input
                    id="email"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    className="bg-white border border-gray-300 text-gray-900 text-sm rounded-3xl focus:ring-2 focus:ring-red-400 focus:border-red-400 outline-none block w-full p-2.5"
                />
            </div>
            <div className="flex flex-col gap-1">
                <label htmlFor="password" className="text-sm font-medium text-gray-700">New password</label>
                <input
                    id="password"
                    type="password"
                    autoComplete="new-password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    minLength={8}
                    required
                    className="bg-white border border-gray-300 text-gray-900 text-sm rounded-3xl focus:ring-2 focus:ring-red-400 focus:border-red-400 outline-none block w-full p-2.5"
                />
            </div>
            <div className="flex flex-col gap-1">
                <label htmlFor="confirm" className="text-sm font-medium text-gray-700">Confirm password</label>
                <input
                    id="confirm"
                    type="password"
                    autoComplete="new-password"
                    value={confirm}
                    onChange={(e) => setConfirm(e.target.value)}
                    minLength={8}
                    required
                    className="bg-white border border-gray-300 text-gray-900 text-sm rounded-3xl focus:ring-2 focus:ring-red-400 focus:border-red-400 outline-none block w-full p-2.5"
                />
            </div>

            {error && <p className="text-sm text-red-500" role="alert">{error}</p>}

            <button
                type="submit"
                disabled={saving}
                className="bg-red-500 text-lg text-white w-full py-2 rounded-3xl hover:bg-red-400 disabled:opacity-50"
            >
                {saving ? 'Resetting…' : 'Reset password'}
            </button>
        </form>
    );
}

export default function ResetPasswordPage() {
    return (
        <div className="w-full max-w-md flex flex-col mx-auto my-16 justify-center gap-4 px-5">
            <Toaster />
            <h1 className="text-3xl font-bold">
                <span className="text-red-500">Choose</span> a new password
            </h1>
            <Suspense fallback={<p className="text-gray-400">Loading…</p>}>
                <ResetPasswordForm />
            </Suspense>
        </div>
    );
}
