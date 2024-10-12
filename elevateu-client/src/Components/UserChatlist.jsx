import Image from 'next/image';
import Link from 'next/link';
import avator from '../../public/logo/logo.png';

export default function UserChatlist({ users }) {
  return (
    <>
      {users.map((user, index) => (
          <Link key={index} href="/chat/chat" passHref className="flex items-center gap-4 w-full cursor-pointer p-2 rounded-md transition-colors duration-200 hover:bg-gray-100 active:bg-gray-200 dark:hover:bg-gray-700 dark:active:bg-gray-600">
            <div className="relative">
              <Image className="rounded-full" width={40} height={40} src={avator} alt="avatar" />
              <span className="bottom-0 left-7 absolute w-3.5 h-3.5 bg-green-400 border-2 border-white dark:border-gray-800 rounded-full"></span>
            </div>
            <div className="font-medium dark:text-white hide-on-100px">
              <div className="font-bold">{user.name}</div>
              <div className="text-sm text-gray-500 dark:text-gray-400">{user.joinedDate}</div>
            </div>
        </Link>
      ))}
    </>
  );
}