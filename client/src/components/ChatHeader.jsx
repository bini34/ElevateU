import Image from 'next/image';
import avatar from '../../public/images/avator.png';

function ChatHeader({ user, online = false, typing = false, connectionState = 'connected' }) {
    const name = user
        ? `${user.first_name || ''} ${user.last_name || ''}`.trim() || user.user_name || ''
        : '';

    const statusText = typing
        ? 'typing…'
        : online
            ? 'Online'
            : 'Offline';

    return (
        <header className="relative top-0 right-0 left-0 px-7 w-full border-b border-gray-300 dark:border-gray-700 pb-5 shadow-md">
            <div className="flex items-center gap-4 w-full">
                <div className="relative">
                    <Image
                        className="rounded-full"
                        width={40}
                        height={40}
                        src={user?.profile_picture_URL || avatar}
                        alt={`${name} avatar`}
                    />
                    {online && (
                        <span className="bottom-0 left-7 absolute w-3.5 h-3.5 bg-green-400 border-2 border-white dark:border-gray-800 rounded-full"></span>
                    )}
                </div>
                <div className="font-medium dark:text-white hide-on-100px">
                    <div className="font-bold">{name}</div>
                    <div className={`text-sm ${typing ? 'text-green-500' : 'text-gray-500 dark:text-gray-400'}`}>
                        {statusText}
                    </div>
                </div>
                {connectionState !== 'connected' && (
                    <span className="ml-auto text-xs text-amber-600 bg-amber-50 border border-amber-200 rounded-full px-3 py-1">
                        {connectionState === 'connecting' ? 'Reconnecting…' : 'Offline — reconnecting'}
                    </span>
                )}
            </div>
        </header>
    );
}

export default ChatHeader;
