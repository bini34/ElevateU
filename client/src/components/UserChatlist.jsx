"use client";
import { useEffect, useState, useContext } from 'react';
import Image from 'next/image';
import avator from '../../public/images/avator.png';
import { fetcher } from '../utils/fetcher';
import { useRouter } from 'next/navigation';
import { useData } from '@/context/DataContext';
import { AuthContext } from '@/context/AuthContext';
export default function UserChatlist({ userId }) {
  const router = useRouter();
  const { authUser } = useContext(AuthContext);
  const [users, setUsers] = useState([]);
  const { data, setData } = useData();  // Keep track of `data` to avoid unnecessary updates

  useEffect(() => {
    if (!authUser) {
      console.error('Auth user is not available');
      return;
    }

    console.log("auth user from user chatlist", authUser);

    const fetchUsers = async () => {
      try {
        const url = `/api/message-cards/${authUser.id}`;
        console.log("Fetching URL:", url);

        const data = await fetcher(url);
        console.log("Data from user chatlist:", data);

        if (JSON.stringify(users) !== JSON.stringify(data)) {
          setUsers(data);
        }
      } catch (error) {
        console.error("Failed to fetch users:", error);
      }
    };

    if (authUser) {
      fetchUsers();
    }
  }, [authUser]);

  const handleUserClick = (user) => {
    // Avoid updating context or causing re-renders unnecessarily
    if (JSON.stringify(data) !== JSON.stringify(user)) {
      setData(user);
      console.log('user from context:', user);
    }

    // Navigate to the chat page only if a valid user ID exists
    if (user.user_id) {
      router.push(`/chat/${user.user_id}`);
    } else {
      console.error('User ID is not available');
    }
  };

  return (
    <>
      {users.length > 0 && users.map((user, index) => (
        <div 
          key={index} 
          onClick={() => handleUserClick(user)} 
          className="flex items-center gap-4 w-full cursor-pointer p-2 rounded-md transition-colors duration-200 hover:bg-gray-100 active:bg-gray-200 dark:hover:bg-gray-700 dark:active:bg-gray-600"
        >
          <div className="relative">
            <Image className="rounded-full" width={40} height={40} src={user.profile_picture_URL || avator} alt="avatar" />
            <span className="bottom-0 left-7 absolute w-3.5 h-3.5 bg-green-400 border-2 border-white dark:border-gray-800 rounded-full"></span>
          </div>
          <div className="font-medium dark:text-white hide-on-100px">
            <div className="font-bold">{`${user.first_name} ${user.last_name}`}</div>
            <div className="text-sm text-gray-500 dark:text-gray-400">{user.last_message || (new Date(user.joined_at).toLocaleDateString())}</div>
          </div>
        </div>
      ))}
    </>
  );
}
