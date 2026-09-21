import { Bell, House, MessageCircle, Plus, Settings, UserRound, Users, type LucideIcon } from 'lucide-react';

export type NavigationItem = { href: string; label: string; shortLabel?: string; icon: LucideIcon; badge?: number };
export const isActiveRoute = (pathname: string, href: string) => pathname === href || (href !== '/' && pathname.startsWith(`${href}/`));
export function appNavigation(username?: string, unread = 0): NavigationItem[] {
  return [
    { href: '/', label: 'Home', icon: House },
    { href: '/groups', label: 'Communities', shortLabel: 'Groups', icon: Users },
    { href: '/chat', label: 'Messages', shortLabel: 'Chats', icon: MessageCircle },
    { href: '/notifications', label: 'Notifications', shortLabel: 'Alerts', icon: Bell, badge: unread },
    ...(username ? [{ href: `/${encodeURIComponent(username)}`, label: 'Profile', icon: UserRound }] : []),
    { href: '/settings', label: 'Settings', icon: Settings },
  ];
}
export function mobileNavigation(unread = 0): NavigationItem[] {
  const items = appNavigation(undefined, unread);
  return [items[0], items[2], { href: '/create-post', label: 'Create post', shortLabel: 'Share', icon: Plus }, items[1], items[3], items[4]];
}
