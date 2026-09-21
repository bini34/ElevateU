'use client';
import { usePathname } from 'next/navigation';
import { useNotifications } from '@/context/NotificationContext';
import { NavigationList } from '@/components/layout/NavigationList';
import { mobileNavigation } from '@/components/layout/navigation';

export default function BottomNavigation() {
  const { unreadCount } = useNotifications();
  return <NavigationList items={mobileNavigation(unreadCount)} pathname={usePathname()} mobile />;
}
