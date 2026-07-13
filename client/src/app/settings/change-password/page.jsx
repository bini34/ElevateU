"use client"
import { useState } from 'react';
import toast from 'react-hot-toast';
import { changePassword } from '@/lib/profile';

export default function ChangePassword() {
    const [current, setCurrent] = useState('');
    const [password, setPassword] = useState('');
    const [confirm, setConfirm] = useState('');
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState('');

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');

        if (password.length < 8) {
            setError('The new password must be at least 8 characters.');
            return;
        }
        if (password !== confirm) {
            setError('The new passwords do not match.');
            return;
        }
        if (password === current) {
            setError('The new password must be different from the current one.');
            return;
        }

        setSaving(true);
        try {
            await changePassword(current, password, confirm);
            toast.success('Password changed. Other sessions were signed out.');
            setCurrent('');
            setPassword('');
            setConfirm('');
        } catch (err) {
            const message = err.message || 'Could not change the password.';
            setError(message);
            toast.error(message);
        } finally {
            setSaving(false);
        }
    };

    return (
        <form
            onSubmit={handleSubmit}
            className="flex flex-col gap-4 m-auto w-full max-w-md border border-gray-200 rounded-2xl p-6 my-10"
        >
            <h1 className="text-xl font-bold text-center pb-4">Change password</h1>

            <div className="flex flex-col gap-1">
                <label htmlFor="current" className="text-sm font-medium text-gray-700">Current password</label>
                <input
                    id="current"
                    type="password"
                    autoComplete="current-password"
                    value={current}
                    onChange={(e) => setCurrent(e.target.value)}
                    required
                    className="border border-gray-300 rounded-lg p-2.5 text-sm focus:ring-2 focus:ring-red-400 focus:border-red-400 outline-none"
                />
            </div>

            <div className="flex flex-col gap-1">
                <label htmlFor="new" className="text-sm font-medium text-gray-700">New password</label>
                <input
                    id="new"
                    type="password"
                    autoComplete="new-password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    minLength={8}
                    required
                    className="border border-gray-300 rounded-lg p-2.5 text-sm focus:ring-2 focus:ring-red-400 focus:border-red-400 outline-none"
                />
                <span className="text-xs text-gray-400">At least 8 characters.</span>
            </div>

            <div className="flex flex-col gap-1">
                <label htmlFor="confirm" className="text-sm font-medium text-gray-700">Confirm new password</label>
                <input
                    id="confirm"
                    type="password"
                    autoComplete="new-password"
                    value={confirm}
                    onChange={(e) => setConfirm(e.target.value)}
                    minLength={8}
                    required
                    className="border border-gray-300 rounded-lg p-2.5 text-sm focus:ring-2 focus:ring-red-400 focus:border-red-400 outline-none"
                />
            </div>

            {error && <p className="text-sm text-red-500" role="alert">{error}</p>}

            <button
                type="submit"
                disabled={saving}
                className="bg-red-500 hover:bg-red-400 text-white font-semibold rounded-full py-2.5 disabled:opacity-50 transition-colors"
            >
                {saving ? 'Updating…' : 'Update password'}
            </button>
        </form>
    );
}
