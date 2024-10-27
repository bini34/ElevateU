import Layout from '@/components/Layout';
import avator from '../../../public/logo/logo.png';
import Image from 'next/image';
import UserChatlist from '@/components/UserChatlist'; // Ensure this is the correct import
// import useChat from '../../hooks/useChat';

export default function Chat({ children }) { // Added children as a prop

   

  // const { messages } = useChat();

  return (
    <Layout>
      <div className="flex flex-col md:flex-row w-full min-h-screen rounded-l-[80px] border-l-3 border-t-3 border-b-3 border-r-0 border-solid border-black bg-slate-300">
        <div className="flex flex-col gap-8 max-h-screen w-full md:w-[300px] pt-20  pb-20 ">
        <div className="flex-1 flex flex-col gap-4 overflow-y-auto no-scrollbar">
          <UserChatlist/>
        </div>
        </div>
        <main className="w-full h-full flex flex-col justify-start pt-5 overflow-y-auto no-scrollbar bg-white rounded-l-[80px] border-l-3 border-t-3 border-b-3 border-r-0 border-solid border-black relative bottom-[15px]">
          {children}
        </main>

      </div>

        {/* Chat Section */}
    </Layout>
  );
}
