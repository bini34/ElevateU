"use client"
import { useEffect, useRef, useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import avator from '../../public/images/avator.png';
import { useNotifications } from '@/context/NotificationContext';
import { notificationHref } from '@/lib/notifications';
import { timeAgo } from '@/lib/format';

export default function NotificationBell() {
    const router = useRouter();
    const { unreadCount, notifications, loading, error, loadNotifications, markRead, markAllRead } = useNotifications();
    const [open, setOpen] = useState(false);
    const menuRef = useRef(null);

    useEffect(() => {
        const handleClickOutside = (event) => {
            if (menuRef.current && !menuRef.current.contains(event.target)) {
                setOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const toggle = () => {
        const next = !open;
        setOpen(next);
        if (next) loadNotifications(true);
    };

    const handleItemClick = (notification) => {
        if (!notification.read_at) markRead(notification.id);
        setOpen(false);
        router.push(notificationHref(notification.data));
    };

    return (
        <div className="relative" ref={menuRef}>
            <button onClick={toggle} aria-label={`Notifications${unreadCount ? ` (${unreadCount} unread)` : ''}`} className="relative">
                <svg className="w-[28px] h-[28px] text-red-600" aria-hidden="true" xmlns="http://www.w3.org/2000/svg" width="24" height="24" fill="none" viewBox="0 0 24 24">
                    <path stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 5.365V3m0 2.365a5.338 5.338 0 0 1 5.133 5.368v1.8c0 2.386 1.867 2.982 1.867 4.175 0 .593 0 1.292-.538 1.292H5.538C5 18 5 17.301 5 16.708c0-1.193 1.867-1.789 1.867-4.175v-1.8A5.338 5.338 0 0 1 12 5.365ZM8.733 18c.094.852.306 1.54.944 2.112a3.48 3.48 0 0 0 4.646 0c.638-.572 1.236-1.26 1.33-2.112h-6.92Z" />
                </svg>
                {unreadCount > 0 && (
                    <span className="absolute -top-1 -right-1 bg-red-500 text-white text-[10px] font-bold rounded-full min-w-4 h-4 px-1 flex items-center justify-center">
                        {unreadCount > 99 ? '99+' : unreadCount}
                    </span>
                )}
            </button>

            {open && (
                <div className="absolute right-0 top-10 w-80 max-w-[90vw] bg-white rounded-xl shadow-lg z-50 border border-gray-100 overflow-hidden">
                    <div className="flex items-center justify-between px-4 py-2 border-b border-gray-100">
                        <span className="font-semibold text-sm">Notifications</span>
                        {unreadCount > 0 && (
                            <button onClick={markAllRead} className="text-xs text-blue-500 hover:underline">
                                Mark all read
                            </button>
                        )}
                    </div>

                    <div className="max-h-96 overflow-y-auto">
                    {error && (
                        <div className="p-4 text-center" role="alert">
                            <p className="text-sm text-red-600">{error}</p>
                            <button className="text-sm text-blue-600 underline" onClick={() => loadNotifications(true)}>Try again</button>
                        </div>
                    )}
                        {loading && notifications.length === 0 && (
                            <p className="p-4 text-sm text-gray-400 text-center">Loading…</p>
                        )}
                        {!loading && !error && notifications.length === 0 && (
                            <p className="p-6 text-sm text-gray-400 text-center">Nothing here yet.</p>
                        )}
                        {notifications.slice(0, 10).map((notification) => (
                            <button
                                key={notification.id}
                                onClick={() => handleItemClick(notification)}
                                className={`w-full text-left px-4 py-3 flex items-start gap-3 hover:bg-gray-50 ${!notification.read_at ? 'bg-red-50/50' : ''}`}
                            >
                                <Image
                                    className="rounded-full object-cover mt-0.5"
                                    width={32}
                                    height={32}
                                    src={notification.data?.actor?.avatar || avator}
                                    alt=""
                                />
                                <span className="flex-1 min-w-0">
                                    <span className="block text-sm text-gray-800">{notification.data?.text}</span>
                                    {notification.data?.snippet && (
                                        <span className="block text-xs text-gray-500 truncate">{notification.data.snippet}</span>
                                    )}
                                    <span className="block text-xs text-gray-400 mt-0.5">{timeAgo(notification.created_at)}</span>
                                </span>
                                {!notification.read_at && <span className="w-2 h-2 rounded-full bg-red-500 mt-2 shrink-0" />}
                            </button>
                        ))}
                    </div>

                    <Link
                        href="/notifications"
                        onClick={() => setOpen(false)}
                        className="block text-center text-sm text-blue-500 hover:bg-gray-50 py-2 border-t border-gray-100"
                    >
                        See all
                    </Link>
                </div>
            )}
        </div>
    );
}
