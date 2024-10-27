"use client"
import { useContext } from 'react'
import Image from 'next/image';
import Link from 'next/link';
import avator from '../../public/logo/logo.png';
import useFetchData from '../hooks/useFetchData';
import { AuthContext } from '@/context/AuthContext';

export default function GroupChatList() {
  const { authUser } = useContext(AuthContext);
  const userId = authUser?.id; // Assuming authUser has an 'id' property

  const { data: response, loading, error } = useFetchData(`/api/users/${userId}/groups`);

  const groups = response?.data || []; // Extract the groups array from the response

  console.log("groups list", groups);

  if (loading) return <p className="text-center">Loading...</p>;
  if (error) return <p className="text-center">Error: {error}</p>;
  if (groups.length === 0) return <p className="text-center">There is no group</p>;

  return (
    <>
      {groups.map((group, index) => (
        <Link key={index} href={`/groups/group`} passHref className="flex gap-2 w-full cursor-pointer p-2 rounded-md transition-colors duration-200 hover:bg-white hover:bg-opacity-70 active:bg-white active:bg-opacity-70 dark:hover:bg-gray-700 dark:active:bg-gray-600">
          <Image className="w-10 h-10 border-2 border-white rounded-full dark:border-gray-800" src={avator} alt="Avatar" width={40} height={40} /> 
          <div className="font-medium dark:text-white hide-on-100px">
            <div className="font-bold">{group.name}</div>
            <div className="text-sm text-gray-500 dark:text-gray-400 truncate">{group.lastmessage}</div>
          </div>
        </Link>
      ))}
    </>
  );
}
