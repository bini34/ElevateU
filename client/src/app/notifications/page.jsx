"use client"
import { useEffect } from 'react';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import Layout from '@/components/Layout';
import avator from '../../../public/images/avator.png';
import { useNotifications } from '@/context/NotificationContext';
import { notificationHref } from '@/lib/notifications';
import { timeAgo } from '@/lib/format';

export default function NotificationsPage() {
    const router = useRouter();
    const { notifications, unreadCount, loading, error, hasMore, loadNotifications, markRead, markAllRead } = useNotifications();

    useEffect(() => {
        loadNotifications(true);
    }, [loadNotifications]);

    const handleItemClick = (notification) => {
        if (!notification.read_at) markRead(notification.id);
        router.push(notificationHref(notification.data));
    };

    return (
        <Layout>
            <div className="app-page flex flex-col overflow-hidden p-2 md:p-6">
                <div className="sticky top-0 z-10 bg-white/80 backdrop-blur-md px-4 py-4 flex items-center justify-between border-b border-gray-100">
                    <h1 className="font-bold text-xl">Notifications</h1>
                    {unreadCount > 0 && (
                        <button onClick={markAllRead} className="text-sm text-blue-500 hover:underline">
                            Mark all read
                        </button>
                    )}
                </div>

                <div className="w-full max-w-xl mx-auto pb-24">
                    {error && (
                        <div className="p-4 text-center" role="alert">
                            <p className="text-sm text-red-600">{error}</p>
                            <button className="text-sm text-blue-600 underline" onClick={() => loadNotifications(true)}>Try again</button>
                        </div>
                    )}
                    {loading && notifications.length === 0 && (
                        <div className="flex flex-col gap-3 p-4 animate-pulse">
                            {[...Array(5)].map((_, i) => (
                                <div key={i} className="flex items-center gap-3">
                                    <div className="w-9 h-9 rounded-full bg-gray-200" />
                                    <div className="flex-1 flex flex-col gap-2">
                                        <div className="h-3 w-2/3 bg-gray-200 rounded" />
                                        <div className="h-2 w-1/4 bg-gray-100 rounded" />
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}

                    {!loading && !error && notifications.length === 0 && (
                        <div className="flex flex-col items-center gap-2 py-24 text-center">
                            <p className="text-lg font-semibold">No notifications yet</p>
                            <p className="text-gray-500 text-sm">Likes, comments, and messages will show up here.</p>
                        </div>
                    )}

                    {notifications.map((notification) => (
                        <button
                            key={notification.id}
                            onClick={() => handleItemClick(notification)}
                            className={`w-full text-left px-4 py-3 flex items-start gap-3 hover:bg-gray-50 border-b border-gray-50 ${!notification.read_at ? 'bg-red-50/50' : ''}`}
                        >
                            <Image
                                className="rounded-full object-cover mt-0.5"
                                width={36}
                                height={36}
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

                    {hasMore && !loading && (
                        <button
                            onClick={() => loadNotifications()}
                            className="w-full py-4 text-sm text-blue-500 hover:underline"
                        >
                            Load more
                        </button>
                    )}
                    {loading && notifications.length > 0 && (
                        <p className="text-center text-sm text-gray-400 py-4">Loading…</p>
                    )}
                </div>
            </div>
        </Layout>
    );
}
