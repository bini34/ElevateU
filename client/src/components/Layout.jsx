'use client';
import { useContext } from 'react';
import Link from 'next/link';
import Nav from '@/components/Nav';
import BottomNavigation from '@/components/BottomNavigation';
import { AuthContext } from '@/context/AuthContext';
import { AppShell } from '@/components/layout/AppShell';
import { Avatar } from '@/components/ui/Avatar';

export default function Layout({ children }) {
  const { authUser } = useContext(AuthContext);
  const name = [authUser?.profile?.first_name, authUser?.profile?.last_name].filter(Boolean).join(' ') || authUser?.user_name;
  const account = authUser?.user_name ? <Link href={`/${encodeURIComponent(authUser.user_name)}`} className="app-account" aria-label={`Your profile: ${name}`}>
    <Avatar name={name} src={authUser.profile?.profile_picture_URL} /><span className="app-account-copy"><span className="block truncate text-label">{name}</span><span className="block text-caption text-text-muted">Your profile</span></span>
  </Link> : null;
  return <AppShell navigation={<Nav />} mobileNavigation={<BottomNavigation />} account={account}>{children}</AppShell>;
}
