import Image from 'next/image';
import Link from 'next/link';
import avator from '../../public/logo/logo.png';

export default function GroupChatList({ groups }) {
 
  return (
    <>
      {groups.map((group, index) => (
          <Link key={index} href={`/groups/group`} passHref className="flex flex-col gap-2 w-full cursor-pointer p-2 rounded-md transition-colors duration-200 hover:bg-white hover:bg-opacity-70 active:bg-white active:bg-opacity-70 dark:hover:bg-gray-700 dark:active:bg-gray-600">
            <div className="flex -space-x-4 rtl:space-x-reverse">
              <Image className="w-10 h-10 border-2 border-white rounded-full dark:border-gray-800" src={avator} alt="Avatar" width={40} height={40} />
              <Image className="w-10 h-10 border-2 border-white rounded-full dark:border-gray-800" src={avator} alt="Avatar" width={40} height={40} />
              <Image className="w-10 h-10 border-2 border-white rounded-full dark:border-gray-800" src={avator} alt="Avatar" width={40} height={40} />
              <span className="flex items-center justify-center w-10 h-10 text-xs font-medium text-white bg-gray-700 border-2 border-white rounded-full hover:bg-gray-600 dark:border-gray-800">+99</span>
            </div>

            <div className="font-medium dark:text-white hide-on-100px">
              <div className="font-bold">{group.name}</div>
              <div className="text-sm text-gray-500 dark:text-gray-400 truncate">{group.lastmessage}</div>
            </div>
        </Link>
      ))}
    </>
  );
}