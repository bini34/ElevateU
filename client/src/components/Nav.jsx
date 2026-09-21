'use client';
import { useContext } from 'react';
import { usePathname } from 'next/navigation';
import { AuthContext } from '@/context/AuthContext';
import { useNotifications } from '@/context/NotificationContext';
import { NavigationList } from '@/components/layout/NavigationList';
import { appNavigation } from '@/components/layout/navigation';

export default function Nav() {
  const { authUser } = useContext(AuthContext);
  const { unreadCount } = useNotifications();
  return <NavigationList items={appNavigation(authUser?.user_name, unreadCount)} pathname={usePathname()} />;
}
