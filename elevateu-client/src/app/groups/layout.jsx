import Layout from '@/components/Layout';
import avator from '../../../public/logo/logo.png';
import Image from 'next/image';
import GroupChatList from '@/components/GroupChatList'; // Ensure this is the correct import
// import useChat from '../../hooks/useChat';

export default function GroupChat({ children }) { // Added children as a prop

  const groups = [
    {
      name: 'Developers Group',
      lastmessage: 'Hey team, the new update is live!',
    },
    {
      name: 'Designers Group',
      lastmessage: 'Check out the new design mockups.',
    },
    {
      name: 'Marketing Team',
      lastmessage: 'Campaign launch is scheduled for next week.',
    },
    {
      name: 'HR Department',
      lastmessage: 'Please submit your timesheets by Friday.',
    },
    {
      name: 'Project Managers',
      lastmessage: 'Meeting rescheduled to 3 PM tomorrow.',
    },
    {
      name: 'Designers Group',
      lastmessage: 'Check out the new design mockups.',
    },
    {
      name: 'Marketing Team',
      lastmessage: 'Campaign launch is scheduled for next week.',
    },
    {
      name: 'HR Department',
      lastmessage: 'Please submit your timesheets by Friday.',
    },
    {
      name: 'Project Managers',
      lastmessage: 'Meeting rescheduled to 3 PM tomorrow.',
    },
  ];
  
  // const { messages } = useChat();

  return (
    <Layout>
      <div className="flex flex-col md:flex-row w-full min-h-screen rounded-l-[80px] border-l-3 border-t-3 border-b-3 border-r-0 border-solid border-black bg-slate-300">
        <div className="flex flex-col gap-8 max-h-screen w-full md:w-[300px] pt-20 pb-20 ">
          <div className="flex-1 flex-col  gap-4 overflow-y-auto no-scrollbar">
            <GroupChatList groups={groups} />
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
