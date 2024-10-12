import Image from 'next/image';
import avator from '../../public/logo/logo.png';

function ChatHeader() {
    return (
        <header className="relative top-0 right-0 left-0 px-7 w-full border-b border-gray-300 dark:border-gray-700 pb-5 shadow-md">
            <div className="flex items-center gap-4 w-full border-b border-gray-300 dark:border-gray-700">
                <div className="relative">
                    <Image className="rounded-full" width={40} height={40} src={avator} alt="avatar" />
                </div>
                <div className="font-medium dark:text-white hide-on-100px">
                    <div className="font-bold">Jese Leos</div>
                    <div className="text-sm text-gray-500 dark:text-gray-400">Last seen</div>
                </div>
            </div>
        </header>
    );

}

export default ChatHeader;