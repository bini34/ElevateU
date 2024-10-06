import Layout from '@/components/Layout';
import avator from '../../../public/logo/logo.png';
import Image from 'next/image';
import ChatBubble from '../../components/ChatBubble';
import useChat from '../hooks/useChat';

export default function Chat() {
  const { messages } = useChat();

  return (
    <Layout>
      {/* Header Section */}
      <header className="absolute top-0 right-0 left-0 py-5 px-7 w-full ">
            <div className="flex items-center gap-4 w-full">
                <div className="relative">
                <Image className="rounded-full" width={40} height={40} src={avator} alt="avatar" />
                </div>
                <div className="font-medium dark:text-white hide-on-100px">
                <div className="font-bold">Jese Leos</div>
                <div className="text-sm text-gray-500 dark:text-gray-400">Last seen</div>
                </div>
            </div>
    </header>
    <hr />

      <main className='h-full w-full'>
      <div className="chat-container">
      {messages.map((msg) => (
        <ChatBubble key={msg.id} message={msg} />
      ))}
    </div>
      </main>

      {/* Chat Section */}
      <div className="flex justify-center items-center w-full relative bottom-12 ">
        <div className="w-full  px-4">
          <div className="flex items-center bg-[#f4f4f4] rounded-full shadow-md px-4 py-2">
            {/* Emoji Button */}
            <button className="text-gray-500 hover:text-gray-700 focus:outline-none">
              <svg
                className="w-6 h-6"
                fill="currentColor"
                viewBox="0 0 24 24"
                aria-hidden="true"
              >
                <path d="M15.83 10.997a1.167 1.167 0 1 0 1.167 1.167 1.167 1.167 0 0 0-1.167-1.167Zm-6.5 1.167a1.167 1.167 0 1 0-1.166 1.167 1.167 1.167 0 0 0 1.166-1.167Zm5.163 3.24a3.406 3.406 0 0 1-4.982.007 1 1 0 1 0-1.557 1.256 5.397 5.397 0 0 0 8.09 0 1 1 0 0 0-1.55-1.263ZM12 .503a11.5 11.5 0 1 0 11.5 11.5A11.513 11.513 0 0 0 12 .503Zm0 21a9.5 9.5 0 1 1 9.5-9.5 9.51 9.51 0 0 1-9.5 9.5Z"></path>
              </svg>
            </button>

            {/* Message Input */}
            <div className="flex-grow mx-3">
              <input
                type="text"
                placeholder="Message..."
                className="w-full bg-transparent outline-none active:border-none border-none text-gray-700  placeholder-gray-400"
              />
            </div>

            {/* Voice Button */}
            <button className="text-gray-500 hover:text-gray-700 focus:outline-none">
              <svg
                className="w-6 h-6"
                fill="currentColor"
                viewBox="0 0 24 24"
                aria-hidden="true"
              >
                <path
                  fill="none"
                  stroke="currentColor"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  d="M19.5 10.671v.897a7.5 7.5 0 0 1-15 0v-.897"
                />
                <line
                  fill="none"
                  stroke="currentColor"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  x1="12"
                  x2="12"
                  y1="19.068"
                  y2="22"
                />
                <line
                  fill="none"
                  stroke="currentColor"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  x1="8.706"
                  x2="15.104"
                  y1="22"
                  y2="22"
                />
                <path
                  fill="none"
                  stroke="currentColor"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  d="M12 15.745a4 4 0 0 1-4-4V6a4 4 0 0 1 8 0v5.745a4 4 0 0 1-4 4Z"
                />
              </svg>
            </button>

            {/* Add Media Button */}
            <button className="text-gray-500 hover:text-gray-700 focus:outline-none mx-3">
              <svg
                className="w-6 h-6"
                fill="currentColor"
                viewBox="0 0 24 24"
                aria-hidden="true"
              >
                <path
                  d="M6.549 5.013A1.557 1.557 0 1 0 8.106 6.57a1.557 1.557 0 0 0-1.557-1.557Z"
                  fillRule="evenodd"
                />
                <path
                  fill="none"
                  stroke="currentColor"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  d="m2 18.605 3.901-3.9a.908.908 0 0 1 1.284 0l2.807 2.806a.908.908 0 0 0 1.283 0l5.534-5.534a.908.908 0 0 1 1.283 0l3.905 3.905"
                />
                <path
                  fill="none"
                  stroke="currentColor"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  d="M18.44 2.004A3.56 3.56 0 0 1 22 5.564v12.873a3.56 3.56 0 0 1-3.56 3.56H5.568a3.56 3.56 0 0 1-3.56-3.56V5.563a3.56 3.56 0 0 1 3.56-3.56Z"
                />
              </svg>
            </button>

            {/* Like Button */}
            
          </div>
        </div>
      </div>
    </Layout>
  );
}
