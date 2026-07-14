"use client"
import { useContext } from 'react'
import Image from 'next/image';
import avator from '../../public/images/avator.png';
import useFetchData from '../hooks/useFetchData';
import { AuthContext } from '@/context/AuthContext';
import { useData } from '@/context/DataContext';
import { useRouter } from 'next/navigation';

export default function GroupChatList() {
  const router = useRouter();
  const { authUser } = useContext(AuthContext);
  const { setData } = useData();

  // Wait for the session to hydrate before fetching
  const { data: response, loading, error } = useFetchData(authUser?.id ? `/users/${authUser.id}/groups` : null);

  const groups = response?.data || [];

  if (loading || !authUser) return <p className="text-center text-gray-400 py-4">Loading groups…</p>;
  if (error) return <p className="text-center text-gray-500 py-4 px-2 text-sm">{error}</p>;
  if (groups.length === 0) return <p className="text-center text-gray-400 py-4 text-sm">No groups yet — create one with the + button.</p>;

  const handleGroupSelect = (group) => {
    setData(group);
    if (group.id) {
      router.push(`/groups/${group.id}`);
    }
  };

  return (
    <>
      {groups.map((group) => (
        <div key={group.id} className="flex items-center gap-2 w-full cursor-pointer p-2 rounded-md transition-colors duration-200 hover:bg-white hover:bg-opacity-70 active:bg-white active:bg-opacity-70 dark:hover:bg-gray-700 dark:active:bg-gray-600" onClick={() => handleGroupSelect(group)}>
          <Image className="w-10 h-10 border-2 border-white rounded-full dark:border-gray-800" src={avator} alt={`${group.name} avatar`} width={40} height={40} />
          <div className="font-medium dark:text-white hide-on-100px min-w-0">
            <div className="font-bold truncate">{group.name}</div>
            {group.description && (
              <div className="text-sm text-gray-500 dark:text-gray-400 truncate">{group.description}</div>
            )}
          </div>
        </div>
      ))}
    </>
  );
}
