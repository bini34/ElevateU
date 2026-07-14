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
      <div className="flex flex-col md:flex-row w-full min-h-screen md:rounded-l-[80px] border-l-3 border-t-3 border-b-3 border-r-0 md:border-solid md:border-black sm:bg-slate-300">
        <div className={`${inConversation ? 'hidden md:flex' : 'flex'} flex-col gap-8 h-[89vh] w-full md:w-[300px] md:pt-20 md:pb-20`}>
          <div className="flex-1 flex flex-col gap-4 overflow-y-auto no-scrollbar">
            <UserChatlist />
          </div>
        </div>
        <main className={`${inConversation ? 'flex' : 'hidden'} md:flex w-full h-full flex-col justify-start pt-5 overflow-y-auto no-scrollbar bg-white md:rounded-l-[80px] border-l-3 border-t-3 border-b-3 border-r-0 md:border-solid md:border-black relative md:bottom-[15px]`}>
          {children}
        </main>
      </div>
    </Layout>
  );
}
