"use client"
import { usePathname } from 'next/navigation';
import Layout from '@/components/Layout';
import UserChatlist from '@/components/UserChatlist';

export default function ChatLayout({ children }) {
  const pathname = usePathname();
  // Mobile is master-detail: the list at /chat, the conversation deeper
  const inConversation = pathname !== '/chat';

  return (
    <Layout>
      <div className="app-workspace">
        <div className={`${inConversation ? 'hidden md:flex' : 'flex'} app-workspace-list flex-col gap-8 h-[80dvh]`}>
          <div className="flex-1 flex flex-col gap-4 overflow-y-auto no-scrollbar">
            <UserChatlist />
          </div>
        </div>
        <main className={`${inConversation ? 'flex' : 'hidden'} app-workspace-main md:flex flex-col justify-start`}>
          {children}
        </main>
      </div>
    </Layout>
  );
}
