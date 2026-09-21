"use client"
import Layout from '@/components/Layout';
import GroupChatList from '@/components/GroupChatList';
import { useState } from 'react';
import { usePathname } from 'next/navigation';
import CreateGroup from '@/components/CreateGroup';
export default function GroupLayout({ children }) {
  const pathname = usePathname();
  // Mobile is master-detail: the list at /groups, the chat deeper
  const inGroupChat = pathname !== '/groups';

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [listVersion, setListVersion] = useState(0); // bump to refetch the list
  const handleButtonClick = () => {
    setIsModalOpen(true);
  };


  return (
    <Layout>
      <div className="app-workspace">
        <div className={`${inGroupChat ? 'hidden md:flex' : 'flex'} app-workspace-list flex-col gap-4 max-h-screen`}>
          <div className="flex">
            <form className="w-full px-2">
              <div className="relative">
                <div className="absolute inset-y-0 start-0 flex items-center ps-3 pointer-events-none">
                  <svg className="w-4 h-4 text-gray-500 dark:text-gray-400" aria-hidden="true" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 20 20">
                    <path stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="m19 19-4-4m0-7A7 7 0 1 1 1 8a7 7 0 0 1 14 0Z" />
                  </svg>
                </div>
                <input type="search" disabled aria-label="Search is not available yet" className="block w-full p-2 ps-10 text-sm text-gray-900 border ring-black rounded-full bg-gray-50 border-black focus:ring-black focus:border-black" placeholder="Search unavailable" />
              </div>
            </form>
            <button aria-label='Create community' className='pr-2' onClick={handleButtonClick}>
              <svg className="w-[36px] h-[36px] text-gray-800 dark:text-white" aria-hidden="true" xmlns="http://www.w3.org/2000/svg" width="24" height="24" fill="currentColor" viewBox="0 0 24 24">
                <path fillRule="evenodd" d="M2 12C2 6.477 6.477 2 12 2s10 4.477 10 10-4.477 10-10 10S2 17.523 2 12Zm11-4.243a1 1 0 1 0-2 0V11H7.757a1 1 0 1 0 0 2H11v3.243a1 1 0 1 0 2 0V13h3.243a1 1 0 1 0 0-2H13V7.757Z" clipRule="evenodd" />
              </svg>
            </button>
          </div>

          <div className="flex-1 flex-col gap-4 overflow-y-auto no-scrollbar">
            <GroupChatList key={listVersion} />
          </div>
        </div>
        <main className={`${inGroupChat ? 'flex' : 'hidden'} app-workspace-main md:flex flex-col justify-start`}>
          {children}
        </main>

      </div>

      {isModalOpen && (
        <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50">
          <CreateGroup setIsModalOpen={setIsModalOpen} onCreated={() => setListVersion((v) => v + 1)} />
        </div>
      )}

        {/* Chat Section */}
    </Layout>
  );
}
