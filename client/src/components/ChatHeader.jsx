import Image from 'next/image';
import avatar from '../../public/images/avator.png';
import { useData } from '@/context/DataContext';

function ChatHeader() {
 // Run only once on component mount
 const { data: user } = useData();
 console.log("user from chat header", user?.name)


    return (
        <header className="relative top-0 right-0 left-0 px-7 w-full border-b border-gray-300 dark:border-gray-700 pb-5 shadow-md">
            <div className="flex items-center gap-4 w-full border-b border-gray-300 dark:border-gray-700">
                <div className="relative">
                    <Image 
                        className="rounded-full" 
                        width={40} 
                        height={40} 
                        src={user?.profile_picture_url || avatar} 
                        alt="avatar" 
                    />
                </div>
                <div className="font-medium dark:text-white hide-on-100px">
                    <div className="font-bold">
                        {user?.name || `${user?.first_name || ''} ${user?.last_name || ''}`.trim()}
                    </div>
                    <div className="text-sm text-gray-500 dark:text-gray-400">
                        Last seen recently
                    </div>
                </div>
            </div>
        </header>
    );
}

export default ChatHeader;
