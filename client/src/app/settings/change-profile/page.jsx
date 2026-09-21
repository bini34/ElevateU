"use client"
import { useContext, useEffect, useRef, useState } from 'react';
import Image from 'next/image';
import toast from 'react-hot-toast';
import avator from '../../../../public/images/avator.png';
import { AuthContext } from '@/context/AuthContext';
import { fetcher } from '@/utils/fetcher';
import { updateProfile, uploadAvatar } from '@/lib/profile';

export default function ChangeProfile() {
    const { authUser, updateUser } = useContext(AuthContext);
    const [form, setForm] = useState({
        first_name: '',
        last_name: '',
        bio: '',
        location: '',
        birthdate: '',
    });
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [uploading, setUploading] = useState(false);
    const fileInputRef = useRef(null);

    // Prefill from the server (fresher than localStorage)
    useEffect(() => {
        let cancelled = false;
        fetcher('/auth/me')
            .then((res) => {
                if (cancelled) return;
                const user = res.data.user;
                updateUser(user);
                setForm({
                    first_name: user.profile?.first_name ?? '',
                    last_name: user.profile?.last_name ?? '',
                    bio: user.profile?.bio ?? '',
                    location: user.profile?.location ?? '',
                    birthdate: user.profile?.birthdate ?? '',
                });
            })
            .catch(() => toast.error('Could not load your profile.'))
            .finally(() => !cancelled && setLoading(false));
        return () => {
            cancelled = true;
        };
        // eslint-disable-next-line react-hooks/exhaustive-deps -- run once on mount
    }, []);

    const setField = (field) => (e) => setForm((f) => ({ ...f, [field]: e.target.value }));

    const handleSave = async (e) => {
        e.preventDefault();
        if (!form.first_name.trim() || !form.last_name.trim()) {
            toast.error('First and last name are required.');
            return;
        }
        setSaving(true);
        try {
            const res = await updateProfile({
                first_name: form.first_name.trim(),
                last_name: form.last_name.trim(),
                bio: form.bio || null,
                location: form.location || null,
                birthdate: form.birthdate || null,
            });
            updateUser(res.data.user);
            toast.success('Profile updated!');
        } catch (err) {
            toast.error(err.message || 'Could not save your profile.');
        } finally {
            setSaving(false);
        }
    };

    const handleAvatarChange = async (e) => {
        const file = e.target.files?.[0];
        e.target.value = '';
        if (!file) return;
        if (!file.type.startsWith('image/')) {
            toast.error('Please choose an image file.');
            return;
        }
        setUploading(true);
        try {
            const res = await uploadAvatar(file);
            updateUser(res.data.user);
            toast.success('Avatar updated!');
        } catch (err) {
            toast.error(err.message || 'Could not upload the avatar.');
        } finally {
            setUploading(false);
        }
    };

    const displayName = `${form.first_name} ${form.last_name}`.trim() || authUser?.user_name || '';

    if (loading) {
        return (
            <div className="w-full max-w-xl mx-auto p-6 animate-pulse flex flex-col gap-4">
                <div className="h-24 bg-gray-100 rounded-2xl" />
                <div className="h-10 bg-gray-100 rounded-lg" />
                <div className="h-10 bg-gray-100 rounded-lg" />
                <div className="h-24 bg-gray-100 rounded-lg" />
            </div>
        );
    }

    return (
        <div className="w-full max-w-xl mx-auto p-4 sm:p-6">
            <h1 className="text-xl font-bold mb-6">Edit profile</h1>

            {/* Avatar */}
            <div className="flex flex-wrap items-center gap-4 bg-gray-50 rounded-2xl p-4 mb-6">
                <Image
                    className="rounded-full object-cover w-16 h-16"
                    width={64}
                    height={64}
                    src={authUser?.profile?.profile_picture_URL || avator}
                    alt="Your avatar"
                />
                <div className="flex min-w-0 flex-1 flex-col break-words">
                    <p className="font-semibold">{displayName}</p>
                    <p className="text-sm text-gray-500">@{authUser?.user_name}</p>
                </div>
                <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    disabled={uploading}
                    className="ml-auto w-full sm:w-auto px-4 py-2 rounded-full border border-gray-300 text-sm font-semibold hover:bg-gray-100 disabled:opacity-50"
                >
                    {uploading ? 'Uploading…' : 'Change photo'}
                </button>
                <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={handleAvatarChange}
                />
            </div>

            {/* Profile fields */}
            <form onSubmit={handleSave} className="flex flex-col gap-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="flex flex-col gap-1">
                        <label htmlFor="first_name" className="text-sm font-medium text-gray-700">First name</label>
                        <input
                            id="first_name"
                            type="text"
                            value={form.first_name}
                            onChange={setField('first_name')}
                            maxLength={255}
                            required
                            className="border border-gray-300 rounded-lg p-2.5 text-sm focus:ring-2 focus:ring-red-400 focus:border-red-400 outline-none"
                        />
                    </div>
                    <div className="flex flex-col gap-1">
                        <label htmlFor="last_name" className="text-sm font-medium text-gray-700">Last name</label>
                        <input
                            id="last_name"
                            type="text"
                            value={form.last_name}
                            onChange={setField('last_name')}
                            maxLength={255}
                            required
                            className="border border-gray-300 rounded-lg p-2.5 text-sm focus:ring-2 focus:ring-red-400 focus:border-red-400 outline-none"
                        />
                    </div>
                </div>

                <div className="flex flex-col gap-1">
                    <label htmlFor="bio" className="text-sm font-medium text-gray-700">Bio</label>
                    <textarea
                        id="bio"
                        value={form.bio ?? ''}
                        onChange={setField('bio')}
                        maxLength={255}
                        rows={3}
                        placeholder="Tell people a little about yourself"
                        className="border border-gray-300 rounded-lg p-2.5 text-sm focus:ring-2 focus:ring-red-400 focus:border-red-400 outline-none resize-none"
                    />
                    <span className="text-xs text-gray-400 text-right">{(form.bio ?? '').length}/255</span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="flex flex-col gap-1">
                        <label htmlFor="location" className="text-sm font-medium text-gray-700">Location</label>
                        <input
                            id="location"
                            type="text"
                            value={form.location ?? ''}
                            onChange={setField('location')}
                            maxLength={255}
                            placeholder="City, Country"
                            className="border border-gray-300 rounded-lg p-2.5 text-sm focus:ring-2 focus:ring-red-400 focus:border-red-400 outline-none"
                        />
                    </div>
                    <div className="flex flex-col gap-1">
                        <label htmlFor="birthdate" className="text-sm font-medium text-gray-700">Birthday</label>
                        <input
                            id="birthdate"
                            type="date"
                            value={form.birthdate ?? ''}
                            onChange={setField('birthdate')}
                            max={new Date().toISOString().split('T')[0]}
                            className="border border-gray-300 rounded-lg p-2.5 text-sm focus:ring-2 focus:ring-red-400 focus:border-red-400 outline-none"
                        />
                    </div>
                </div>

                <button
                    type="submit"
                    disabled={saving}
                    className="mt-2 bg-red-500 hover:bg-red-400 text-white font-semibold rounded-full py-2.5 disabled:opacity-50 transition-colors"
                >
                    {saving ? 'Saving…' : 'Save changes'}
                </button>
            </form>
        </div>
    );
}
