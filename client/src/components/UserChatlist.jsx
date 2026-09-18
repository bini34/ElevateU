"use client";
import { useEffect, useState, useContext } from 'react';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import avator from '../../public/images/avator.png';
import { getMessageCards } from '@/lib/message';
import { useData } from '@/context/DataContext';
import { AuthContext } from '@/context/AuthContext';
import useOnlineUsers from '@/hooks/useOnlineUsers';
import { timeAgo } from '@/lib/format';

export default function UserChatlist() {
  const router = useRouter();
  const { authUser } = useContext(AuthContext);
  const { setData } = useData();
  const { onlineIds, error: presenceError } = useOnlineUsers();
  const [cards, setCards] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    let cancelled = false;

    const fetchCards = async () => {
      setLoading(true);
      setError(null);
      try {
        const res = await getMessageCards();
        if (!cancelled) setCards(Array.isArray(res?.data) ? res.data : []);
      } catch (err) {
        if (!cancelled) setError(err.message || 'Could not load chats.');
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    if (authUser) fetchCards();
    return () => {
      cancelled = true;
    };
  }, [authUser]);

  const handleUserClick = (card) => {
    setData(card);
    if (card.user_id) {
      router.push(`/chat/${card.user_id}`);
    }
  };

  if (loading) {
    return <div className="flex justify-center items-center w-full py-6"><p className="text-gray-400">Loading chats…</p></div>;
  }

  if (error) {
    return <div className="flex flex-col items-center gap-2 w-full py-6"><p className="text-gray-500 text-sm">{error}</p></div>;
  }

  if (cards.length === 0) {
    return <div className="flex justify-center items-center w-full py-6"><p className="text-gray-400 text-sm">No one to chat with yet.</p></div>;
  }

  return (
    <>
      {presenceError && <p role="status" className="px-2 text-sm text-amber-700">{presenceError}</p>}
      {cards.map((card) => {
        const online = onlineIds.has(card.user_id);
        const preview = card.last_message
          ? `${card.last_message_sender_id === authUser?.id ? 'You: ' : ''}${card.last_message}`
          : 'Start a conversation';

        return (
          <div
            key={card.user_id}
            onClick={() => handleUserClick(card)}
            className="flex items-center gap-4 w-full cursor-pointer p-2 rounded-md transition-colors duration-200 hover:bg-gray-100 active:bg-gray-200 dark:hover:bg-gray-700 dark:active:bg-gray-600"
          >
            <div className="relative shrink-0">
              <Image className="rounded-full" width={40} height={40} src={card.profile_picture_URL || avator} alt={`${card.first_name} ${card.last_name} avatar`} />
              {online && (
                <span className="bottom-0 left-7 absolute w-3.5 h-3.5 bg-green-400 border-2 border-white dark:border-gray-800 rounded-full"></span>
              )}
            </div>
            <div className="font-medium dark:text-white hide-on-100px flex-1 min-w-0">
              <div className="flex items-center justify-between gap-2">
                <span className="font-bold truncate">{`${card.first_name} ${card.last_name}`.trim() || card.user_name}</span>
                {card.last_message_at && (
                  <span className="text-xs text-gray-400 shrink-0">{timeAgo(card.last_message_at)}</span>
                )}
              </div>
              <div className="flex items-center justify-between gap-2">
                <span className={`text-sm truncate ${card.unread_count > 0 ? 'text-gray-900 dark:text-white font-semibold' : 'text-gray-500 dark:text-gray-400'}`}>
                  {preview}
                </span>
                {card.unread_count > 0 && (
                  <span className="shrink-0 bg-red-500 text-white text-xs font-semibold rounded-full min-w-5 h-5 px-1.5 flex items-center justify-center">
                    {card.unread_count > 99 ? '99+' : card.unread_count}
                  </span>
                )}
              </div>
            </div>
          </div>
        );
      })}
    </>
  );
}
