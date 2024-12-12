"use client"
import Layout from '@/components/Layout';
import GroupChatList from '@/components/GroupChatList'; // Ensure this is the correct import
// import useChat from '../../hooks/useChat';
import { useState } from 'react';
// import { useGroup } from '@/hooks/useGroup';
import CreateGroup from '@/components/CreateGroup';
export default function GroupLayout({ children }) {


  const [isModalOpen, setIsModalOpen] = useState(false);
  const handleButtonClick = () => {
    setIsModalOpen(true);
  };


  return (
    <Layout>
      <div className="flex flex-col md:flex-row w-full min-h-screen rounded-l-[80px] border-l-3 border-t-3 border-b-3 border-r-0 border-solid border-black bg-slate-300">
        <div className="flex flex-col gap-4 max-h-screen w-full md:w-[300px] pt-20 pb-20">
          <div className="flex">
            <form className="w-full px-2">
              <div className="relative">
                <div className="absolute inset-y-0 start-0 flex items-center ps-3 pointer-events-none">
                  <svg className="w-4 h-4 text-gray-500 dark:text-gray-400" aria-hidden="true" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 20 20">
                    <path stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="m19 19-4-4m0-7A7 7 0 1 1 1 8a7 7 0 0 1 14 0Z" />
                  </svg>
                </div>
                <input type="search" className="block w-full p-2 ps-10 text-sm text-gray-900 border ring-black rounded-full bg-gray-50 border-black focus:ring-black focus:border-black" placeholder="Search ..." required />
              </div>
            </form>
            <button className='pr-2' onClick={handleButtonClick}>
              <svg className="w-[36px] h-[36px] text-gray-800 dark:text-white" aria-hidden="true" xmlns="http://www.w3.org/2000/svg" width="24" height="24" fill="currentColor" viewBox="0 0 24 24">
                <path fillRule="evenodd" d="M2 12C2 6.477 6.477 2 12 2s10 4.477 10 10-4.477 10-10 10S2 17.523 2 12Zm11-4.243a1 1 0 1 0-2 0V11H7.757a1 1 0 1 0 0 2H11v3.243a1 1 0 1 0 2 0V13h3.243a1 1 0 1 0 0-2H13V7.757Z" clipRule="evenodd" />
              </svg>
            </button>
          </div>

          <div className="flex-1 flex-col gap-4 overflow-y-auto no-scrollbar">
            <GroupChatList />
          </div>
        </div>
        <main className="w-full h-full flex flex-col justify-start pt-5 overflow-y-auto no-scrollbar bg-white rounded-l-[80px] border-l-3 border-t-3 border-b-3 border-r-0 border-solid border-black relative bottom-[15px]">
          {children}
        </main>

      </div>

      {isModalOpen && (
        <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50">
          <CreateGroup setIsModalOpen={setIsModalOpen} />
        </div>
      )}

        {/* Chat Section */}
    </Layout>
  );
}
